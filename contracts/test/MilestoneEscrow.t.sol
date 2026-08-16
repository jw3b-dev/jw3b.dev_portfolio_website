// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MilestoneEscrow} from "../src/MilestoneEscrow.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";
import {ReentrantUSDC} from "./mocks/ReentrantUSDC.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/**
 * MilestoneEscrow — FR-032/FR-033 · SDD 02 §9. Every state transition, every access-control
 * branch, and the edge cases (zero amount/address, double-settle, unauthorized, re-entrancy)
 * are exercised — the happy path is where bugs hide least. USDC is 6-dec throughout (BR-06/09).
 */
contract MilestoneEscrowTest is Test {
    MilestoneEscrow escrow;
    MockUSDC usdc;

    address owner = makeAddr("owner"); // arbiter
    address client = makeAddr("client"); // payer
    address provider = makeAddr("provider"); // payee (John's business wallet)
    address stranger = makeAddr("stranger");

    uint256 constant AMOUNT = 5_000_000000; // 5,000 USDC at 6-dec
    bytes32 constant MILESTONE = keccak256("phase-1: threat model + scope");

    event Funded(
        uint256 indexed id, address indexed client, address indexed provider, uint256 amount, bytes32 milestone
    );
    event Released(uint256 indexed id, address indexed provider, uint256 amount);
    event Refunded(uint256 indexed id, address indexed client, uint256 amount);

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new MilestoneEscrow(IERC20(address(usdc)), owner);
        usdc.mint(client, 1_000_000_000000); // 1,000,000 USDC
    }

    // ── helpers ────────────────────────────────────────────────────────────────────────
    function _fund(uint256 amount) internal returns (uint256 id) {
        vm.startPrank(client);
        usdc.approve(address(escrow), amount);
        id = escrow.fund(provider, amount, MILESTONE);
        vm.stopPrank();
    }

    // ── constructor ──────────────────────────────────────────────────────────────────────
    function test_constructor_setsTokenAndOwner() public view {
        assertEq(address(escrow.usdc()), address(usdc));
        assertEq(escrow.owner(), owner);
        assertEq(escrow.nextId(), 0);
    }

    function test_constructor_revertsOnZeroToken() public {
        vm.expectRevert(MilestoneEscrow.ZeroAddress.selector);
        new MilestoneEscrow(IERC20(address(0)), owner);
    }

    // ── fund ─────────────────────────────────────────────────────────────────────────────
    function test_fund_happyPath_movesUsdcAndRecordsAgreement() public {
        vm.startPrank(client);
        usdc.approve(address(escrow), AMOUNT);
        vm.expectEmit(true, true, true, true);
        emit Funded(0, client, provider, AMOUNT, MILESTONE);
        uint256 id = escrow.fund(provider, AMOUNT, MILESTONE);
        vm.stopPrank();

        assertEq(id, 0);
        assertEq(escrow.nextId(), 1);
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);

        MilestoneEscrow.Agreement memory a = escrow.getAgreement(id);
        assertEq(a.client, client);
        assertEq(a.provider, provider);
        assertEq(a.amount, AMOUNT);
        assertEq(a.milestone, MILESTONE);
        assertEq(uint256(a.state), uint256(MilestoneEscrow.State.Funded));
    }

    function test_fund_incrementsIdsIndependently() public {
        uint256 id0 = _fund(AMOUNT);
        uint256 id1 = _fund(AMOUNT);
        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT * 2);
    }

    function test_fund_revertsOnZeroAmount() public {
        vm.prank(client);
        vm.expectRevert(MilestoneEscrow.ZeroAmount.selector);
        escrow.fund(provider, 0, MILESTONE);
    }

    function test_fund_revertsOnZeroProvider() public {
        vm.prank(client);
        vm.expectRevert(MilestoneEscrow.ZeroAddress.selector);
        escrow.fund(address(0), AMOUNT, MILESTONE);
    }

    function test_fund_revertsWithoutApproval() public {
        vm.prank(client);
        vm.expectRevert(); // SafeERC20: allowance 0
        escrow.fund(provider, AMOUNT, MILESTONE);
    }

    // ── release ──────────────────────────────────────────────────────────────────────────
    function test_release_byClient_paysProvider() public {
        uint256 id = _fund(AMOUNT);
        vm.expectEmit(true, true, false, true);
        emit Released(id, provider, AMOUNT);
        vm.prank(client);
        escrow.release(id);

        assertEq(usdc.balanceOf(provider), AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(uint256(escrow.getAgreement(id).state), uint256(MilestoneEscrow.State.Released));
    }

    function test_release_byOwnerArbiter_paysProvider() public {
        uint256 id = _fund(AMOUNT);
        vm.prank(owner);
        escrow.release(id);
        assertEq(usdc.balanceOf(provider), AMOUNT);
    }

    function test_release_revertsForStranger() public {
        uint256 id = _fund(AMOUNT);
        vm.prank(stranger);
        vm.expectRevert(MilestoneEscrow.NotAuthorized.selector);
        escrow.release(id);
    }

    function test_release_revertsIfNotFunded() public {
        vm.prank(client);
        vm.expectRevert(MilestoneEscrow.NotFunded.selector);
        escrow.release(0); // never funded
    }

    // ── refund ───────────────────────────────────────────────────────────────────────────
    function test_refund_byProvider_returnsToClient() public {
        uint256 before = usdc.balanceOf(client);
        uint256 id = _fund(AMOUNT);
        vm.expectEmit(true, true, false, true);
        emit Refunded(id, client, AMOUNT);
        vm.prank(provider);
        escrow.refund(id);

        assertEq(usdc.balanceOf(client), before); // whole amount back
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(uint256(escrow.getAgreement(id).state), uint256(MilestoneEscrow.State.Refunded));
    }

    function test_refund_byOwnerArbiter_returnsToClient() public {
        uint256 id = _fund(AMOUNT);
        vm.prank(owner);
        escrow.refund(id);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_refund_revertsForStranger() public {
        uint256 id = _fund(AMOUNT);
        vm.prank(stranger);
        vm.expectRevert(MilestoneEscrow.NotAuthorized.selector);
        escrow.refund(id);
    }

    // ── no double-settle (one-way state) ─────────────────────────────────────────────────
    function test_cannotReleaseThenRefund() public {
        uint256 id = _fund(AMOUNT);
        vm.prank(client);
        escrow.release(id);
        vm.prank(owner);
        vm.expectRevert(MilestoneEscrow.NotFunded.selector);
        escrow.refund(id);
    }

    function test_cannotReleaseTwice() public {
        uint256 id = _fund(AMOUNT);
        vm.prank(client);
        escrow.release(id);
        vm.prank(owner);
        vm.expectRevert(MilestoneEscrow.NotFunded.selector);
        escrow.release(id);
    }

    // ── re-entrancy (the auditor's own contract must be exemplary) ────────────────────────
    function test_reentrancy_onReleaseCannotDrain() public {
        ReentrantUSDC evil = new ReentrantUSDC();
        MilestoneEscrow evilEscrow = new MilestoneEscrow(IERC20(address(evil)), owner);
        evil.mint(client, AMOUNT);

        vm.startPrank(client);
        evil.approve(address(evilEscrow), AMOUNT);
        uint256 id = evilEscrow.fund(provider, AMOUNT, MILESTONE);
        vm.stopPrank();

        evil.arm(evilEscrow, id); // on payout, re-enter release(id)

        // The outer release triggers the token's re-entrant release(); the guard makes the
        // whole call revert, so no funds move at all — a drain would need two payouts.
        vm.prank(client);
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        evilEscrow.release(id);

        assertEq(evil.balanceOf(provider), 0);
        assertEq(evil.balanceOf(address(evilEscrow)), AMOUNT); // still fully held, nothing drained
    }

    // ── fuzz: value conservation across the lifecycle ────────────────────────────────────
    function testFuzz_fundThenRelease_conservesValue(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000_000000); // 1 base unit .. 1,000,000 USDC
        uint256 clientBefore = usdc.balanceOf(client);

        vm.startPrank(client);
        usdc.approve(address(escrow), amount);
        uint256 id = escrow.fund(provider, amount, MILESTONE);
        vm.stopPrank();

        assertEq(usdc.balanceOf(client), clientBefore - amount);
        assertEq(usdc.balanceOf(address(escrow)), amount);

        vm.prank(owner);
        escrow.release(id);

        assertEq(usdc.balanceOf(provider), amount);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function testFuzz_fundThenRefund_returnsExactly(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000_000000);
        uint256 clientBefore = usdc.balanceOf(client);

        vm.startPrank(client);
        usdc.approve(address(escrow), amount);
        uint256 id = escrow.fund(provider, amount, MILESTONE);
        vm.stopPrank();

        vm.prank(owner);
        escrow.refund(id);

        assertEq(usdc.balanceOf(client), clientBefore); // exact round-trip, no dust
        assertEq(usdc.balanceOf(provider), 0);
    }
}

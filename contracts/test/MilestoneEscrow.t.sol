// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MilestoneEscrow, IERC20} from "../src/MilestoneEscrow.sol";
import {MockERC20, FeeOnTransferERC20} from "./mocks/MockERC20.sol";

contract MilestoneEscrowTest is Test {
    MockERC20 internal token;
    MilestoneEscrow internal escrow;

    address internal client = makeAddr("client");
    address internal provider = makeAddr("provider");
    uint256 internal deadline;

    uint256[] internal amounts;

    function setUp() public {
        token = new MockERC20();
        deadline = block.timestamp + 30 days;
        amounts = [uint256(1_000e6), 2_000e6, 3_000e6]; // 6k USDC total
        escrow = new MilestoneEscrow(client, provider, address(token), deadline, amounts);
        token.mint(client, 6_000e6);
        vm.prank(client);
        token.approve(address(escrow), type(uint256).max);
    }

    function _fund() internal {
        vm.prank(client);
        escrow.fund();
    }

    // --- Construction ---

    function test_Construction() public view {
        assertEq(escrow.client(), client);
        assertEq(escrow.provider(), provider);
        assertEq(escrow.totalAmount(), 6_000e6);
        assertEq(escrow.milestoneCount(), 3);
        assertEq(escrow.outstanding(), 6_000e6);
    }

    function test_Construction_RevertZeroAddress() public {
        vm.expectRevert(MilestoneEscrow.BadAddress.selector);
        new MilestoneEscrow(address(0), provider, address(token), deadline, amounts);
    }

    function test_Construction_RevertEoaToken() public {
        vm.expectRevert(MilestoneEscrow.BadAddress.selector);
        new MilestoneEscrow(client, provider, makeAddr("eoa"), deadline, amounts);
    }

    function test_Construction_RevertNoMilestones() public {
        uint256[] memory empty;
        vm.expectRevert(MilestoneEscrow.NoMilestones.selector);
        new MilestoneEscrow(client, provider, address(token), deadline, empty);
    }

    function test_Construction_RevertZeroAmount() public {
        uint256[] memory bad = new uint256[](2);
        bad[0] = 1e6;
        bad[1] = 0;
        vm.expectRevert(MilestoneEscrow.ZeroAmount.selector);
        new MilestoneEscrow(client, provider, address(token), deadline, bad);
    }

    // --- fund ---

    function test_Fund() public {
        _fund();
        assertTrue(escrow.funded());
        assertEq(token.balanceOf(address(escrow)), 6_000e6);
    }

    function test_Fund_RevertNotClient() public {
        vm.expectRevert(MilestoneEscrow.NotClient.selector);
        vm.prank(provider);
        escrow.fund();
    }

    function test_Fund_RevertAlreadyFunded() public {
        _fund();
        vm.expectRevert(MilestoneEscrow.AlreadyFunded.selector);
        vm.prank(client);
        escrow.fund();
    }

    function test_Fund_RejectsFeeOnTransferToken() public {
        FeeOnTransferERC20 feeToken = new FeeOnTransferERC20();
        MilestoneEscrow feeEscrow = new MilestoneEscrow(client, provider, address(feeToken), deadline, amounts);
        feeToken.mint(client, 6_000e6);
        vm.startPrank(client);
        feeToken.approve(address(feeEscrow), type(uint256).max);
        vm.expectRevert(MilestoneEscrow.TransferFailed.selector);
        feeEscrow.fund();
        vm.stopPrank();
    }

    // --- approve ---

    function test_Approve() public {
        _fund();
        vm.prank(client);
        escrow.approve(0);
        (, MilestoneEscrow.Status status) = escrow.milestones(0);
        assertEq(uint256(status), uint256(MilestoneEscrow.Status.Approved));
    }

    function test_Approve_RevertNotFunded() public {
        vm.expectRevert(MilestoneEscrow.NotFunded.selector);
        vm.prank(client);
        escrow.approve(0);
    }

    function test_Approve_RevertNotClient() public {
        _fund();
        vm.expectRevert(MilestoneEscrow.NotClient.selector);
        vm.prank(provider);
        escrow.approve(0);
    }

    function test_Approve_RevertBadMilestone() public {
        _fund();
        vm.expectRevert(MilestoneEscrow.BadMilestone.selector);
        vm.prank(client);
        escrow.approve(99);
    }

    function test_Approve_RevertDoubleApprove() public {
        _fund();
        vm.startPrank(client);
        escrow.approve(0);
        vm.expectRevert(MilestoneEscrow.BadStatus.selector);
        escrow.approve(0);
        vm.stopPrank();
    }

    // --- release ---

    function test_Release_PaysProvider() public {
        _fund();
        vm.prank(client);
        escrow.approve(1);
        // Permissionless: a random caller can trigger the payout to the provider.
        vm.prank(makeAddr("anyone"));
        escrow.release(1);
        assertEq(token.balanceOf(provider), 2_000e6);
        assertEq(escrow.outstanding(), 4_000e6);
    }

    function test_Release_RevertNotApproved() public {
        _fund();
        vm.expectRevert(MilestoneEscrow.BadStatus.selector);
        escrow.release(0);
    }

    function test_Release_RevertDoubleRelease() public {
        _fund();
        vm.prank(client);
        escrow.approve(0);
        escrow.release(0);
        vm.expectRevert(MilestoneEscrow.BadStatus.selector);
        escrow.release(0);
    }

    // --- refund ---

    function test_Refund_AfterDeadline() public {
        _fund();
        vm.warp(deadline);
        vm.prank(client);
        escrow.refund(2);
        assertEq(token.balanceOf(client), 3_000e6);
        assertEq(escrow.outstanding(), 3_000e6);
    }

    function test_Refund_RevertBeforeDeadline() public {
        _fund();
        vm.expectRevert(MilestoneEscrow.BeforeDeadline.selector);
        vm.prank(client);
        escrow.refund(0);
    }

    function test_Refund_RevertNotClient() public {
        _fund();
        vm.warp(deadline);
        vm.expectRevert(MilestoneEscrow.NotClient.selector);
        vm.prank(provider);
        escrow.refund(0);
    }

    function test_Refund_RevertOnApprovedMilestone() public {
        _fund();
        vm.prank(client);
        escrow.approve(0);
        vm.warp(deadline);
        // Approved milestones belong to the provider; the client cannot claw them back.
        vm.expectRevert(MilestoneEscrow.BadStatus.selector);
        vm.prank(client);
        escrow.refund(0);
    }

    // --- Full lifecycle solvency ---

    function test_Lifecycle_Solvent() public {
        _fund();
        vm.startPrank(client);
        escrow.approve(0);
        escrow.approve(1);
        vm.stopPrank();
        escrow.release(0);
        vm.warp(deadline);
        vm.prank(client);
        escrow.refund(2); // milestone 2 never approved
        // escrow held exactly what it owed at every step
        assertEq(token.balanceOf(provider), 1_000e6);
        assertEq(token.balanceOf(client), 3_000e6);
        assertEq(token.balanceOf(address(escrow)), escrow.outstanding()); // == milestone 1 (approved, unclaimed)
        assertEq(escrow.outstanding(), 2_000e6);
    }

    // --- Fuzz (one per state-changing function) ---

    function testFuzz_Fund(uint128 a0, uint128 a1) public {
        vm.assume(a0 > 0 && a1 > 0);
        uint256[] memory amts = new uint256[](2);
        amts[0] = a0;
        amts[1] = a1;
        MilestoneEscrow e = new MilestoneEscrow(client, provider, address(token), deadline, amts);
        uint256 total = uint256(a0) + a1;
        token.mint(client, total);
        vm.startPrank(client);
        token.approve(address(e), total);
        e.fund();
        vm.stopPrank();
        assertEq(token.balanceOf(address(e)), total);
        assertEq(e.outstanding(), total);
    }

    function testFuzz_Approve(uint256 id) public {
        _fund();
        id = bound(id, 0, escrow.milestoneCount() - 1);
        vm.prank(client);
        escrow.approve(id);
        (, MilestoneEscrow.Status status) = escrow.milestones(id);
        assertEq(uint256(status), uint256(MilestoneEscrow.Status.Approved));
    }

    function testFuzz_Release(uint256 id) public {
        _fund();
        id = bound(id, 0, escrow.milestoneCount() - 1);
        (uint128 amount,) = escrow.milestones(id);
        vm.prank(client);
        escrow.approve(id);
        escrow.release(id);
        assertEq(token.balanceOf(provider), amount);
    }

    function testFuzz_Refund(uint256 id, uint256 warpBy) public {
        _fund();
        id = bound(id, 0, escrow.milestoneCount() - 1);
        warpBy = bound(warpBy, 0, 365 days);
        (uint128 amount,) = escrow.milestones(id);
        vm.warp(deadline + warpBy);
        vm.prank(client);
        escrow.refund(id);
        assertEq(token.balanceOf(client), amount);
    }
}

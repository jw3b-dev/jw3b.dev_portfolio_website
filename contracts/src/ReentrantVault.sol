// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title  ReentrantVault  —  ⚠️ INTENTIONALLY VULNERABLE (CTF target)
 * @notice The "Capture the Vault" challenge (FR-022/FR-027, SDD 02 §10). This contract is
 *         DELIBERATELY exploitable via a classic ETH reentrancy — that is the whole point:
 *         a visitor deploys an Attacker, drains it, and the Worker verifies the drain
 *         on-chain (RPC read) before recording a solve.
 *
 *         Deployed to **Base Sepolia only** — testnet, NO REAL FUNDS (BR-09/FR-024). Every
 *         surface that references it must label it a testnet demo. NEVER deploy this to a
 *         mainnet or fund it with anything of value; it hands its entire balance to the
 *         first competent attacker, by design.
 *
 * @dev    The bug (do NOT "fix" it — it is the challenge): `withdraw()` makes the external
 *         ETH call BEFORE it zeroes the caller's balance and carries no reentrancy guard, so
 *         a contract that re-enters `withdraw()` from its `receive()` is paid its balance
 *         repeatedly until the vault is empty — the textbook checks-effects-interactions
 *         violation the /audit heuristic flags on the very sample contract shown in the hero.
 */
contract ReentrantVault {
    mapping(address => uint256) public balances;

    event Deposited(address indexed who, uint256 amount);
    event Withdrawn(address indexed who, uint256 amount);

    /// Credit ETH to the caller's balance. Honest users deposit and later withdraw their own.
    function deposit() external payable {
        require(msg.value > 0, "zero deposit");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice ⚠️ VULNERABLE. Sends ETH via a low-level call BEFORE zeroing the balance and
    ///         with no guard — a re-entrant caller drains the whole vault (the CTF).
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");

        (bool ok,) = msg.sender.call{value: amount}(""); // ← re-enters here (interaction before effect)
        require(ok, "eth send failed");

        balances[msg.sender] = 0; // ← effect applied too late to stop the loop
        emit Withdrawn(msg.sender, amount);
    }

    /// Total ETH held — what the Worker reads to confirm a drain (balance → ~0).
    function totalHeld() external view returns (uint256) {
        return address(this).balance;
    }

    /// Accept a plain ETH send as an un-credited bounty (owner seeds the prize for solvers).
    receive() external payable {}
}

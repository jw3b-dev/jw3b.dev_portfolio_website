// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title  ReentrantVault — ⚠️ DELIBERATELY VULNERABLE (CTF target). Do NOT deploy to mainnet.
/// @notice A textbook reentrancy honeypot for the jw3b.dev security showcase: `withdraw()`
///         sends ETH out *before* zeroing the caller's balance, so a malicious contract can
///         re-enter during the ETH callback and drain every depositor's funds.
/// @dev    The exploit + the fix are demonstrated in test/ctf/ReentrancyExploit.t.sol.
///         The fixed version is SafeVault.sol (Checks-Effects-Interactions + a reentrancy guard).
contract ReentrantVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");

        // ❌ VULNERABILITY: interaction BEFORE effect. The external call hands control to the
        // caller while `balances[msg.sender]` is still non-zero, enabling reentrancy.
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");

        balances[msg.sender] = 0; // effect happens too late
    }

    function totalDeposits() external view returns (uint256) {
        return address(this).balance;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title  SafeVault — the fixed counterpart to ReentrantVault.
/// @notice Same interface, but immune to the reentrancy drain: it zeroes the balance BEFORE
///         the external call (Checks-Effects-Interactions) and adds a reentrancy guard as
///         defence-in-depth. The exploit in test/ctf/ReentrancyExploit.t.sol fails against this.
contract SafeVault {
    mapping(address => uint256) public balances;
    uint256 private _lock = 1;

    modifier nonReentrant() {
        require(_lock == 1, "reentrant");
        _lock = 2;
        _;
        _lock = 1;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");

        balances[msg.sender] = 0; // ✅ effect BEFORE interaction

        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }

    function totalDeposits() external view returns (uint256) {
        return address(this).balance;
    }
}

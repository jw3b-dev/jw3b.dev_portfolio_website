// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {MilestoneEscrow} from "../../src/MilestoneEscrow.sol";

/// @notice A malicious 6-dec token: on every outbound `transfer` it re-enters the escrow's
///         `release`, attempting to drain a second payout for the same agreement. Used to
///         prove the ReentrancyGuard + checks-effects-interactions actually hold — the
///         re-entrant call must revert, so the token move never doubles.
contract ReentrantUSDC is ERC20 {
    MilestoneEscrow public escrow;
    uint256 public targetId;
    bool public attacking;

    constructor() ERC20("Evil USD", "eUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function arm(MilestoneEscrow _escrow, uint256 _targetId) external {
        escrow = _escrow;
        targetId = _targetId;
        attacking = true;
    }

    /// On the escrow paying out, try to re-enter release() for the same id.
    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (attacking && from == address(escrow)) {
            attacking = false; // one shot — avoid infinite recursion masking the real revert
            escrow.release(targetId); // MUST revert (nonReentrant / already settled)
        }
    }
}

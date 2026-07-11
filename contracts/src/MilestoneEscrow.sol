// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Minimal ERC-20 surface used by the escrow.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title  MilestoneEscrow
/// @author John Wellard (JW3B / AgileGypsy)
/// @notice Milestone-based token escrow for a single client ↔ provider engagement
///         (e.g. a USDC-on-Base retainer). The client funds the full engagement up
///         front; each milestone is released to the provider only after the client
///         approves it. Any milestone still unapproved after `deadline` can be
///         refunded to the client — so funds are never trapped.
/// @dev    Security posture (this is a security-auditor's reference implementation):
///         - Strict Checks-Effects-Interactions on every state-changing path.
///         - A reentrancy guard as defence-in-depth around token interactions.
///         - Return-value-checked transfers that tolerate non-standard ERC-20s.
///         - `fund()` verifies the exact amount arrived, rejecting fee-on-transfer /
///           deflationary tokens (the accounting assumes a standard token like USDC).
///         Each milestone settles exactly once: Pending → Approved → Released, or
///         Pending → Refunded.
contract MilestoneEscrow {
    enum Status {
        Pending,
        Approved,
        Released,
        Refunded
    }

    struct Milestone {
        uint128 amount;
        Status status;
    }

    // --- Immutable configuration ---
    address public immutable client;
    address public immutable provider;
    IERC20 public immutable token;
    uint256 public immutable deadline;
    uint256 public immutable totalAmount;

    // --- Mutable state ---
    Milestone[] public milestones;
    bool public funded;
    uint256 private _lock = 1;

    // --- Events ---
    event Funded(uint256 total);
    event MilestoneApproved(uint256 indexed id);
    event MilestoneReleased(uint256 indexed id, uint256 amount);
    event MilestoneRefunded(uint256 indexed id, uint256 amount);

    // --- Errors ---
    error NotClient();
    error AlreadyFunded();
    error NotFunded();
    error BadAddress();
    error BadMilestone();
    error BadStatus();
    error BeforeDeadline();
    error NoMilestones();
    error ZeroAmount();
    error AmountTooLarge();
    error Reentrancy();
    error TransferFailed();

    modifier onlyClient() {
        if (msg.sender != client) revert NotClient();
        _;
    }

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    /// @param _client   Party funding the engagement and approving milestones.
    /// @param _provider Party paid on release (John).
    /// @param _token    ERC-20 payment token (USDC on Base).
    /// @param _deadline Timestamp after which unapproved milestones become refundable.
    /// @param _amounts  Per-milestone amounts, in token base units. Must be non-empty.
    constructor(
        address _client,
        address _provider,
        address _token,
        uint256 _deadline,
        uint256[] memory _amounts
    ) {
        if (_client == address(0) || _provider == address(0)) revert BadAddress();
        if (_token.code.length == 0) revert BadAddress();
        if (_amounts.length == 0) revert NoMilestones();

        client = _client;
        provider = _provider;
        token = IERC20(_token);
        deadline = _deadline;

        uint256 sum = 0;
        uint256 len = _amounts.length;
        for (uint256 i; i < len; ++i) {
            uint256 amt = _amounts[i];
            if (amt == 0) revert ZeroAmount();
            if (amt > type(uint128).max) revert AmountTooLarge();
            milestones.push(Milestone({amount: uint128(amt), status: Status.Pending}));
            sum += amt;
        }
        totalAmount = sum;
    }

    /// @notice Client deposits the full engagement (sum of all milestone amounts).
    /// @dev    Reverts unless exactly `totalAmount` is received (fee-on-transfer guard).
    function fund() external onlyClient nonReentrant {
        if (funded) revert AlreadyFunded();
        funded = true; // effect before interaction

        // Reentrancy-safe: this fn is nonReentrant and `funded` is already set, so a
        // token callback cannot re-enter fund/release/refund. The balance delta rejects
        // fee-on-transfer / rebasing tokens (slither reentrancy-balance here is a FP).
        uint256 balBefore = token.balanceOf(address(this));
        _safeTransferFrom(msg.sender, address(this), totalAmount);
        if (token.balanceOf(address(this)) - balBefore != totalAmount) revert TransferFailed();

        emit Funded(totalAmount);
    }

    /// @notice Client approves a milestone, making it claimable by the provider.
    function approve(uint256 id) external onlyClient {
        if (!funded) revert NotFunded();
        Milestone storage m = _milestone(id);
        if (m.status != Status.Pending) revert BadStatus();
        m.status = Status.Approved;
        emit MilestoneApproved(id);
    }

    /// @notice Release an approved milestone to the provider. Permissionless: funds
    ///         always go to `provider`, so anyone may trigger the payout (liveness).
    function release(uint256 id) external nonReentrant {
        Milestone storage m = _milestone(id);
        if (m.status != Status.Approved) revert BadStatus();
        m.status = Status.Released; // effect
        uint256 amount = m.amount;
        _safeTransfer(provider, amount); // interaction
        emit MilestoneReleased(id, amount);
    }

    /// @notice After `deadline`, the client may reclaim any still-unapproved milestone.
    ///         Approved-but-unclaimed milestones remain the provider's to release.
    function refund(uint256 id) external onlyClient nonReentrant {
        if (block.timestamp < deadline) revert BeforeDeadline();
        Milestone storage m = _milestone(id);
        if (m.status != Status.Pending) revert BadStatus();
        m.status = Status.Refunded; // effect
        uint256 amount = m.amount;
        _safeTransfer(client, amount); // interaction
        emit MilestoneRefunded(id, amount);
    }

    // --- Views ---

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    /// @notice Amount still held in escrow for unsettled (Pending/Approved) milestones.
    function outstanding() public view returns (uint256 sum) {
        uint256 len = milestones.length;
        for (uint256 i; i < len; ++i) {
            Status s = milestones[i].status;
            if (s == Status.Pending || s == Status.Approved) sum += milestones[i].amount;
        }
    }

    // --- Internal ---

    function _milestone(uint256 id) private view returns (Milestone storage) {
        if (id >= milestones.length) revert BadMilestone();
        return milestones[id];
    }

    function _safeTransfer(address to, uint256 amount) private {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransferFrom(address from, address to, uint256 amount) private {
        (bool ok, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }
}

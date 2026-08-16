// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title  MilestoneEscrow
 * @notice USDC-on-Base milestone escrow for jw3b.dev's high-ticket engagement rail
 *         (FR-032/FR-033, SDD 02 §9). A client funds an agreement for a provider and a
 *         milestone; the funds settle to exactly one of two terminal states —
 *         `Released` (provider paid, on milestone acceptance) or `Refunded` (client
 *         returned) — matching the authoritative on-chain state set the D1 escrow index
 *         mirrors: funded / released / refunded (DE-03, 03 §4).
 *
 * @dev    Design rules this contract implements (each branch cites the rule):
 *         - USDC is 6-decimal; amounts are integer base units, never floats (BR-06/09).
 *         - Chain is authoritative for money; D1 only mirrors (SDD 05). So state
 *           transitions are one-way and guarded: Funded → {Released | Refunded}, never back.
 *         - Checks-Effects-Interactions + ReentrancyGuard + SafeERC20 on every transfer —
 *           this is a security auditor's own contract; it must be exemplary, not merely
 *           functional. State is written before the token moves so a malicious token
 *           callback re-enters into an already-settled agreement (NotFunded revert).
 *         - Two-sided authority with an arbiter: the client releases on acceptance, the
 *           provider may voluntarily refund, and the owner (arbiter, owner-provisioned at
 *           deploy) can do either to resolve a dispute. No single party can both take and
 *           reclaim the same funds.
 *
 *         USDC on Base is a standard, non-fee-on-transfer ERC-20, so `amount` funded equals
 *         `amount` settled; this contract is scoped to that token and does not defend
 *         against fee-on-transfer or rebasing tokens (out of domain).
 */
contract MilestoneEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The settlement token — Base USDC (6-dec). Immutable: one escrow, one token.
    IERC20 public immutable usdc;

    /// @notice Lifecycle of an agreement. `None` is the zero-value (unset id) sentinel;
    ///         the three live states mirror the D1 `escrow_agreements.state` CHECK.
    enum State {
        None,
        Funded,
        Released,
        Refunded
    }

    struct Agreement {
        address client; // payer — funds the escrow, can release, receives refunds
        address provider; // payee — receives released funds
        uint256 amount; // USDC base units (6-dec)
        bytes32 milestone; // keccak of the off-chain milestone descriptor (text lives in D1)
        State state;
    }

    /// @notice Agreements by monotonic id. `nextId` is the id the next `fund` will assign.
    mapping(uint256 => Agreement) public agreements;
    uint256 public nextId;

    event Funded(
        uint256 indexed id, address indexed client, address indexed provider, uint256 amount, bytes32 milestone
    );
    event Released(uint256 indexed id, address indexed provider, uint256 amount);
    event Refunded(uint256 indexed id, address indexed client, uint256 amount);

    error ZeroAmount();
    error ZeroAddress();
    error NotFunded();
    error NotAuthorized();

    /**
     * @param _usdc        Base USDC token address (6-dec ERC-20).
     * @param initialOwner Arbiter / contract owner (owner-provisioned at deploy). Named to
     *                     match OZ `Ownable` and avoid shadowing its private `_owner` (Slither).
     */
    constructor(IERC20 _usdc, address initialOwner) Ownable(initialOwner) {
        if (address(_usdc) == address(0)) revert ZeroAddress();
        usdc = _usdc;
    }

    /**
     * @notice Fund a new escrow agreement. Caller (client) must have approved this contract
     *         for `amount` USDC first — the client-side flow is Simulate → Write → Wait
     *         (FR-033), and the simulate step surfaces an insufficient allowance before any
     *         wallet prompt.
     * @dev    Effects (record the Funded agreement, bump `nextId`) precede the interaction
     *         (pull the tokens), and `nonReentrant` guards the whole call. If the transfer
     *         reverts, the agreement write reverts with it — no half-funded state.
     * @return id The new agreement id.
     */
    function fund(address provider, uint256 amount, bytes32 milestone) external nonReentrant returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (provider == address(0)) revert ZeroAddress();

        id = nextId++;
        agreements[id] = Agreement({
            client: msg.sender, provider: provider, amount: amount, milestone: milestone, state: State.Funded
        });

        emit Funded(id, msg.sender, provider, amount, milestone);
        usdc.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Release a funded agreement's USDC to the provider — the milestone-accepted
     *         path. Authorized by the client (acceptance) or the owner (arbiter).
     * @dev    CEI: state → Released before the transfer, so a re-entrant call sees a
     *         settled agreement and reverts `NotFunded`.
     */
    function release(uint256 id) external nonReentrant {
        Agreement storage a = agreements[id];
        if (a.state != State.Funded) revert NotFunded();
        if (msg.sender != a.client && msg.sender != owner()) revert NotAuthorized();

        a.state = State.Released;
        emit Released(id, a.provider, a.amount);
        usdc.safeTransfer(a.provider, a.amount);
    }

    /**
     * @notice Refund a funded agreement's USDC to the client. Authorized by the provider
     *         (voluntary return) or the owner (arbiter).
     * @dev    CEI: state → Refunded before the transfer (re-entrancy sees NotFunded).
     */
    function refund(uint256 id) external nonReentrant {
        Agreement storage a = agreements[id];
        if (a.state != State.Funded) revert NotFunded();
        if (msg.sender != a.provider && msg.sender != owner()) revert NotAuthorized();

        a.state = State.Refunded;
        emit Refunded(id, a.client, a.amount);
        usdc.safeTransfer(a.client, a.amount);
    }

    /// @notice Read an agreement (explicit getter for the full struct; the auto getter also exists).
    function getAgreement(uint256 id) external view returns (Agreement memory) {
        return agreements[id];
    }
}

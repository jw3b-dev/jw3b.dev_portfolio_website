/*
 * jw3b.dev v2 — loadable example contracts (brief 05, next-need 3) · audit-heuristics-engineer
 *
 * A first-time visitor arriving at /audit with no contract to hand had nothing to try. The
 * console is the site's main interactive tool and its empty state assumed you brought your own
 * Solidity — which most people reading a security portfolio do not, at that moment.
 *
 * Each example is deliberately vulnerable in ONE named way and exists to demonstrate the detector
 * it names. That claim is not asserted here: `auditExamples.test.js` runs `auditSolidity` over
 * every example and fails if it does not raise the finding it advertises, and fails again if it
 * raises a finding it does not mention. An example that quietly stopped tripping its own detector
 * would be a demo of nothing, which is the failure mode this whole console exists to argue against.
 *
 * Titles name the CONTRACT, not the vulnerability class, and deliberately so: labelling a chip
 * "Authorization via tx.origin" made it read identically to the finding heading the console
 * renders a second later, which was ambiguous on screen before it was ambiguous in a test.
 *
 * Kept small and readable on purpose: these are teaching contracts, not realistic ones. A visitor
 * should be able to see the bug themselves after the tool points at it — otherwise the tool is
 * asking to be trusted rather than checked.
 */

/** @typedef {{id:string, title:string, detects:string[], blurb:string, source:string}} AuditExample */

/** @type {readonly AuditExample[]} */
export const AUDIT_EXAMPLES = Object.freeze([
  Object.freeze({
    id: 'reentrancy',
    title: 'Vault (reentrancy)',
    detects: ['reentrancy'],
    blurb: 'Sends ETH before writing state, so the callee can re-enter and drain it.',
    source: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract Vault {
    mapping(address => uint256) public balance;

    function deposit() external payable {
        balance[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balance[msg.sender];
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balance[msg.sender] = 0;
    }
}
`,
  }),
  Object.freeze({
    id: 'tx-origin',
    title: 'Treasury (tx.origin)',
    detects: ['tx-origin'],
    blurb: 'Authorizes on tx.origin, so an intermediary contract can phish the owner.',
    source: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract Treasury {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function sweep(address payable to) external {
        require(tx.origin == owner, "not owner");
        to.transfer(address(this).balance);
    }
}
`,
  }),
  Object.freeze({
    id: 'floating-pragma',
    title: 'Registry (floating pragma)',
    detects: ['floating-pragma'],
    blurb: 'Compiles under any 0.8.x, so the deployed bytecode is not the reviewed bytecode.',
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Registry {
    mapping(bytes32 => address) private entries;

    function set(bytes32 key, address value) external {
        entries[key] = value;
    }

    function get(bytes32 key) external view returns (address) {
        return entries[key];
    }
}
`,
  }),
])

/** Look one up. Returns null rather than throwing, so a bad id renders nothing. */
export function exampleById(id) {
  return AUDIT_EXAMPLES.find((e) => e.id === id) || null
}

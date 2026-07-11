import { describe, it, expect } from 'vitest';
// The heuristics live in the Worker (single source of truth). This spec runs in
// CI's `vitest run` to protect the regex detectors, but the module is NOT on the
// coverage include-list, so it carries no 100% obligation.
import { runHeuristics, findingsToMarkdownTable } from '../../../workers/portfolio-agent/src/auditHeuristics.js';

const VULNERABLE = `pragma solidity ^0.7.0;
contract Vault {
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool ok, ) = msg.sender.call{value: amount}("");
        balances[msg.sender] = 0;
        require(ok);
    }
    function sweep(address payable to) external {
        require(tx.origin == to);
        selfdestruct(to);
    }
}`;

const titles = (code) => runHeuristics(code).map((f) => f.title);

describe('runHeuristics', () => {
    it('returns nothing for empty / non-string input', () => {
        expect(runHeuristics('')).toEqual([]);
        expect(runHeuristics(null)).toEqual([]);
        expect(runHeuristics(undefined)).toEqual([]);
    });

    it('flags tx.origin authorization', () => {
        expect(titles(VULNERABLE)).toContain('Authorization via tx.origin');
    });

    it('flags selfdestruct', () => {
        expect(titles(VULNERABLE)).toContain('selfdestruct present');
    });

    it('flags a value-bearing call with no reentrancy guard', () => {
        expect(titles(VULNERABLE)).toContain('Value-bearing call without reentrancy guard');
    });

    it('flags floating and pre-0.8 pragma', () => {
        const t = titles(VULNERABLE);
        expect(t).toContain('Floating pragma');
        expect(t).toContain('Pre-0.8 compiler (unchecked arithmetic)');
    });

    it('flags missing SPDX identifier', () => {
        expect(titles(VULNERABLE)).toContain('Missing SPDX license identifier');
    });

    it('does not fire on patterns inside comments', () => {
        expect(titles('// uses tx.origin somewhere\ncontract C {}')).not.toContain('Authorization via tx.origin');
    });

    it('sorts findings by severity (high first)', () => {
        const sev = runHeuristics(VULNERABLE).map((f) => f.severity);
        const rank = { high: 0, medium: 1, low: 2, info: 3 };
        for (let i = 1; i < sev.length; i++) {
            expect(rank[sev[i]]).toBeGreaterThanOrEqual(rank[sev[i - 1]]);
        }
    });

    it('renders a markdown table, and a clean-scan message when empty', () => {
        expect(findingsToMarkdownTable(runHeuristics(VULNERABLE))).toContain('| Severity | Line | Issue | Code |');
        expect(findingsToMarkdownTable([])).toContain('No issues matched');
    });
});

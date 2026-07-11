/**
 * Deterministic static heuristics for common Solidity vulnerabilities.
 *
 * This is a fast, regex/line-based first pass — NOT a substitute for a real
 * audit. The AI layer explains and contextualizes these findings; it must not
 * invent issues beyond them. Every finding is grounded in a concrete line.
 */

const SEVERITY_RANK = { high: 0, medium: 1, low: 2, info: 3 };

// Strip line comments so patterns don't fire inside `// ...` prose.
function stripLineComment(line) {
    const i = line.indexOf('//');
    return i === -1 ? line : line.slice(0, i);
}

/**
 * @param {string} code raw Solidity source
 * @returns {Array<{severity, title, line, snippet, recommendation}>}
 */
export function runHeuristics(code) {
    const findings = [];
    if (!code || typeof code !== 'string') return findings;

    const rawLines = code.split('\n');
    const add = (severity, title, recommendation, lineNo, snippet) =>
        findings.push({ severity, title, recommendation, line: lineNo, snippet: snippet.trim().slice(0, 160) });

    const hasReentrancyGuard = /nonReentrant|ReentrancyGuard/.test(code);
    let sawSPDX = false;

    rawLines.forEach((raw, idx) => {
        const n = idx + 1;
        if (/SPDX-License-Identifier/.test(raw)) sawSPDX = true;
        const line = stripLineComment(raw);
        if (!line.trim()) return;

        // --- HIGH ---
        if (/\btx\.origin\b/.test(line)) {
            add('high', 'Authorization via tx.origin',
                'Use msg.sender for authorization. tx.origin can be spoofed by a malicious intermediary contract (phishing).', n, raw);
        }
        if (/\bdelegatecall\b/.test(line)) {
            add('high', 'delegatecall usage',
                'delegatecall runs external code in this contract’s storage context. Ensure the target is trusted and immutable; it can hijack storage/ownership.', n, raw);
        }
        if (/\bselfdestruct\b|\bsuicide\b/.test(line)) {
            add('high', 'selfdestruct present',
                'Confirm selfdestruct is gated by strict access control; an unprotected selfdestruct can brick the contract and strand funds.', n, raw);
        }

        // --- MEDIUM ---
        // Low-level call whose return value is not obviously checked.
        if (/\.call\s*[{(]/.test(line) && !/\brequire\s*\(/.test(line) && !/=\s*[\w.]*\.call/.test(line) && !/\(bool\s/.test(line)) {
            add('medium', 'Unchecked low-level call',
                'Check the boolean return of low-level .call(...) and revert on failure. Follow Checks-Effects-Interactions.', n, raw);
        }
        if (/\.call\s*\{\s*value\s*:/.test(line) && !hasReentrancyGuard) {
            add('medium', 'Value-bearing call without reentrancy guard',
                'An external value transfer with no nonReentrant guard risks reentrancy. Apply CEI and/or a ReentrancyGuard.', n, raw);
        }
        if (/\b(block\.timestamp|now|blockhash|block\.prevrandao|block\.difficulty)\b/.test(line) &&
            /random|rand|seed|winner|lottery|%/.test(line.toLowerCase())) {
            add('medium', 'Weak on-chain randomness',
                'block.timestamp/blockhash/prevrandao are miner/validator-influenceable. Use a VRF (e.g. Chainlink) for randomness.', n, raw);
        }

        // --- LOW ---
        if (/\bpragma\s+solidity\s+[\^>]/.test(line)) {
            add('low', 'Floating pragma',
                'Pin an exact compiler version (e.g. pragma solidity 0.8.24;) so deployed bytecode is reproducible.', n, raw);
        }
        const pragmaOld = line.match(/pragma\s+solidity\s+[^;]*0\.([0-7])\./);
        if (pragmaOld) {
            add('medium', 'Pre-0.8 compiler (unchecked arithmetic)',
                'Solidity < 0.8 does not check arithmetic overflow/underflow. Upgrade to ^0.8 or use SafeMath.', n, raw);
        }
        if (/\.(transfer|send)\s*\(/.test(line) && !/\.call/.test(line)) {
            add('low', 'transfer/send forwards fixed 2300 gas',
                '.transfer/.send can fail for contract recipients or with future gas repricing. Prefer call{value:}() with a reentrancy guard.', n, raw);
        }
        if (/\bfor\s*\(/.test(line) && /\.length/.test(line)) {
            add('low', 'Loop bounded by dynamic .length',
                'Iterating an unbounded storage array can exceed the block gas limit (griefing/DoS). Bound the range or use pull patterns.', n, raw);
        }

        // --- INFO ---
        if (/\bassembly\b/.test(line)) {
            add('info', 'Inline assembly',
                'Inline assembly bypasses Solidity safety checks — review memory/storage handling carefully.', n, raw);
        }
    });

    if (!sawSPDX) {
        add('info', 'Missing SPDX license identifier',
            'Add an SPDX-License-Identifier comment at the top of the file.', 1, code.split('\n')[0] || '');
    }

    return findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.line - b.line);
}

const SEVERITY_LABEL = { high: '🔴 High', medium: '🟠 Medium', low: '🟡 Low', info: '🔵 Info' };

/** Render findings as a Markdown table (streamed first so it shows even if the AI fails). */
export function findingsToMarkdownTable(findings) {
    if (!findings.length) {
        return '### Static scan\n\nNo issues matched the heuristic checks. This is a shallow pass — a full manual audit is still recommended.\n\n';
    }
    const counts = findings.reduce((acc, f) => ((acc[f.severity] = (acc[f.severity] || 0) + 1), acc), {});
    const summary = ['high', 'medium', 'low', 'info']
        .filter((s) => counts[s])
        .map((s) => `${counts[s]} ${s}`)
        .join(' · ');

    const rows = findings
        .map((f) => `| ${SEVERITY_LABEL[f.severity]} | ${f.line} | ${f.title} | \`${f.snippet.replace(/\|/g, '\\|')}\` |`)
        .join('\n');

    return (
        `### Static scan — ${findings.length} finding(s) (${summary})\n\n` +
        `| Severity | Line | Issue | Code |\n|---|---|---|---|\n${rows}\n\n` +
        `---\n\n### Analysis\n\n`
    );
}

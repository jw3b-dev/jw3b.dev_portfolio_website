import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Play, Loader2, FileCode, FlaskConical, Link2 } from 'lucide-react';
import { useContractAuditor } from '../../hooks/useContractAuditor';
import { useAgentStream } from '../../hooks/useAgentStream';
import { useTxExplainer } from '../../hooks/useTxExplainer';
import { AGENT_FUZZ_URL } from '../../config/worker';
import { FormattedMessage } from '../chat/ChatWidget';

const SAMPLE = `// A deliberately vulnerable vault — try the auditor on it.
pragma solidity ^0.8.0;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

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

const MODES = [
    { id: 'audit', label: 'Auditor', icon: Shield },
    { id: 'fuzz', label: 'Fuzz Harness', icon: FlaskConical },
    { id: 'tx', label: 'Tx Explainer', icon: Link2 },
];

// Right-hand streamed output panel, shared by every mode.
const OutputPanel = ({ output, isLoading, emptyHint }) => (
    <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold mb-2 flex items-center gap-1">
            <Shield size={12} /> Output
        </span>
        <div className="flex-grow min-h-[360px] rounded-xl bg-white/5 border border-white/10 p-4 overflow-y-auto text-xs">
            {output ? (
                <FormattedMessage content={output} isUser={false} />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 py-12">
                    {isLoading ? (
                        <Loader2 size={28} className="mb-3 animate-spin text-cyan-500/60" />
                    ) : (
                        <Shield size={28} className="mb-3 text-cyan-500/40" />
                    )}
                    <p className="text-sm">{isLoading ? 'Working…' : emptyHint}</p>
                </div>
            )}
        </div>
    </div>
);

const RunButton = ({ onClick, disabled, isLoading, label }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="mt-3 self-start px-6 py-3 rounded-xl bg-cyan-500 text-black font-bold text-sm flex items-center gap-2 hover:bg-cyan-400 disabled:bg-stone-800 disabled:text-stone-600 transition-colors"
    >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {isLoading ? 'Working…' : label}
    </button>
);

const codeAreaClass =
    'flex-grow min-h-[360px] w-full rounded-xl bg-black/60 border border-white/10 focus:border-cyan-500/50 focus:outline-none p-4 font-mono text-[13px] text-stone-200 resize-y';

const AuditTab = () => {
    const [code, setCode] = useState('');
    const { report, auditContract, isLoading } = useContractAuditor();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold flex items-center gap-1">
                        <FileCode size={12} /> Solidity Source
                    </span>
                    <button onClick={() => setCode(SAMPLE)} className="text-[11px] text-stone-400 hover:text-cyan-400 transition-colors underline">
                        Load vulnerable sample
                    </button>
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    placeholder="pragma solidity ^0.8.0;&#10;&#10;contract MyContract { ... }"
                    className={codeAreaClass}
                />
                <RunButton onClick={() => auditContract(code)} disabled={isLoading || !code.trim()} isLoading={isLoading} label="Run Audit" />
            </div>
            <OutputPanel output={report} isLoading={isLoading} emptyHint="Paste a contract or load the sample to begin." />
        </div>
    );
};

const FuzzTab = () => {
    const [spec, setSpec] = useState('');
    const { output, run, isLoading } = useAgentStream(AGENT_FUZZ_URL);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold mb-2 flex items-center gap-1">
                    <FlaskConical size={12} /> Contract or Description
                </span>
                <textarea
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    spellCheck={false}
                    placeholder="Paste a contract, or describe it: 'An ERC-4626 vault where totalAssets must never drop below deposits.'"
                    className={codeAreaClass}
                />
                <RunButton onClick={() => run({ spec })} disabled={isLoading || !spec.trim()} isLoading={isLoading} label="Generate Harness" />
            </div>
            <OutputPanel output={output} isLoading={isLoading} emptyHint="Describe a contract to generate a Foundry invariant test." />
        </div>
    );
};

const TxTab = () => {
    const [hash, setHash] = useState('');
    const { report, explainTx, isLoading, error } = useTxExplainer();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold mb-2 flex items-center gap-1">
                    <Link2 size={12} /> Base Transaction Hash
                </span>
                <input
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    spellCheck={false}
                    placeholder="0x…"
                    className="w-full rounded-xl bg-black/60 border border-white/10 focus:border-cyan-500/50 focus:outline-none p-4 font-mono text-[13px] text-stone-200"
                />
                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                <RunButton onClick={() => explainTx(hash)} disabled={isLoading || !hash.trim()} isLoading={isLoading} label="Explain" />
                <p className="mt-3 text-[11px] text-stone-500">Decodes a Base mainnet transaction (token transfers, approvals, gas) and narrates what it did.</p>
            </div>
            <OutputPanel output={report} isLoading={isLoading} emptyHint="Paste a Base transaction hash to decode and explain it." />
        </div>
    );
};

const AuditConsole = () => {
    const [mode, setMode] = useState('audit');

    return (
        <section className="min-h-screen pt-32 pb-24 px-6 relative z-10">
            <Helmet>
                <title>AI Security Console | John Wellard (JW3B)</title>
                <meta name="description" content="A live AI security toolkit by John Wellard: a Solidity contract auditor, a Foundry fuzz-harness generator, and an on-chain transaction explainer — powered by the Sentinel agent." />
            </Helmet>

            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Shield size={22} />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">AI Security Console</h1>
                </div>
                <p className="text-stone-400 max-w-2xl mb-6 text-sm md:text-base">
                    A live toolkit powered by the Sentinel agent — audit a contract, generate a fuzz harness, or decode an on-chain
                    transaction. Demonstrations, not a substitute for a full manual audit.
                </p>

                {/* Mode tabs */}
                <div className="inline-flex p-1 mb-8 rounded-xl bg-white/5 border border-white/10">
                    {MODES.map((m) => {
                        const Icon = m.icon;
                        const active = mode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    active ? 'bg-cyan-500 text-black' : 'text-stone-400 hover:text-white'
                                }`}
                            >
                                <Icon size={15} />
                                <span>{m.label}</span>
                            </button>
                        );
                    })}
                </div>

                {mode === 'audit' && <AuditTab />}
                {mode === 'fuzz' && <FuzzTab />}
                {mode === 'tx' && <TxTab />}
            </div>
        </section>
    );
};

export default AuditConsole;

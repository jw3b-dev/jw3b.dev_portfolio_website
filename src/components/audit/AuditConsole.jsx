import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Play, Loader2, FileCode } from 'lucide-react';
import { useContractAuditor } from '../../hooks/useContractAuditor';
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

const AuditConsole = () => {
    const [code, setCode] = useState('');
    const { report, auditContract, isLoading } = useContractAuditor();

    const handleRun = () => {
        if (!isLoading) auditContract(code);
    };

    return (
        <section className="min-h-screen pt-32 pb-24 px-6 relative z-10">
            <Helmet>
                <title>Live AI Contract Auditor | John Wellard (JW3B)</title>
                <meta name="description" content="Paste a Solidity contract and get an instant AI-assisted security review — static vulnerability heuristics explained by John Wellard's Sentinel auditor agent." />
            </Helmet>

            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Shield size={22} />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Live AI Contract Auditor</h1>
                </div>
                <p className="text-stone-400 max-w-2xl mb-8 text-sm md:text-base">
                    Paste Solidity below. A deterministic static scan runs first, then the Sentinel agent explains each
                    finding with severity and a fix. Heuristic first pass — not a substitute for a full manual audit.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold flex items-center gap-1">
                                <FileCode size={12} /> Solidity Source
                            </span>
                            <button
                                onClick={() => setCode(SAMPLE)}
                                className="text-[11px] text-stone-400 hover:text-cyan-400 transition-colors underline"
                            >
                                Load vulnerable sample
                            </button>
                        </div>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck={false}
                            placeholder="pragma solidity ^0.8.0;&#10;&#10;contract MyContract { ... }"
                            className="flex-grow min-h-[360px] w-full rounded-xl bg-black/60 border border-white/10 focus:border-cyan-500/50 focus:outline-none p-4 font-mono text-[13px] text-stone-200 resize-y"
                        />
                        <button
                            onClick={handleRun}
                            disabled={isLoading || !code.trim()}
                            className="mt-3 self-start px-6 py-3 rounded-xl bg-cyan-500 text-black font-bold text-sm flex items-center gap-2 hover:bg-cyan-400 disabled:bg-stone-800 disabled:text-stone-600 transition-colors"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {isLoading ? 'Auditing…' : 'Run Audit'}
                        </button>
                    </div>

                    {/* Report */}
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold mb-2 flex items-center gap-1">
                            <Shield size={12} /> Audit Report
                        </span>
                        <div className="flex-grow min-h-[360px] rounded-xl bg-white/5 border border-white/10 p-4 overflow-y-auto text-xs">
                            {report ? (
                                <FormattedMessage content={report} isUser={false} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 py-12">
                                    <Shield size={28} className="mb-3 text-cyan-500/40" />
                                    <p className="text-sm">Report will stream here.</p>
                                    <p className="text-xs mt-1">Paste a contract or load the sample to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AuditConsole;

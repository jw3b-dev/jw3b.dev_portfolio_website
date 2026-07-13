import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatEther, parseEther } from 'viem';
import { Bug, Trophy, Loader2, Zap, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, Droplets } from 'lucide-react';
import { useCtf } from '../../hooks/useCtf';
import ConnectButton from '../wallet/ConnectButton';

const EXPLORER = 'https://sepolia.basescan.org';
const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
const shortEth = (wei) => {
    const s = formatEther(wei);
    return s.length > 10 ? Number(s).toPrecision(3) : s;
};

const VULN_CODE = `function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "nothing to withdraw");

    // ❌ interaction BEFORE effect — control returns to the
    //    caller while their balance is still non-zero
    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok, "transfer failed");

    balances[msg.sender] = 0; // effect happens too late
}`;

const StatusBanner = ({ status, message }) => {
    if (status === 'idle' || !message) return null;
    const map = {
        success: { icon: CheckCircle2, cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
        error: { icon: AlertTriangle, cls: 'text-red-400 border-red-500/30 bg-red-500/10' },
    };
    const { icon: Icon, cls } = map[status] || { icon: Loader2, cls: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' };
    const spin = !map[status];
    return (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`}>
            <Icon size={16} className={spin ? 'animate-spin' : ''} />
            <span>{message}</span>
        </div>
    );
};

const CtfChallenge = () => {
    const ctf = useCtf();
    const {
        vaultAddress, vaultBalance, isConnected, onWrongChain, leaderboard,
        status, statusMessage, result, busy, runExploit, seedVault, claim, switchToChain,
    } = ctf;
    const [manualTx, setManualTx] = useState('');
    const [showClaim, setShowClaim] = useState(false);

    const armed = vaultBalance > 0n;

    return (
        <section className="min-h-screen pt-32 pb-24 px-6 relative z-10">
            <Helmet>
                <title>Capture the Vault — Reentrancy CTF | John Wellard (JW3B)</title>
                <meta
                    name="description"
                    content="A live on-chain reentrancy capture-the-flag on Base Sepolia. Deploy the exploit from your own wallet, drain the vulnerable vault, and land on the leaderboard — captures are verified on-chain."
                />
            </Helmet>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <Bug size={22} />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Capture the Vault</h1>
                </div>
                <p className="text-stone-400 max-w-2xl mb-8 text-sm md:text-base">
                    A <span className="text-red-400 font-semibold">deliberately vulnerable</span> vault is live on Base Sepolia.
                    It sends ETH out <em>before</em> zeroing your balance — a textbook reentrancy bug. Deploy the exploit from your
                    own wallet, drain the bait, and land on the leaderboard. Every capture is verified on-chain.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Briefing */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                        <span className="text-[11px] uppercase tracking-widest text-red-400/80 font-bold flex items-center gap-1 mb-3">
                            <ShieldAlert size={12} /> The vulnerability
                        </span>
                        <pre className="rounded-xl bg-black/60 border border-white/10 p-4 overflow-x-auto text-[12px] leading-relaxed text-stone-200 font-mono">
                            <code>{VULN_CODE}</code>
                        </pre>
                        <p className="text-xs text-stone-400 mt-4 leading-relaxed">
                            The exploit deposits a stake, calls <code className="text-cyan-400">withdraw()</code>, and re-enters it from
                            the ETH callback — repeating until the vault is dry, walking away with every other depositor's funds. The
                            fix is Checks-Effects-Interactions + a reentrancy guard (see{' '}
                            <span className="text-cyan-400">SafeVault.sol</span>).
                        </p>
                        <div className="flex flex-wrap gap-3 mt-4 text-xs">
                            <a href={`${EXPLORER}/address/${vaultAddress}#code`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                                Verified source <ExternalLink size={12} />
                            </a>
                            <a href={`${EXPLORER}/address/${vaultAddress}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-stone-400 hover:text-white">
                                Vault on Basescan <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>

                    {/* Live console */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold flex items-center gap-1">
                                <Zap size={12} /> Live exploit console
                            </span>
                            <span className={`text-[11px] px-2 py-1 rounded-full border ${armed ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-stone-500 border-white/10'}`}>
                                {armed ? `🎯 armed · ${shortEth(vaultBalance)} ETH bait` : 'vault empty'}
                            </span>
                        </div>

                        <StatusBanner status={status} message={statusMessage} />

                        {status === 'success' && result && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                                <div className="flex items-center gap-2 font-bold"><Trophy size={16} /> Captured — rank #{result.rank}</div>
                                <p className="text-xs text-emerald-400/80 mt-1">Drained {shortEth(BigInt(result.drained))} ETH. You're on the board.</p>
                            </div>
                        )}

                        {/* Action ladder */}
                        {!isConnected ? (
                            <div className="flex flex-col items-start gap-2">
                                <p className="text-sm text-stone-400">Connect a wallet with a little Base Sepolia ETH to play.</p>
                                <ConnectButton />
                            </div>
                        ) : onWrongChain ? (
                            <button onClick={switchToChain} disabled={busy}
                                className="self-start px-6 py-3 rounded-xl bg-cyan-500 text-black font-bold text-sm hover:bg-cyan-400 transition-colors">
                                Switch to Base Sepolia
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button onClick={runExploit} disabled={busy || !armed}
                                    className="self-start px-6 py-3 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center gap-2 hover:bg-red-400 disabled:bg-stone-800 disabled:text-stone-600 transition-colors">
                                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Bug size={16} />}
                                    {busy ? 'Exploiting…' : 'Run the exploit'}
                                </button>

                                {!armed && (
                                    <button onClick={() => seedVault(parseEther('0.00002'))} disabled={busy}
                                        className="self-start px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 hover:bg-cyan-500/10 transition-colors">
                                        <Droplets size={14} /> Seed the vault (0.00002 ETH) to re-arm
                                    </button>
                                )}

                                <button onClick={() => setShowClaim((s) => !s)} className="self-start text-[11px] text-stone-500 hover:text-cyan-400 underline">
                                    {showClaim ? 'Hide' : 'Ran your own exploit? Claim by tx hash'}
                                </button>
                                {showClaim && (
                                    <div className="flex flex-col gap-2">
                                        <input value={manualTx} onChange={(e) => setManualTx(e.target.value)} placeholder="0x… your winning tx"
                                            className="w-full rounded-lg bg-black/60 border border-white/10 focus:border-cyan-500/50 focus:outline-none p-2.5 font-mono text-xs text-stone-200" />
                                        <button onClick={() => claim(manualTx)} disabled={busy || !manualTx.trim()}
                                            className="self-start px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold text-xs disabled:bg-stone-800 disabled:text-stone-600">
                                            Verify & claim
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
                            The exploit runs entirely from your wallet: it deploys the reference Attacker, drains the vault, then the
                            Worker independently confirms the drain on-chain before recording your capture. Testnet only — no real funds.
                        </p>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6">
                    <span className="text-[11px] uppercase tracking-widest text-cyan-500/70 font-bold flex items-center gap-1 mb-4">
                        <Trophy size={12} /> Leaderboard — verified captures
                    </span>
                    {leaderboard.length === 0 ? (
                        <p className="text-sm text-stone-500 py-6 text-center">No captures yet. Be the first to drain the vault.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-stone-500 border-b border-white/10">
                                        <th className="text-left py-2 pr-4">#</th>
                                        <th className="text-left py-2 pr-4">Hacker</th>
                                        <th className="text-left py-2 pr-4">Block</th>
                                        <th className="text-left py-2">Captured</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((s, i) => (
                                        <tr key={s.address} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-2.5 pr-4 text-stone-400">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                                            <td className="py-2.5 pr-4 font-mono text-cyan-400">
                                                <a href={`${EXPLORER}/tx/${s.tx_hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                                                    {shortAddr(s.address)} <ExternalLink size={11} className="opacity-50" />
                                                </a>
                                            </td>
                                            <td className="py-2.5 pr-4 text-stone-500 font-mono text-xs">{s.block_number}</td>
                                            <td className="py-2.5 text-stone-400 text-xs">{new Date(s.ts * 1000).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CtfChallenge;

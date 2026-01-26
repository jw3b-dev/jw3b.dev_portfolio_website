import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, Rocket, LogOut, User } from 'lucide-react';

export const ConnectButton = ({ label = "Connect", className = "" }) => {
    return (
        <RainbowConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                        className={className}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={openConnectModal}
                                        className="relative group px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm flex items-center gap-2 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all duration-300"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        <span>{label}</span>
                                        <div className="absolute inset-0 rounded-lg bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={openChainModal}
                                        className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 font-mono text-sm hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                                    >
                                        Wrong network
                                    </motion.button>
                                );
                            }

                            return (
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={openChainModal}
                                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 hover:border-cyan-500/50 hover:bg-white/5 transition-all"
                                    >
                                        {chain.hasIcon && (
                                            <div
                                                style={{
                                                    background: chain.iconBackground,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 999,
                                                    overflow: 'hidden',
                                                    marginRight: 4,
                                                }}
                                            >
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Chain icon'}
                                                        src={chain.iconUrl}
                                                        style={{ width: 20, height: 20 }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <span className="text-stone-300 text-xs font-mono">{chain.name}</span>
                                        <ChevronDown className="w-3 h-3 text-stone-500" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={openAccountModal}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border border-cyan-500/30 hover:border-cyan-400/80 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all group"
                                    >
                                        {account.ensAvatar ? (
                                            <img
                                                src={account.ensAvatar}
                                                alt="ENS Avatar"
                                                className="w-5 h-5 rounded-full ring-1 ring-cyan-500/50"
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center ring-1 ring-cyan-500/30">
                                                <Rocket className="w-3 h-3 text-cyan-400" />
                                            </div>
                                        )}

                                        <span className="text-cyan-100 font-mono text-xs">
                                            {account.displayName}
                                            {account.displayBalance ? ` (${account.displayBalance})` : ''}
                                        </span>
                                        <ChevronDown className="w-3 h-3 text-cyan-500/50 group-hover:text-cyan-400" />
                                    </motion.button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </RainbowConnectButton.Custom>
    );
};

export default ConnectButton;

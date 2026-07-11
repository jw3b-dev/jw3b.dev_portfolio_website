import { useState, useEffect } from 'react';

/**
 * UnlockPaywall Component
 * 
 * Handles interaction with the Unlock Protocol checkout UI.
 * Integrates with the global window.unlockProtocol object.
 */
const UnlockPaywall = ({ lockAddress, onLocked, onUnlocked, metadata = {} }) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const handleUnlockEvent = (event) => {
      setStatus(event.detail);
      if (event.detail === 'unlocked' && onUnlocked) onUnlocked();
      if (event.detail === 'locked' && onLocked) onLocked();
    };

    window.addEventListener('unlockProtocol.status', handleUnlockEvent);

    // Initial check
    if (window.unlockProtocol && window.unlockProtocol.getState) {
      const state = window.unlockProtocol.getState();
      setStatus(state);
    } else {
      setStatus('locked');
    }

    return () => {
      window.removeEventListener('unlockProtocol.status', handleUnlockEvent);
    };
  }, [onLocked, onUnlocked]);

  const checkout = () => {
    if (!window.unlockProtocol) {
      console.error('Unlock Protocol not loaded');
      return;
    }

    window.unlockProtocol.loadCheckoutModal({
      locks: {
        [lockAddress]: {
          network: 8453, // Base Mainnet
        },
      },
      pessimistic: true,
      metadata,
    });
  };

  const isPlaceholder = !lockAddress || lockAddress === "0x..." || lockAddress.length < 42;

  return (
    <div className="flex flex-col items-center gap-4">
      {status === 'locked' ? (
        <button
          onClick={isPlaceholder ? undefined : checkout}
          disabled={isPlaceholder}
          className={`
            px-8 py-4 rounded-xl font-mono text-sm uppercase tracking-widest transition-all
            ${isPlaceholder 
              ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed opacity-50'
              : 'bg-cyan-500/10 border border-cyan-400/50 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-400'}
          `}
        >
          {isPlaceholder ? 'Lock Pending' : 'Initialize Checkout'}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          ACCESS GRANTED
        </div>
      )}
    </div>
  );
};

export default UnlockPaywall;

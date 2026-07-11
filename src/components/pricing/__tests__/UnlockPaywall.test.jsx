import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UnlockPaywall from '../UnlockPaywall';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('UnlockPaywall', () => {
    beforeEach(() => {
        // Mock window.unlockProtocol
        window.unlockProtocol = {
            getState: vi.fn().mockReturnValue('locked'),
            loadCheckoutModal: vi.fn(),
        };
        // Mock addEventListener
        vi.spyOn(window, 'addEventListener');
        vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete window.unlockProtocol;
    });

    it('should initialize with locked status if protocol missing', () => {
        delete window.unlockProtocol;
        render(<UnlockPaywall lockAddress="0x1234567890123456789012345678901234567890" />);
        expect(screen.getByText(/Initialize Checkout/i)).toBeInTheDocument();
    });

    it('should initialize with protocol state', () => {
        window.unlockProtocol.getState.mockReturnValue('unlocked');
        render(<UnlockPaywall lockAddress="0x1234567890123456789012345678901234567890" />);
        expect(screen.getByText(/ACCESS GRANTED/i)).toBeInTheDocument();
    });

    it('should handle unlockProtocol.status events', async () => {
        const onUnlocked = vi.fn();
        const onLocked = vi.fn();
        const { act } = await import('react-dom/test-utils');
        
        render(<UnlockPaywall lockAddress="0x1234567890123456789012345678901234567890" onUnlocked={onUnlocked} onLocked={onLocked} />);
        
        // Simulate unlocked event
        await act(async () => {
            const unlockedEvent = new CustomEvent('unlockProtocol.status', { detail: 'unlocked' });
            window.dispatchEvent(unlockedEvent);
        });
        
        expect(screen.getByText(/ACCESS GRANTED/i)).toBeInTheDocument();
        expect(onUnlocked).toHaveBeenCalled();

        // Simulate locked event
        await act(async () => {
            const lockedEvent = new CustomEvent('unlockProtocol.status', { detail: 'locked' });
            window.dispatchEvent(lockedEvent);
        });
        
        expect(screen.getByText(/Initialize Checkout/i)).toBeInTheDocument();
        expect(onLocked).toHaveBeenCalled();
    });

    it('should trigger checkout modal', () => {
        render(<UnlockPaywall lockAddress="0x1234567890123456789012345678901234567890" metadata={{ name: 'Test' }} />);
        fireEvent.click(screen.getByText(/Initialize Checkout/i));
        
        expect(window.unlockProtocol.loadCheckoutModal).toHaveBeenCalledWith({
            locks: {
                '0x1234567890123456789012345678901234567890': { network: 8453 }
            },
            pessimistic: true,
            metadata: { name: 'Test' }
        });
    });

    it('should handle missing unlockProtocol on checkout click', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<UnlockPaywall lockAddress="0x1234567890123456789012345678901234567890" />);
        
        // Delete protocol after render
        delete window.unlockProtocol;
        
        fireEvent.click(screen.getByText(/Initialize Checkout/i));
        expect(consoleSpy).toHaveBeenCalledWith('Unlock Protocol not loaded');
        consoleSpy.mockRestore();
    });

    it('should cleanup event listeners on unmount', () => {
        const { unmount } = render(<UnlockPaywall lockAddress="0x1234567890123456789012345678901234567890" />);
        unmount();
        expect(window.removeEventListener).toHaveBeenCalledWith('unlockProtocol.status', expect.any(Function));
    });
});

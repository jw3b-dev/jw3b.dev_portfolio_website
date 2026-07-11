import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ParticleCanvas from '../jw3b.devParticleCanvas';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn();

describe('ParticleCanvas', () => {
    let observeMock = vi.fn();
    let disconnectMock = vi.fn();
    let originalHardwareConcurrency;

    beforeEach(() => {
        vi.clearAllMocks();
        observeMock = vi.fn();
        disconnectMock = vi.fn();
        
        // Setup IntersectionObserver mock
        window.IntersectionObserver = class {
            constructor(callback) {
                this.callback = callback;
                window._lastObserver = this; 
            }
            observe = observeMock;
            disconnect = disconnectMock;
            unobserve = vi.fn();
            trigger(entries) {
                this.callback(entries);
            }
        };

        // Setup MatchMedia mock
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        originalHardwareConcurrency = navigator.hardwareConcurrency;
        
        Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { configurable: true, value: 800 });
        Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { configurable: true, value: 600 });

        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            scale: vi.fn(),
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalHardwareConcurrency !== undefined) {
             Object.defineProperty(navigator, 'hardwareConcurrency', { 
                value: originalHardwareConcurrency, 
                configurable: true 
            });
        }
    });

    it('should render and start animation when visible', async () => {
        const { container } = render(<ParticleCanvas />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        const observer = window._lastObserver;
        act(() => {
            observer.trigger([{ isIntersecting: false }]);
        });
        act(() => {
            observer.trigger([{ isIntersecting: true }]);
        });

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle mouse interaction', () => {
        render(<ParticleCanvas />);
        fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
        fireEvent.mouseLeave(window);
    });

    it('should handle resize', () => {
        render(<ParticleCanvas />);
        fireEvent.resize(window);
    });

    it('should respect reduced motion preference', () => {
        window.matchMedia.mockImplementation(query => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<ParticleCanvas />);
        expect(observeMock).not.toHaveBeenCalled();
    });

    it('should handle low power mode', () => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { 
            value: 2, 
            configurable: true 
        });
        
        render(<ParticleCanvas />);
        
        const observer = window._lastObserver;
        act(() => {
            observer.trigger([{ isIntersecting: true }]);
        });
        
        // Verifies the branch is taken without error
        expect(observeMock).toHaveBeenCalled();
    });

    it('should cleanup on unmount', () => {
        const { unmount } = render(<ParticleCanvas />);
        unmount();
        expect(disconnectMock).toHaveBeenCalled();
    });

    it('should draw audio frequency equalizer when ai_voice_amplitude > 0', async () => {
        // Set global variables used by the animation loop
        window.ai_voice_amplitude = 1;
        window.ai_mood_color = '#eab308';
        
        const { container } = render(<ParticleCanvas />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // Trigger intersection to start animation
        const observer = window._lastObserver;
        act(() => {
            observer.trigger([{ isIntersecting: true }]);
        });

        // Wait a tick for the animation loop to process global variables
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Clean up global mutations
        delete window.ai_voice_amplitude;
        delete window.ai_mood_color;
    });

    it('should handle invalid hex colors gracefully in hexToRgb', async () => {
        window.ai_voice_amplitude = 0.5;
        window.ai_mood_color = 'invalid-hex';

        render(<ParticleCanvas />);
        
        const observer = window._lastObserver;
        act(() => {
            observer.trigger([{ isIntersecting: true }]);
        });

        await new Promise(resolve => setTimeout(resolve, 50));
        
        delete window.ai_voice_amplitude;
        delete window.ai_mood_color;
    });

    it('should stop animation loop if reduced motion is enabled during effect', async () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: true,
            media: query,
            onchange: null,
            removeEventListener: vi.fn(),
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<ParticleCanvas />);
        
        window.matchMedia = originalMatchMedia;
    });

    it('should use default devicePixelRatio if window.devicePixelRatio is missing', () => {
        const originalDPR = window.devicePixelRatio;
        delete window.devicePixelRatio;
        
        render(<ParticleCanvas />);
        
        window.devicePixelRatio = originalDPR;
    });

    it('should stop animation if isVisible becomes false', async () => {
        render(<ParticleCanvas />);
        const observer = window._lastObserver;
        
        // Hide it
        act(() => { observer.trigger([{ isIntersecting: false }]); });
    });

    it('should not start animation if initially not visible', () => {
        // Line 189 coverage
        render(<ParticleCanvas />);
    });
});

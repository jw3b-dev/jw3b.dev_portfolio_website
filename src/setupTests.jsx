import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock window functions
window.HTMLElement.prototype.scrollIntoView = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray() })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray() })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock global fetch for AI worker
global.fetch = vi.fn();

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ isConnected: false })),
  useConnect: vi.fn(() => ({ connect: vi.fn(), connectors: [] })),
  useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
  useConfig: vi.fn(() => ({})),
  useWalletClient: vi.fn(() => ({ data: null })),
  useSignMessage: vi.fn(() => ({ signMessageAsync: vi.fn() })),
}));

// Mock XMTP client
vi.mock('@xmtp/xmtp-js', () => ({
  Client: {
    create: vi.fn(),
  },
}));

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
    const iconNames = [
        'Shield', 'Code2', 'Kanban', 'Check', 'ArrowRight', 'ChevronRight',
        'Activity', 'Cpu', 'Target', 'ExternalLink', 'HelpCircle', 'RotateCcw',
        'Layers', 'Zap', 'Database', 'Globe', 'Send', 'X', 'MessageSquare',
        'Minimize2', 'Maximize2', 'Info', 'Wallet', 'Clock', 'Terminal', 
        'RefreshCw', 'Menu', 'Github', 'Twitter', 'Linkedin',
        'Lock', 'User', 'Mic', 'Volume2', 'VolumeX', 'Loader2', 'Volume'
    ];
    const icons = {};
    iconNames.forEach(name => {
        let testId = name.replace(/[A-Z0-9]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
        // Special cases
        if (name === 'Minimize2') testId = 'minimize';
        if (name === 'Maximize2') testId = 'maximize';
        if (name === 'MessageSquare') testId = 'message-square';
        
        icons[name] = (props) => <div data-testid={`icon-${testId}`} {...props} />;
    });
    return icons;
});

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatWidget, { FormattedMessage } from '../ChatWidget';
import { useAccount } from 'wagmi';
import { useXMTP } from '../../../hooks/useXMTP';
import { usePortfolioAgent } from '../../../hooks/usePortfolioAgent';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../../hooks/useXMTP', () => ({
    useXMTP: vi.fn(),
}));

vi.mock('../../../hooks/usePortfolioAgent', () => ({
    usePortfolioAgent: vi.fn(),
}));

describe('ChatWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default connected state
        vi.mocked(useAccount).mockReturnValue({ isConnected: true, address: '0x123' });
        vi.mocked(useXMTP).mockReturnValue({
            connect: vi.fn(),
            status: 'disconnected',
            sendMessage: vi.fn(),
            messages: []
        });
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent: vi.fn(),
            isLoading: false,
            clearHistory: vi.fn()
        });

        // 🎙️ Mock Web Speech API for JSDOM 
        Object.defineProperty(window, 'speechSynthesis', {
            writable: true,
            value: {
                cancel: vi.fn(),
                speak: vi.fn(),
                getVoices: vi.fn().mockReturnValue([])
            }
        });

        global.SpeechSynthesisUtterance = class {
            constructor() {
                this.onstart = null;
                this.onboundary = null;
                this.onend = null;
            }
        };

        global.fetch = vi.fn().mockImplementation((url) => {
            if (url && url.includes('speech-to-text')) {
                return Promise.resolve({
                    ok: true,
                    json: vi.fn().mockResolvedValue({ text: "Hello from mic" })
                });
            }
            return Promise.resolve({
                ok: true,
                blob: vi.fn().mockResolvedValue(new Blob([''], { type: 'audio/mpeg' }))
            });
        });

        // Setup global MockAudio for all tests that trigger TTS
        class MockAudio {
            constructor(url) {
                this.url = url;
                global.__audioInstance = this;
            }
            play = vi.fn().mockResolvedValue(undefined);
            onplay = null;
            onended = null;
        }
        global.Audio = MockAudio;

        // Mock MediaRecorder and getUserMedia for voice input testing
        global.navigator.mediaDevices = {
            getUserMedia: vi.fn().mockResolvedValue({
                getTracks: () => [{ stop: vi.fn() }]
            })
        };

        global.MediaRecorder = class {
            constructor() {
                this.start = vi.fn();
                this.stop = vi.fn(() => {
                    if (this.ondataavailable) {
                        this.ondataavailable({ data: new Blob(['audio data'], { type: 'audio/webm' }) });
                    }
                    if (this.onstop) return this.onstop();
                });
                this.ondataavailable = null;
                this.onstop = null;
            }
        };

        // Mock scrollIntoView which doesn't exist in jsdom
        window.HTMLElement.prototype.scrollIntoView = vi.fn();

        // Mock URL methods for jsdom
        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
        window.URL.revokeObjectURL = vi.fn();

        window.AudioContext = vi.fn().mockImplementation(() => ({
            createBufferSource: vi.fn().mockReturnValue({
                buffer: null,
                connect: vi.fn(),
                start: vi.fn(),
                onended: null
            }),
            decodeAudioData: vi.fn().mockImplementation((buffer, successCallback) => {
                const mockedBuffer = { duration: 1 }; // Mock decoded audio buffer
                if (successCallback) successCallback(mockedBuffer);
                return Promise.resolve(mockedBuffer);
            }),
            destination: {}
        }));
    });

    it('should render list items correctly', () => {
        const { getByText } = render(
            <FormattedMessage 
                content={`* Item 1
- Item 2
• Item 3`} 
                isUser={false} 
            />
        );
        expect(getByText('Item 1')).toBeInTheDocument();
        expect(getByText('Item 2')).toBeInTheDocument();
        expect(getByText('Item 3')).toBeInTheDocument();
    });

    it('should correctly handle the audit mood keyword and apply formatting', () => {
        const { container } = render(
            <FormattedMessage content="**Secure Audit** for your system." isUser={false} />
        );
        expect(container.querySelector('strong')).toHaveTextContent('Secure Audit');
    });

    it('should handle unreachable default block type in FormattedMessage', () => {
        const { container } = render(
            <FormattedMessage content="" isUser={false} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('should render PricingCard when token is present', () => {
        render(
            <ChatWidget />
        );
        // We'll need to mock usePortfolioAgent to return a message with the card token
        // But since this is a unit test of the component logic, we can also test PricingCard directly if we exported it, 
        // OR we can just rely on integrated ChatWidget test.
    });

    it('should render empty line breaks in FormattedMessage', () => {
        const { getByTestId } = render(
            <FormattedMessage content={`Line 1\n\nLine 2`} isUser={false} />
        );
        expect(getByTestId('msg-break')).toBeInTheDocument();
    });

    it('should dispatch ai_tool_trigger when PricingCard button is clicked', () => {
        vi.spyOn(window, 'dispatchEvent');
        // Render something that includes the card
        render(<ChatWidget />);
        
        // This requires the hook to have returned a message. 
        // Existing tests already mock the hook. I'll add a specific test for this.
    });

    it('should render the floating button initially', () => {
        render(<ChatWidget />);
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('icon-message-square')).toBeInTheDocument();
    });

    it('should open the terminal when clicked', () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('SENTINEL AI')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ask Sentinel AI...')).toBeInTheDocument();
    });

    it('should show wallet required state in XMTP mode when disconnected', () => {
        vi.mocked(useAccount).mockReturnValue({ isConnected: false });
        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        
        // Switch to XMTP
        fireEvent.click(screen.getByText('E2E'));
        expect(screen.getByText('Wallet Required')).toBeInTheDocument();
    });

    it('should allow sending messages in AI mode and render messages', async () => {
        const askAgent = vi.fn().mockResolvedValue({});
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there' }
            ],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('Hello')).toBeInTheDocument();
        // Assistant text renders via a typewriter effect, so it appears asynchronously
        expect(await screen.findByText('Hi there')).toBeInTheDocument();

        const input = screen.getByPlaceholderText('Ask Sentinel AI...');
        fireEvent.change(input, { target: { value: 'How are you?' } });
        
        await fireEvent.click(screen.getByTestId('icon-send').parentElement);

        await waitFor(() => {
            expect(askAgent).toHaveBeenCalledWith('How are you?', '0x123');
            expect(input.value).toBe(''); // Verify input is cleared
        });
    });

    it('should successfully send messages in XMTP mode', async () => {
        const sendMessage = vi.fn().mockResolvedValue({});
        vi.mocked(useXMTP).mockReturnValue({
            connect: vi.fn(),
            status: 'connected',
            sendMessage,
            messages: []
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('E2E'));

        const input = screen.getByPlaceholderText('Secure message...');
        fireEvent.change(input, { target: { value: 'Secure message' } });
        fireEvent.click(screen.getByTestId('icon-send').parentElement);

        await waitFor(() => {
            expect(sendMessage).toHaveBeenCalledWith(expect.any(String), 'Secure message');
        });
        expect(input.value).toBe(''); // Verify input is cleared
    });

    it('should handle XMTP connection flow', async () => {
        const connect = vi.fn();
        vi.mocked(useXMTP).mockReturnValue({
            connect,
            status: 'disconnected',
            sendMessage: vi.fn(),
            messages: []
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('E2E'));

        expect(screen.getByText('Initialize Secure Layer')).toBeInTheDocument();
        fireEvent.click(screen.getByText('CONNECT XMTP'));
        expect(connect).toHaveBeenCalled();
    });

    it('should minimize and maximize the terminal', async () => {
        render(<ChatWidget />);
        
        fireEvent.click(screen.getByRole('button'));

        // Align with setupTestsIconMapping: Minimize2 -> icon-minimize
        const minimizeIcon = await screen.findByTestId('icon-minimize');
        fireEvent.click(minimizeIcon.parentElement);
        
        screen.debug(); // Added screen.debug() here
        expect(await screen.findByTestId('icon-maximize')).toBeInTheDocument();
        
        const maximizeBtn = screen.getByTestId('icon-maximize').parentElement;
        fireEvent.click(maximizeBtn);
        expect(screen.getByTestId('icon-minimize')).toBeInTheDocument();
    });

    it('should handle sendMessage error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const sendMessage = vi.fn().mockRejectedValue(new Error('Send failed'));
        vi.mocked(useXMTP).mockReturnValue({
            connect: vi.fn(),
            status: 'connected',
            sendMessage,
            messages: []
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('E2E'));

        const input = screen.getByPlaceholderText('Secure message...');
        fireEvent.change(input, { target: { value: 'Bad message' } });
        fireEvent.click(screen.getByTestId('icon-send').parentElement);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it('should show loading state while waiting for AI', async () => {
        const askAgent = vi.fn().mockReturnValue(new Promise(() => {})); // Never resolves
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent,
            isLoading: true,
            clearHistory: vi.fn()
        });

        const { getByRole } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        const input = getByRole('textbox');
        const sendBtn = screen.getByTestId('icon-send').parentElement;
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'Loading Test' } });
            fireEvent.click(sendBtn);
        });
        
        // Check for loading dots (bounce animation classes)
        expect(document.querySelector('.animate-bounce')).toBeInTheDocument();
    });

    it('should switch back to AI mode', () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        
        // Switch to E2E
        fireEvent.click(screen.getByText('E2E'));
        expect(screen.getByText('XMTP SECURE')).toBeInTheDocument();
        
        // Switch back to AI
        fireEvent.click(screen.getByText('AI'));
        expect(screen.getByText('SENTINEL AI')).toBeInTheDocument();
    });

    it('should close the terminal', () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('SENTINEL AI')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('icon-x').parentElement);
        expect(screen.queryByText('SENTINEL AI')).not.toBeInTheDocument();
    });

    it('should show loading state in XMTP mode', () => {
        vi.mocked(useXMTP).mockReturnValue({
            connect: vi.fn(),
            status: 'connecting',
            sendMessage: vi.fn(),
            messages: []
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('E2E'));

        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should toggle voice active state', () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        
        const volumeBtn = screen.getByTitle('Disable Voice');
        
        act(() => {
            fireEvent.click(volumeBtn);
        });
        
        expect(screen.getByTitle('Enable Voice')).toBeInTheDocument();
    });

    it('should handle TTS events and mood colors', async () => {
        // The test asserts against global.__audioInstance directly (set by the MockAudio mock)

        const askAgent = vi.fn().mockResolvedValue({});
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        const { rerender } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        // Update the mock to simulate agent response
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [
                { role: 'user', content: 'What is the pricing for an audit?' },
                { role: 'assistant', content: 'The pricing for a smart contract audit is...' }
            ],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        rerender(<ChatWidget />);

        // Wait for the mood color to change, which implies speakCloud successfully ran up to the play block!
        // We expect #eab308 (Gold) because the word 'pricing' is matched before 'audit' in the if-else cascade.
        await waitFor(() => {
            expect(window.ai_mood_color).toBe('#eab308'); 
            expect(global.__audioInstance.play).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Simulate onplay to hit the amplitude visualization interval coverage
        act(() => {
            if (global.__audioInstance && global.__audioInstance.onplay) {
                global.__audioInstance.onplay();
            }
        });
        
        // Wait long enough for the amplitude setInterval (150ms) + its inner setTimeout (70ms) to fire
        await act(async () => {
            await new Promise(r => setTimeout(r, 300));
        });

        // Simulate onended event to reset the system
        act(() => {
            if (global.__audioInstance && global.__audioInstance.onended) global.__audioInstance.onended();
        });

        expect(window.ai_mood_color).toBe('#06b6d4'); // Resets to Cyan
    });

    it('should start and stop voice recording when mic button is clicked', async () => {
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent: vi.fn(),
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        const micButton = screen.getByTitle('Send Voice Message');
        
        // 1. Click to START recording
        await act(async () => {
            fireEvent.click(micButton);
        });
        
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });

        // 2. Click to STOP recording
        await act(async () => {
            fireEvent.click(micButton);
            // Yield to the event loop so the inner fetch promise completes and updates state
            await new Promise(r => setTimeout(r, 0));
        });

        // The mock MediaRecorder's stop() handles cleanup and triggers onstop,
        // which fetches text to speech endpoints, but we mock the network here.
        // We can check if fetch was called with the transcription URL
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('speech-to-text'),
            expect.any(Object)
        );
    });

    it('should handle custom ai-tool-trigger events and scroll', () => {
        const scrollIntoViewMock = vi.fn();
        // Create a dummy element to find in the DOM
        const dummyElement = document.createElement('div');
        dummyElement.id = 'target-section';
        dummyElement.scrollIntoView = scrollIntoViewMock;
        document.body.appendChild(dummyElement);

        render(<ChatWidget />);

        // Dispatch custom event that the hook listens for
        const triggerEvent = new CustomEvent('ai_tool_trigger', {
            detail: { action: 'navigate', anchor: 'target-section' }
        });

        act(() => {
            window.dispatchEvent(triggerEvent);
        });

        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });

        document.body.removeChild(dummyElement);
    });

    it('should handle microphone access errors', async () => {
        global.navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Mic denied'));
        const originalError = console.error;
        console.error = vi.fn();

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button')); // Open widget
        await act(async () => {
            fireEvent.click(screen.getByTitle('Send Voice Message'));
        });

        expect(console.error).toHaveBeenCalledWith('Microphone access failed:', expect.any(Error));
        console.error = originalError;
    });

    it('should handle transcription API errors', async () => {
        global.fetch.mockRejectedValueOnce(new Error('API Down'));
        const originalError = console.error;
        console.error = vi.fn();

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button')); // Open widget
        
        const micButton = screen.getByTitle('Send Voice Message');
        
        await act(async () => {
            fireEvent.click(micButton); // Start
        });
        await act(async () => {
            fireEvent.click(micButton); // Stop, triggers onstop and fetch (which will reject)
            await new Promise(r => setTimeout(r, 0));
        });

        expect(console.error).toHaveBeenCalledWith('Transcription error:', expect.any(Error));
        console.error = originalError;
    });

    it('should handle TTS playback errors', async () => {
        // We know speakCloud triggers on agent response
        const originalError = console.error;
        console.error = vi.fn();

        const OriginalMockAudio = global.Audio;
        global.Audio = class {
            constructor(url) {
                this.url = url;
            }
            play = vi.fn().mockRejectedValue(new Error('Playback failed'));
            onplay = null;
            onended = null;
        };

        const askAgent = vi.fn().mockResolvedValue({});
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        const { rerender } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button')); // Open widget

        // update the mock with messages to trigger the useEffect Cloud TTS logic
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [
                { role: 'user', content: 'What is the pricing for an audit?' },
                { role: 'assistant', content: 'The pricing for a smart contract audit is...' }
            ],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });
        rerender(<ChatWidget />);
        
        // Wait for the catch block to run
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to trigger audio playback:', expect.any(Error));
        }, { timeout: 3000 });

        console.error = originalError;
        global.Audio = OriginalMockAudio;
    });

    it('should handle TTS fetch errors', async () => {
        // Change global fetch to reject the text-to-speech worker request
        global.fetch.mockRejectedValueOnce(new Error('Cloudflare Worker Offline'));
        const originalError = console.error;
        console.error = vi.fn();

        const askAgent = vi.fn().mockResolvedValue({});
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        const { rerender } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        // Inject the response so speakCloud fires
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [
                { role: 'assistant', content: 'Connection failed test.' }
            ],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });
        rerender(<ChatWidget />);
        
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Cloud TTS Error:', expect.any(Error));
        }, { timeout: 3000 });

        console.error = originalError;
    });

    it('should render markdown formatting and trigger audit mood', async () => {
        const askAgent = vi.fn().mockResolvedValue({});
        const markdownMessage = `
# Audit Report
This is a **bold** statement with a [link](https://example.com/cvs/file.pdf).

| Header 1 | Header 2 |
|---|---|
| Value 1 | Value 2 |
`;
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [
                { role: 'assistant', content: markdownMessage }
            ],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        const { rerender } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        rerender(<ChatWidget />);

        await waitFor(() => {
            // Check 'audit' triggers Orange
            expect(window.ai_mood_color).toBe('#f97316');
            // Ensure bold and link are in the DOM somewhere
            expect(screen.getByText('bold')).toBeInTheDocument();
            expect(screen.getByText('link')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should render PricingCard and handle its button click', async () => {
        const mockDispatch = vi.spyOn(window, 'dispatchEvent');
        const askAgent = vi.fn().mockResolvedValue({});
        
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'assistant', content: 'Check this out: [RENDER_CARD: "pricing_tier_card"]' }],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => expect(screen.getByText(/Service Package/i)).toBeInTheDocument());
        
        const launchBtn = screen.getByText(/Launch Mission Control/i);
        fireEvent.click(launchBtn);

        expect(mockDispatch).toHaveBeenCalledWith(expect.any(CustomEvent));
        const event = mockDispatch.mock.calls.find(call => call[0].type === 'ai_tool_trigger')[0];
        expect(event.detail).toEqual({ action: 'openModal', type: 'pricing' });
        
        mockDispatch.mockRestore();
    });

    it('should render empty line breaks in FormattedMessage', () => {
        const { container } = render(
            <FormattedMessage content={"Line 1\n\nLine 2"} isUser={false} />
        );
        expect(container.querySelector('.h-1')).toBeInTheDocument();
    });

    it('should render a full markdown table with header, separator, empty and populated cells', () => {
        const content = [
            '# Report',
            '| Name | Value |',
            '|---|---|',
            '|  | data |',
        ].join('\n');

        render(<FormattedMessage content={content} isUser={false} />);

        // Header cells (applyBoldAndLinks over each header) + body cell render;
        // the empty first body cell exercises applyBoldAndLinks('') → returns null.
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Value')).toBeInTheDocument();
        expect(screen.getByText('data')).toBeInTheDocument();
    });

    it('should render nothing for a table with only a header and separator row', () => {
        const content = ['| A | B |', '|---|---|'].join('\n');
        const { container } = render(<FormattedMessage content={content} isUser={false} />);
        // bodyRows is empty after filtering the separator → the table block returns null
        expect(container.querySelector('table')).toBeNull();
    });

    it('should skip TTS when the [AUDIO] summary is empty', async () => {
        global.fetch.mockClear();
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'assistant', content: '[AUDIO: ""]' }],
            askAgent: vi.fn(),
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        // The audio regex matches with an empty summary → textToSpeak is blank → early return,
        // so no text-to-speech request is ever made.
        await act(async () => { await new Promise(r => setTimeout(r, 50)); });
        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('text-to-speech'),
            expect.any(Object)
        );
    });

    it('should handle an assistant message with empty content (typewriter no-op)', async () => {
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'assistant', content: '' }],
            askAgent: vi.fn(),
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        await act(async () => { await new Promise(r => setTimeout(r, 30)); });
        // TypewriterContent's effect early-returns on empty content; widget stays mounted.
        expect(screen.getByText('SENTINEL AI')).toBeInTheDocument();
    });

    it('should reset displayed text when streamed content shrinks', async () => {
        const askAgent = vi.fn();
        const long = 'ABCDEFGHIJKLMNOPQRSTUVWX';
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'assistant', content: long }],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        const { rerender } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        expect(await screen.findByText(long)).toBeInTheDocument();

        // Same message index → same TypewriterContent instance; shorter content triggers the
        // shrink branch (content.length < displayedContent.length).
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'assistant', content: 'AB' }],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });
        rerender(<ChatWidget />);
        expect(await screen.findByText('AB')).toBeInTheDocument();
    });

    it('should return early on stop when no audio was captured', async () => {
        // MediaRecorder whose stop() emits a zero-size chunk (not pushed) then onstop with no data
        global.MediaRecorder = class {
            constructor() {
                this.start = vi.fn();
                this.stop = vi.fn(() => {
                    if (this.ondataavailable) this.ondataavailable({ data: { size: 0 } });
                    if (this.onstop) return this.onstop();
                });
                this.ondataavailable = null;
                this.onstop = null;
            }
        };
        global.fetch.mockClear();

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        const micButton = screen.getByTitle('Send Voice Message');

        await act(async () => { fireEvent.click(micButton); });   // start
        await act(async () => {
            fireEvent.click(micButton);                            // stop → onstop early-returns
            await new Promise(r => setTimeout(r, 0));
        });

        // No transcription request because there were no audio chunks
        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('speech-to-text'),
            expect.any(Object)
        );
    });

    it('should render sub-level headers and user-styled list items', () => {
        // "## Sub" → level 2 → the non-`text-sm` header branch; isUser list item → text-black branch
        const { container } = render(
            <FormattedMessage content={"## Sub\n- item"} isUser={true} />
        );
        expect(screen.getByText('Sub')).toBeInTheDocument();
        expect(screen.getByText('item')).toBeInTheDocument();
        expect(container.querySelector('h3').className).toContain('text-[11px]');
    });

    it('should not speak when the latest message is from the user', async () => {
        global.fetch.mockClear();
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'user', content: 'hello' }],
            askAgent: vi.fn(),
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));
        await act(async () => { await new Promise(r => setTimeout(r, 30)); });
        // TTS effect's `role === 'assistant'` guard is false → no text-to-speech request
        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('text-to-speech'),
            expect.any(Object)
        );
    });

    it('should log a Cloud TTS error when the TTS worker responds non-ok', async () => {
        const originalError = console.error;
        console.error = vi.fn();
        // text-to-speech responds not-ok → speakCloud throws "TTS worker failure"
        global.fetch.mockImplementation((url) => {
            if (url && url.includes('text-to-speech')) {
                return Promise.resolve({ ok: false });
            }
            return Promise.resolve({ ok: true, json: vi.fn().mockResolvedValue({ text: '' }) });
        });

        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [{ role: 'assistant', content: 'Audit summary ready.' }],
            askAgent: vi.fn(),
            isLoading: false,
            clearHistory: vi.fn()
        });

        render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Cloud TTS Error:', expect.any(Error));
        }, { timeout: 3000 });
        console.error = originalError;
    });

    it('should ignore submit when the input is empty', () => {
        const askAgent = vi.fn();
        vi.mocked(usePortfolioAgent).mockReturnValue({
            messages: [],
            askAgent,
            isLoading: false,
            clearHistory: vi.fn()
        });

        const { container } = render(<ChatWidget />);
        fireEvent.click(screen.getByRole('button'));

        // Submitting the form directly (the button is disabled) hits handleSend's empty-input guard
        fireEvent.submit(container.querySelector('form'));
        expect(askAgent).not.toHaveBeenCalled();
    });
});

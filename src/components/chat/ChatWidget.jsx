import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Minimize2, Maximize2, Shield, Mic, Volume2, VolumeX } from 'lucide-react';
import { usePortfolioAgent } from '../../hooks/usePortfolioAgent';
import { useAccount } from 'wagmi';
import { AGENT_TTS_URL, AGENT_STT_URL } from '../../config/worker';

const PricingCard = () => (
    <div className="mt-2 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-2 backdrop-blur-sm">
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Shield size={10} /> Service Package
            </span>
            <span className="text-white font-black text-[10px]">$500 - $10k+</span>
        </div>
        <div className="space-y-1">
            <p className="text-stone-300 text-[10px] font-bold">• Smart Contract Audits (Lite/Pro)</p>
            <p className="text-stone-300 text-[10px] font-bold">• Monthly Security Retainer</p>
        </div>
        <button 
            onClick={() => {
                window.dispatchEvent(new CustomEvent('ai_tool_trigger', { detail: { action: 'openModal', type: 'pricing' } }));
            }}
            className="w-full py-1.5 mt-1 bg-cyan-500 text-black rounded-lg font-bold text-[10px] hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1"
        >
            <span>Launch Mission Control Dashboard</span>
        </button>
    </div>
);

export const FormattedMessage = ({ content, isUser }) => {
    if (!content) return null;
    
    // 🎙️ Extract Audio Summary (Phase 17 refinement)
    // We strip [AUDIO: "..."] from the visible content but it stays in the raw for TTS
    // Strip protocol tags from the visible text (they stay in the raw content for
    // TTS / card rendering). Each family needs THREE guards: complete tag,
    // nested-JSON-tolerant complete tag, and an unterminated tag mid-stream —
    // the typewriter reveal shows partial tags one char at a time.
    // `(?:[^[\]]|\[[^\]]*\])*` tolerates one level of nested [] inside a payload
    // (e.g. [TOOL_CALL: {"args":["a","b"]}]) that a lazy `.*?\]` truncates at the
    // inner ] and leaks the trailing `}]`.
    const cleaned = content
        .replace(/\[AUDIO:\s*".*?"\]/gs, '')
        .replace(/\[AUDIO:[\s\S]*$/g, '')                       // unterminated AUDIO (mid-stream)
        .replace(/\[TOOL_CALL:(?:[^[\]]|\[[^\]]*\])*\]/g, '')   // complete, nested-[] tolerant
        .replace(/\[TOOL_CALL:[\s\S]*$/g, '')                   // unterminated (mid-stream)
        .replace(/\*\*TOOL_CALL:[\s\S]*?\*\*/g, '')
        .replace(/\[RENDER_CARD:(?:[^[\]]|\[[^\]]*\])*\]/g, '') // complete, nested-[] tolerant
        .replace(/\[RENDER_CARD:[\s\S]*$/g, '')                 // unterminated (mid-stream)
        .trim();

    // 🛠️ Pre-process: Bridge hanging bullets (bullet on own line)
    // and standardize raw CV paths into markdown links for easier parsing
    const preProcessed = cleaned
        .replace(/^([•*-])\s*\n/gm, '$1 ') // Join bullet to next line
        .replace(/(^|\s)(\/cvs\/[^\s)]+)/g, '$1[Download CV]($2)'); // Standardize raw CV paths
        
    const lines = preProcessed.split("\n");
    const blocks = [];
    let currentTable = null;

    lines.forEach((line) => {
        const trimmed = line.trim();
        
        // 📊 Table Detection
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            if (!currentTable) {
                currentTable = { type: 'table', rows: [] };
                blocks.push(currentTable);
            }
            const cells = trimmed.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
            currentTable.rows.push(cells);
            return;
        } else {
            currentTable = null;
        }

        // 🏷️ Header Detection
        if (trimmed.startsWith('#')) {
            const match = trimmed.match(/^(#+)\s*(.*)/);
            if (match) {
                blocks.push({ type: 'header', level: match[1].length, content: match[2] });
                return;
            }
        }

        // 📋 List Detection
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
        if (isBullet) {
            blocks.push({ type: 'list-item', content: trimmed.replace(/^[*•-]\s+/, '') });
            return;
        }

        // 🖋️ Paragraph/Break
        if (trimmed) {
            blocks.push({ type: 'paragraph', content: line });
        } else {
            blocks.push({ type: 'break' });
        }
    });

    return (
        <div className="space-y-1.5">
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'header': {
                        const level = Math.min(block.level, 3);
                        return (
                            <div key={idx} className="mt-4 mb-2 first:mt-1">
                                <h3 className={`text-cyan-400 font-black tracking-tighter uppercase border-b border-cyan-500/20 pb-0.5 ${level === 1 ? 'text-sm' : 'text-[11px]'}`}>
                                    {applyBoldAndLinks(block.content)}
                                </h3>
                            </div>
                        );
                    }
                    case 'table': {
                        const headerRow = block.rows[0];
                        const bodyRows = block.rows.slice(1).filter(row => !row.every(cell => cell.match(/^-+$/)));
                        if (bodyRows.length === 0 && block.rows.length > 1) return null; // Skip if only separator row
                        return (
                            <div key={idx} className="my-3 overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
                                <table className="w-full text-left text-[10px] border-collapse">
                                    <thead>
                                        <tr className="bg-white/10">
                                            {headerRow.map((cell, i) => (
                                                <th key={i} className="px-3 py-2 font-black text-cyan-400 uppercase tracking-wider border-b border-white/10">
                                                    {applyBoldAndLinks(cell)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bodyRows.map((row, i) => (
                                            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-3 py-2 text-stone-300">
                                                        {applyBoldAndLinks(cell)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    }
                    case 'list-item':
                        return (
                            <div key={idx} className="flex gap-2 items-start pl-2">
                                <span className="text-cyan-400 mt-1">•</span>
                                <span className={`${isUser ? 'text-black' : 'text-stone-300'} leading-relaxed text-[11px]`}>
                                    {applyBoldAndLinks(block.content)}
                                </span>
                            </div>
                        );
                    case 'paragraph':
                        return (
                            <p key={idx} className={`${isUser ? 'text-black' : 'text-stone-300'} leading-relaxed text-[11px]`}>
                                {applyBoldAndLinks(block.content)}
                            </p>
                        );
                    case 'break': {
                        return <div key={idx} className="h-1" data-testid="msg-break" />;
                    }
                }
            })}
        </div>
    );
};

const TypewriterContent = ({ content, isUser, onType }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    
    useEffect(() => {
        if (!content) return;
        
        if (isUser) {
            setDisplayedContent(content);
            return;
        }

        // Only "type" the new parts of the content during streaming
        if (content.length > displayedContent.length) {
            const timer = setTimeout(() => {
                const nextChunkSize = 8; 
                setDisplayedContent(content.slice(0, displayedContent.length + nextChunkSize));
                if (onType) onType(); // Notify parent to scroll
            }, 15);
            return () => clearTimeout(timer);
        } else if (content.length < displayedContent.length) {
            setDisplayedContent(content);
        }
    }, [content, displayedContent, isUser, onType]);

    return <FormattedMessage content={displayedContent} isUser={isUser} />;
};

const applyBoldAndLinks = (str) => {
    if (!str) return null;
    
    // 🔗 Parse standard markdown links [text](url)
    const parts = str.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/g).filter(Boolean);
    
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-white tracking-wide">{part.slice(2, -2)}</strong>;
        }
        
        const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            return (
                <a 
                    key={i} 
                    href={linkMatch[2]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors mx-0.5"
                >
                    {linkMatch[1]}
                </a>
            );
        }
        
        return part;
    });
};

const ChatWidget = () => {
    const { address } = useAccount();
    const { messages: aiMessages, askAgent, isLoading: aiLoading } = usePortfolioAgent();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    
    // 🎙️ VOICE CAPTURE STATES (Phase 3 Big & Fancy)
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isVoiceActive, setIsVoiceActive] = useState(true);
    const audioChunksRef = useRef([]);
    const hasSpokenMessageRef = useRef(new Set()); // Added for new logic

    // 🎙️ VOICE SYNTHESIS
    useEffect(() => {
        if (!aiLoading && aiMessages && aiMessages.length > 0 && isVoiceActive) {
            const lastMessage = aiMessages[aiMessages.length - 1];
            if (lastMessage.role === 'assistant' && !hasSpokenMessageRef.current.has(lastMessage.content)) {
                
                // 🎙️ Improved Audio Extraction (v2): Robust regex and debugging
                const audioMatch = lastMessage.content.match(/\[AUDIO:\s*"([^"]*)"\]/);
                let textToSpeak = "";

                if (audioMatch) {
                    textToSpeak = audioMatch[1].replace(/["']/g, ''); // Scrub any remaining nested quotes
                    console.log("SENTINEL_TTS: Captured summary ->", textToSpeak);
                } else {
                    // Fallback to first 5 sentences (v2 requirement)
                    textToSpeak = lastMessage.content
                        .split(/\[(?:TOOL_CALL|TOOLCALL|RENDER_CARD)/i)[0]
                        .split(/\*\*(?:TOOL_CALL|TOOLCALL|RENDER_CARD)/i)[0]
                        .replace(/(?:\n|^)(\|.*\|(?:\n|$))+/g, '\n Refer to the table for my complete rate logs. \n')
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
                        .replace(/[*#_~`|>]/g, '')
                        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') 
                        .replace(/\n+/g, '. ')
                        .trim()
                        .split(/[.!?]/).slice(0, 5).join('.') + '.';
                    console.log("SENTINEL_TTS: Fallback generated ->", textToSpeak);
                }
                
                hasSpokenMessageRef.current.add(lastMessage.content);
                
                if (!textToSpeak.trim()) return;

                const speakCloud = async (text) => {
                    try {
                        const response = await fetch(AGENT_TTS_URL, {
                            method: "POST",
                            body: JSON.stringify({ text }),
                            headers: { "Content-Type": "application/json" }
                        });
                        
                        if (!response.ok) throw new Error("TTS worker failure");
                        
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const audio = new Audio(url);
                        
                        // Set mood color BEFORE playing based on the source message
                        // (not `text`, which injects filler like "rate logs" for tables)
                        const lowerText = lastMessage.content.toLowerCase();
                        if (typeof window !== 'undefined') {
                            if (lowerText.includes('pricing') || lowerText.includes('rate') || lowerText.includes('package')) {
                                window.ai_mood_color = '#eab308'; // Gold 💳
                            } else if (lowerText.includes('audit') || lowerText.includes('vulnerabilit') || lowerText.includes('exploit')) {
                                window.ai_mood_color = '#f97316'; // Orange 🛡️
                            } else {
                                window.ai_mood_color = '#06b6d4'; // Default Cyan 🌐
                            }
                        }

                        // Simulate amplitude visualization during playback
                        let amplitudeInterval;
                        audio.onplay = () => {
                            if (typeof window !== 'undefined') {
                                amplitudeInterval = setInterval(() => {
                                    window.ai_voice_amplitude = Math.random() * 0.7 + 0.3;
                                    setTimeout(() => {
                                        if (window.ai_voice_amplitude > 0) window.ai_voice_amplitude = 0.05;
                                    }, 70);
                                }, 150);
                            }
                        };
                        
                        audio.play().catch(err => {
                            console.error('Failed to trigger audio playback:', err);
                        });

                        audio.onended = () => {
                            URL.revokeObjectURL(url);
                            if (amplitudeInterval) clearInterval(amplitudeInterval);
                            if (typeof window !== 'undefined') {
                                window.ai_voice_amplitude = 0;
                                window.ai_mood_color = '#06b6d4'; // Reset to Cyan
                            }
                        };
                    } catch (err) {
                        console.error("Cloud TTS Error:", err);
                    }
                };

                speakCloud(textToSpeak);
            }
        }
    }, [aiMessages, isVoiceActive, aiLoading]);

    const initAudio = () => {
        // No longer needed for cloud TTS, but keeps standard UX interaction flow
        console.log("SENTINEL_UX: Audio context initialized on interaction");
    };

    const handleVoiceInput = async () => {
        if (isRecording) {
            mediaRecorder?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (audioChunksRef.current.length === 0) return;
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsTranscribing(true);

                try {
                    const res = await fetch(AGENT_STT_URL, {
                        method: "POST",
                        body: await audioBlob.arrayBuffer()
                    });
                    const data = await res.json();
                    if (data.text) {
                        setInput(prev => prev ? `${prev} ${data.text}` : data.text);
                    }
                } catch (e) {
                    console.error("Transcription error:", e);
                } finally {
                    setIsTranscribing(false);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access failed:", err);
        }
    };

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        // Only auto-scroll if loading OR if it's the very first open
        if (aiLoading || aiMessages.length > 0) {
            scrollToBottom(aiLoading ? "auto" : "smooth"); // instant scroll during stream
        }
    }, [aiMessages, aiLoading, isOpen]);

    useEffect(() => {
        const handleToolTrigger = (e) => {
            const { action, type, anchor } = e.detail || {};
            console.log("ChatWidget received AI Tool trigger:", action, type, anchor);
            
            if (action === 'navigate' && anchor) {
                const element = document.getElementById(anchor);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // Other actions (like openModal) can be optionally handled here
            // or inside the target components (e.g., MissionControl) directly.
        };

        window.addEventListener('ai_tool_trigger', handleToolTrigger);
        return () => window.removeEventListener('ai_tool_trigger', handleToolTrigger);
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTranscribing) return;
        
        const userMsg = input;
        setInput(""); // 🚀 Instant Feedback: Clear input immediately
        initAudio();

        await askAgent(userMsg, address);
    };

    // if (!isConnected) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <AnimatePresence>
                {!isOpen ? (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center text-black border border-white/20 hover:scale-110 transition-transform"
                    >
                        <MessageSquare size={24} />
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className={`
                            w-80 md:w-96 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/80 overflow-hidden flex flex-col
                            ${isMinimized ? 'h-14' : 'h-[500px]'}
                        `}
                        style={{
                            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5), 0 0 20px -5px rgba(6,182,212,0.2)'
                        }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                                        <Shield size={16} />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight text-white uppercase">SENTINEL AI</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsVoiceActive(!isVoiceActive)}
                                    className={`p-1.5 rounded-md transition-colors ${isVoiceActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}`}
                                    title={isVoiceActive ? "Disable Voice" : "Enable Voice"}
                                >
                                    {isVoiceActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>
                                <button onClick={() => setIsMinimized(!isMinimized)} className="text-stone-400 hover:text-white transition-colors">
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Chat Body */}
                                <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                                        <div className="space-y-4">
                                            {aiMessages.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center py-10 text-center opacity-50">
                                                    <div className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                                                        <Shield size={24} />
                                                    </div>
                                                    <h4 className="text-white text-sm font-bold tracking-widest">AGENT STANDBY</h4>
                                                    <p className="text-stone-500 text-xs mt-1 px-4">Ask me about audits, smart contracts, or retainer options.</p>
                                                </div>
                                            )}
                                            
                                            {aiMessages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div 
                                                        className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                                                            msg.role === 'user' 
                                                                ? 'bg-cyan-500 rounded-tr-none' 
                                                                : 'bg-white/5 border border-white/10 text-stone-300 rounded-tl-none'
                                                        }`}
                                                        style={msg.role === 'user' ? { color: '#000000', fontWeight: 'bold' } : {}}
                                                    >
                                                        <TypewriterContent 
                                                            content={msg.content} 
                                                            isUser={msg.role === 'user'} 
                                                            onType={() => scrollToBottom("auto")}
                                                        />
 
                                                        {msg.content.includes('[RENDER_CARD: "pricing_tier_card"]') && (
                                                            <PricingCard />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {aiLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3">
                                                        <div className="flex gap-1">
                                                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" />
                                                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                </div>

                                {/* Input Area */}
                                <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/40">
                                    <div className="relative flex items-center gap-2">
                                        <div className="relative flex-grow">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                disabled={isTranscribing}
                                                placeholder={isTranscribing ? "Transcribing voice..." : "Ask Sentinel AI..."}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={!input.trim() || isTranscribing}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-500 text-black disabled:bg-stone-800 disabled:text-stone-600 transition-colors"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleVoiceInput}
                                            disabled={isTranscribing}
                                            className={`p-3 rounded-xl border transition-all ${
                                                isRecording
                                                    ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                                                    : 'bg-white/5 border-white/10 text-stone-400 hover:text-white hover:bg-white/10'
                                            }`}
                                            title={isRecording ? "Stop Recording" : "Send Voice Message"}
                                        >
                                            <Mic size={16} className={isTranscribing ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-center gap-1 opacity-20 hover:opacity-100 transition-opacity">
                                        <Shield size={10} className="text-cyan-500" />
                                        <span className="text-[10px] text-stone-500 uppercase tracking-tighter">
                                            Powered by Cloudflare AI
                                        </span>
                                    </div>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWidget;

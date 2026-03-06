import React, { useState, useRef, useEffect } from 'react'
import { Send, Brain, Sparkles, User, RotateCcw } from 'lucide-react'
import Layout from '../layout/Layout'
import useStore from '../../store/useStore'
import { askGemini } from '../../services/gemini'

const ADMIN_PROMPTS = [
    'What should I do right now to prevent a shortage?',
    'How many hours until our first critical breach?',
    'What are the top 3 risks this weekend?',
    'Explain the seasonal pattern for ICU beds',
    'Is our blood bank situation normal for this time of year?',
    'Do we need to activate patient diversion protocols?',
    'How should we adjust staffing for the upcoming night shift?',
    'Generate a supply chain emergency brief for PPE and Oxygen',
]

const USER_PROMPTS = [
    'What is Paracetamol used for and its common side effects?',
    'Can I take Ibuprofen with Amoxicillin together?',
    'What are the side effects of Metformin?',
    'How should I take Omeprazole — before or after food?',
    'What is the difference between Azithromycin and Amoxicillin?',
    'What precautions should I take while on blood thinners?',
    'Is it safe to take Cetirizine daily for allergies?',
    'What are the common uses of Vitamin D supplements?',
]

function Message({ msg }) {
    const isUser = msg.role === 'user'
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-bold"
                style={{
                    width: 32, height: 32,
                    background: isUser ? 'linear-gradient(135deg,#14b8a6,#0891b2)' : 'rgba(139,92,246,0.15)',
                    border: isUser ? 'none' : '1px solid rgba(139,92,246,0.3)',
                    color: isUser ? 'white' : '#8b5cf6',
                }}
            >
                {isUser ? <User size={14} /> : <Brain size={14} />}
            </div>
            <div className={isUser ? 'chat-user' : 'chat-ai'}>
                {msg.loading ? (
                    <div className="loading-dots py-1">
                        <span /><span /><span />
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {msg.content}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function GeminiChat() {
    const resources = useStore(s => s.resources)
    const user = useStore(s => s.user)
    const isUser = user?.role === 'USER' || user?.role === 'DOCTOR'
    const SUGGESTED_PROMPTS = isUser ? USER_PROMPTS : ADMIN_PROMPTS

    const getWelcomeMessage = () => {
        if (isUser) {
            return `💊 Hello! I'm MedGuard Medicine Assistant, powered by Google Gemini.\n\nI can help you with information about medicines — their uses, dosages, side effects, drug interactions, and precautions.\n\n**Ask me anything about your medications!**`
        }
        return `👋 Hello! I'm MedGuard AI, powered by Google Gemini.\n\nI have real-time access to your hospital's resource utilization data and can help you make data-driven decisions to prevent shortages.\n\n**Current status:** ${resources.filter(r => r.status === 'critical').length
            } critical alerts detected. What would you like to know?`
    }

    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: getWelcomeMessage(),
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const buildContext = () => {
        if (isUser) {
            return { mode: 'medicine_assistant', role: 'USER' }
        }
        return {
            timestamp: new Date().toISOString(),
            hospital: 'City General Hospital',
            role: user?.role || 'ADMIN',
            resources: resources.map(r => ({
                name: r.name,
                utilization: r.utilization,
                status: r.status,
                trend: r.trend,
                hours_to_breach: r.hours_to_breach,
            })),
            critical_count: resources.filter(r => r.status === 'critical').length,
            warning_count: resources.filter(r => r.status === 'warning').length,
        }
    }

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return
        const userMsg = { id: Date.now(), role: 'user', content: text }
        const loadingMsg = { id: Date.now() + 1, role: 'assistant', loading: true }
        setMessages(prev => [...prev, userMsg, loadingMsg])
        setInput('')
        setLoading(true)

        try {
            // Filter history to remove loading messages and format for backend
            const history = messages
                .filter(m => !m.loading && m.content)
                .map(m => ({ role: m.role, content: m.content }));

            const response = await askGemini(text, buildContext(), history)
            setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, loading: false, content: response } : m))
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === loadingMsg.id ? {
                ...m, loading: false,
                content: '⚠️ Could not reach AI service. Please check that your Gemini API key is configured.',
            } : m))
        }
        setLoading(false)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
    }

    const reset = () => setMessages([messages[0]])

    return (
        <Layout title="Gemini AI">
            <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 160px)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gradient mb-0.5">{isUser ? 'Medicine Assistant' : 'Gemini AI Assistant'}</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {isUser
                                ? 'Medicine info · Usage & dosage · Side effects · Drug interactions'
                                : 'Context-aware · Real-time resource data · Zero patient data'
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                            <Sparkles size={13} style={{ color: '#8b5cf6' }} />
                            <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>gemini-3.0-flash</span>
                        </div>
                        <button onClick={reset} className="btn-ghost text-xs py-1.5">
                            <RotateCcw size={13} /> Reset
                        </button>
                    </div>
                </div>

                {/* Suggested prompts */}
                <div className="flex gap-2 flex-wrap mb-4">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                        <button
                            key={p}
                            onClick={() => sendMessage(p)}
                            className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                            style={{
                                background: 'var(--teal-glow)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--teal-strong)',
                                cursor: 'pointer',
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2 pb-4 glass-card-static p-4">
                    {messages.map(msg => <Message key={msg.id} msg={msg} />)}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="mt-4 flex gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={isUser
                                ? 'Ask about medicines, dosages, side effects, drug interactions… (Enter to send)'
                                : 'Ask about resource status, predictions, recommendations… (Enter to send)'
                            }
                            rows={2}
                            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all duration-200"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                fontFamily: 'Inter, sans-serif',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--border-hover)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading}
                        className="flex items-center justify-center rounded-xl px-4 transition-all duration-200 self-stretch"
                        style={{
                            background: input.trim() && !loading ? 'linear-gradient(135deg,#14b8a6,#0891b2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${input.trim() && !loading ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                            color: input.trim() && !loading ? 'white' : 'var(--text-muted)',
                            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                            minWidth: 48,
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>

                {/* More prompts */}
                <div className="flex gap-2 flex-wrap mt-3">
                    {SUGGESTED_PROMPTS.slice(4).map((p) => (
                        <button
                            key={p}
                            onClick={() => sendMessage(p)}
                            className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </Layout>
    )
}

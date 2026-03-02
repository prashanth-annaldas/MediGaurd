import React, { useEffect, useState } from 'react'
import { X, AlertTriangle, Info, CheckCircle, AlarmClock } from 'lucide-react'

const configs = {
    critical: {
        icon: AlertTriangle,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.12)',
        border: 'rgba(239,68,68,0.3)',
        label: 'CRITICAL',
    },
    warning: {
        icon: AlarmClock,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.25)',
        label: 'WARNING',
    },
    info: {
        icon: Info,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.1)',
        border: 'rgba(59,130,246,0.25)',
        label: 'INFO',
    },
    success: {
        icon: CheckCircle,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        border: 'rgba(16,185,129,0.25)',
        label: 'OK',
    },
}

export default function Toast({ toast, onDismiss }) {
    const [visible, setVisible] = useState(false)
    const cfg = configs[toast.type] || configs.info
    const Icon = cfg.icon

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10)
        return () => clearTimeout(t)
    }, [])

    return (
        <div
            className="relative rounded-xl overflow-hidden"
            style={{
                background: 'var(--bg-topbar)',
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}`,
                transform: visible ? 'translateX(0)' : 'translateX(120%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                backdropFilter: 'blur(12px)',
                minWidth: 300,
            }}
        >
            {/* Accent bar */}
            <div style={{ height: 2, background: cfg.color, width: '100%' }} />

            <div className="flex items-start gap-3 p-4">
                <div
                    className="flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5"
                    style={{ width: 32, height: 32, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                    <Icon size={16} style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span
                            className="text-xs font-bold tracking-wider px-1.5 py-0.5 rounded"
                            style={{ color: cfg.color, background: cfg.bg }}
                        >
                            {cfg.label}
                        </span>
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{toast.title}</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{toast.message}</p>
                </div>

                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
                    style={{
                        width: 24, height: 24,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={12} />
                </button>
            </div>
        </div>
    )
}

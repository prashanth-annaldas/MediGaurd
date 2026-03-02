import React from 'react'
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react'

const statusColors = {
    critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444', glow: 'rgba(239,68,68,0.15)' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
    normal: { bg: 'rgba(10,22,40,0.8)', border: 'rgba(45,212,191,0.12)', text: '#10b981', glow: 'transparent' },
}

function TrendIcon({ trend }) {
    if (trend === 'rising') return <TrendingUp size={13} color="#ef4444" />
    if (trend === 'falling') return <TrendingDown size={13} color="#10b981" />
    return <Minus size={13} color="var(--text-secondary)" />
}

export default function StatCard({ resource, onClick }) {
    const s = statusColors[resource.status] || statusColors.normal
    const htb = resource.hours_to_breach

    return (
        <div
            className="glass-card cursor-pointer transition-all duration-200 relative overflow-hidden"
            style={{
                background: s.bg,
                borderColor: s.border,
                boxShadow: resource.status !== 'normal' ? `0 0 20px ${s.glow}` : undefined,
            }}
            onClick={onClick}
        >
            {/* Status pulse for critical */}
            {resource.status === 'critical' && (
                <div
                    className="absolute top-3 right-3 w-2 h-2 rounded-full pulse-ring"
                    style={{ background: '#ef4444' }}
                />
            )}

            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xl mb-0.5">{resource.icon}</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{resource.name}</p>
                    </div>
                    <div
                        className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                    >
                        {resource.status}
                    </div>
                </div>

                {/* Value */}
                <div className="flex items-end gap-2 mb-2">
                    <p
                        className="ticker text-3xl font-bold leading-none"
                        style={{ color: s.text, textShadow: `0 0 12px ${s.text}60` }}
                    >
                        {resource.utilization}
                    </p>
                    <p className="text-xs mb-1 font-medium pb-1" style={{ color: 'var(--text-muted)' }}>%</p>
                    <div className="ml-auto flex items-center gap-1 pb-1">
                        <TrendIcon trend={resource.trend} />
                        <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{resource.trend}</span>
                    </div>
                </div>

                {/* Lead time to breach */}
                {htb != null && (
                    <div
                        className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg"
                        style={{
                            background: resource.status === 'critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${resource.status === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
                        }}
                    >
                        <Clock size={11} style={{ color: resource.status === 'critical' ? '#ef4444' : '#f59e0b' }} />
                        <p className="text-xs font-semibold" style={{ color: resource.status === 'critical' ? '#ef4444' : '#f59e0b' }}>
                            Breach in {htb}h
                        </p>
                    </div>
                )}

                {/* Description */}
                <p className="text-xs mt-2 leading-tight" style={{ color: 'var(--text-muted)' }}>{resource.description}</p>
            </div>
        </div>
    )
}

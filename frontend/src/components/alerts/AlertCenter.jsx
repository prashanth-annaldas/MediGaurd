import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Bell, Clock, AlertTriangle, Info, Filter, Trash2, CheckCircle } from 'lucide-react'
import useStore from '../../store/useStore'
import Layout from '../layout/Layout'
import { timeAgo } from '../../utils/dateUtils'

const severityOrder = { critical: 0, warning: 1, info: 2 }
const severityColors = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    safe: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
}

function AlertCard({ alert, onDelete }) {
    const [expanded, setExpanded] = useState(false)
    const sc = severityColors[alert.severity] || severityColors.info

    return (
        <div
            className="rounded-xl overflow-hidden transition-all duration-200"
            style={{ background: sc.bg, border: `1px solid ${sc.border}`, boxShadow: alert.severity === 'critical' ? `0 0 20px rgba(239,68,68,0.1)` : 'none' }}
        >
            <div
                className="flex items-start gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Severity icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {alert.severity === 'critical' && <AlertTriangle size={18} color="#ef4444" />}
                    {alert.severity === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
                    {alert.severity === 'info' && <Info size={18} color="#3b82f6" />}
                    {alert.severity === 'safe' && <CheckCircle size={18} color="#22c55e" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        >
                            {alert.severity}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.resource}</span>
                        {alert.isSimulated && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
                                SIMULATED
                            </span>
                        )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                </div>

                {/* Right: time + breach + actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(alert.created_at)}</span>
                    {alert.hours_to_breach && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                            <Clock size={10} style={{ color: sc.color }} />
                            <span className="text-xs font-bold ticker" style={{ color: sc.color }}>
                                {alert.hours_to_breach}h
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(alert.id); }}
                            className="p-1 rounded hover:bg-red-500/10 transition-colors group"
                            title="Delete Alert"
                        >
                            <Trash2 size={14} className="text-[var(--text-muted)] group-hover:text-alert-critical transition-colors" />
                        </button>
                        {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                </div>
            </div>

            {/* Expanded: AI recommendations */}
            {expanded && alert.recommendations && (
                <div
                    className="mx-4 mb-4 p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(45,212,191,0.1)' }}
                >
                    <p className="text-xs font-semibold mb-3" style={{ color: '#2dd4bf' }}>
                        🤖 AI-Ranked Recommendations
                    </p>
                    <ol className="space-y-2">
                        {alert.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span
                                    className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold mt-0.5"
                                    style={{ width: 20, height: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                                >
                                    {i + 1}
                                </span>
                                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rec}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    )
}

export default function AlertCenter() {
    const { alerts, markAlertsRead, fetchAlerts, deleteAlert, clearAllAlerts } = useStore()
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        markAlertsRead()
        fetchAlerts()
    }, [])

    const sorted = [...alerts].sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
    const filtered = filter === 'all' ? sorted : sorted.filter(a => a.severity === filter)

    const critCount = alerts.filter(a => a.severity === 'critical').length
    const warnCount = alerts.filter(a => a.severity === 'warning').length

    return (
        <Layout title="Alert Center">
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-xl font-bold text-gradient mb-1">Alert Center</h2>
                    <div className="flex items-center gap-3">
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {critCount} critical · {warnCount} warnings
                        </p>
                        {alerts.length > 0 && (
                            <button
                                onClick={() => { if (window.confirm('Clear all alerts?')) clearAllAlerts() }}
                                className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-alert-critical/10 text-alert-critical hover:bg-alert-critical/20 transition-colors border border-alert-critical/30"
                            >
                                <Trash2 size={12} /> Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                    {[
                        { key: 'all', label: `All (${alerts.length})`, color: '#2dd4bf' },
                        { key: 'critical', label: `Critical (${critCount})`, color: '#ef4444' },
                        { key: 'warning', label: `Warning (${warnCount})`, color: '#f59e0b' },
                        { key: 'info', label: 'Info', color: '#3b82f6' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                            style={{
                                background: filter === f.key ? `rgba(${f.color === '#2dd4bf' ? '45,212,191' : f.color === '#ef4444' ? '239,68,68' : f.color === '#f59e0b' ? '245,158,11' : '59,130,246'},0.15)` : 'var(--bg-secondary)',
                                border: `1px solid ${filter === f.key ? f.color + '50' : 'var(--border-color)'}`,
                                color: filter === f.key ? f.color : 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="glass-card-static p-12 text-center">
                        <Bell size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No {filter === 'all' ? '' : filter} alerts at this time</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All resources are within safe operational thresholds</p>
                    </div>
                )}
                {filtered.map(a => (
                    <AlertCard key={a.id} alert={a} onDelete={deleteAlert} />
                ))}
            </div>
        </Layout>
    )
}

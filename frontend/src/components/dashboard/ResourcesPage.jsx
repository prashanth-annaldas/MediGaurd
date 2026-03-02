import React, { useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import useStore from '../../store/useStore'
import Layout from '../layout/Layout'
import CapacityForm from '../capacity/CapacityForm'

const statusIcon = {
    critical: <AlertTriangle size={14} color="#ef4444" />,
    warning: <AlertTriangle size={14} color="#f59e0b" />,
    normal: <CheckCircle size={14} color="#10b981" />,
}

const trendIcon = {
    rising: <TrendingUp size={13} color="#ef4444" />,
    falling: <TrendingDown size={13} color="#10b981" />,
    stable: <Minus size={13} color="var(--text-secondary)" />,
}

const statusRing = {
    critical: 'rgba(239,68,68,0.15)',
    warning: 'rgba(245,158,11,0.1)',
    normal: 'transparent',
}

export default function ResourcesPage() {
    const { resources, user, refreshData } = useStore() // Need user to conditionally show CapacityForm

    // Ensure we have fresh synchronized DB data immediately when swapping tabs
    useEffect(() => {
        refreshData()
    }, [refreshData, user])

    return (
        <Layout title="Resources">
            {/* Show Capacity Form if logged in as Admin or Staff */}
            {user && ['ADMIN', 'STAFF'].includes(user.role) && (
                <div className="mb-10">
                    <CapacityForm />
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-xl font-bold text-gradient mb-1">Resource Overview</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Aggregated operational utilization based on current live data
                </p>
            </div>

            <div className="glass-card-static overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(45,212,191,0.1)' }}>
                            {['Resource', 'Utilization', 'Status', 'Trend', 'Threshold', 'Breach In', 'Action'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((r, i) => (
                            <tr
                                key={r.id}
                                style={{
                                    borderBottom: i < resources.length - 1 ? '1px solid rgba(45,212,191,0.06)' : 'none',
                                    background: statusRing[r.status],
                                }}
                                className="transition-colors hover:bg-white/5"
                            >
                                {/* Resource name */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{r.icon}</span>
                                        <div>
                                            <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Utilization bar */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3 min-w-[120px]">
                                        <p className="ticker font-bold text-sm" style={{ color: r.status === 'critical' ? '#ef4444' : r.status === 'warning' ? '#f59e0b' : '#2dd4bf', minWidth: 42 }}>
                                            {r.utilization}%
                                        </p>
                                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', minWidth: 60 }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${r.utilization}%`,
                                                    background: r.status === 'critical' ? '#ef4444' : r.status === 'warning' ? '#f59e0b' : '#10b981',
                                                    boxShadow: r.status === 'critical' ? '0 0 6px rgba(239,68,68,0.5)' : undefined,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5">
                                        {statusIcon[r.status]}
                                        <span className="capitalize text-xs font-semibold"
                                            style={{ color: r.status === 'critical' ? '#ef4444' : r.status === 'warning' ? '#f59e0b' : '#10b981' }}>
                                            {r.status}
                                        </span>
                                    </div>
                                </td>

                                {/* Trend */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5">
                                        {trendIcon[r.trend]}
                                        <span className="capitalize text-xs" style={{ color: 'var(--text-secondary)' }}>{r.trend}</span>
                                    </div>
                                </td>

                                {/* Threshold */}
                                <td className="px-4 py-4">
                                    <span className="ticker text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {r.inverted ? `Low` : `High`}: {r.inverted ? r.criticalThreshold : r.criticalThreshold}%
                                    </span>
                                </td>

                                {/* Hours to breach */}
                                <td className="px-4 py-4">
                                    {r.hours_to_breach != null ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg inline-flex"
                                            style={{
                                                background: r.status === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                border: `1px solid ${r.status === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
                                            }}>
                                            <Clock size={11} style={{ color: r.status === 'critical' ? '#ef4444' : '#f59e0b' }} />
                                            <span className="ticker text-xs font-bold" style={{ color: r.status === 'critical' ? '#ef4444' : '#f59e0b' }}>
                                                {r.hours_to_breach}h
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                                    )}
                                </td>

                                {/* Action */}
                                <td className="px-4 py-4">
                                    <span className="text-xs px-2 py-1 rounded-lg" style={{
                                        background: r.status === 'critical'
                                            ? 'rgba(239,68,68,0.1)' : r.status === 'warning'
                                                ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                                        color: r.status === 'critical' ? '#ef4444' : r.status === 'warning' ? '#f59e0b' : '#10b981',
                                        border: `1px solid ${r.status === 'critical' ? 'rgba(239,68,68,0.2)' : r.status === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`,
                                    }}>
                                        {r.status === 'critical' ? 'Immediate' : r.status === 'warning' ? 'Monitor' : 'No action'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {[
                    { label: 'Critical Resources', count: resources.filter(r => r.status === 'critical').length, color: '#ef4444' },
                    { label: 'Warning Resources', count: resources.filter(r => r.status === 'warning').length, color: '#f59e0b' },
                    { label: 'Normal Resources', count: resources.filter(r => r.status === 'normal').length, color: '#10b981' },
                ].map(s => (
                    <div key={s.label} className="glass-card p-4 flex items-center gap-4">
                        <p className="text-4xl font-black ticker" style={{ color: s.color }}>{s.count}</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                    </div>
                ))}
            </div>
        </Layout>
    )
}

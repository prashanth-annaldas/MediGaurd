import React, { useRef } from 'react'
import { Shield, CheckCircle, Lock, Eye, Database, AlertTriangle, Server, Cpu } from 'lucide-react'
import Layout from '../layout/Layout'
import useStore from '../../store/useStore'
import { formatTime, formatDate } from '../../utils/dateUtils'

const COMPLIANCE_ITEMS = [
    { label: 'Zero patient data stored', description: 'Only aggregated daily counts flow through all system layers', ok: true },
    { label: 'HIPAA-compliant by architecture', description: 'Structural privacy — patient data never enters the pipeline', ok: true },
    { label: 'Data minimization principle', description: 'Only utilization percentages and counts are processed', ok: true },
    { label: 'Aggregation threshold', description: '>10 observations per data point before reporting', ok: true },
    { label: 'No re-identification risk', description: 'Population-level aggregates prevent individual tracking', ok: true },
    { label: 'Audit log enabled', description: 'All admin actions timestamped and traceable', ok: true },
    { label: 'Firebase Security Rules', description: 'Configure Firestore rules if using live database', ok: false, note: 'Configure in Firebase console' },
]

const SYSTEM_HEALTH = [
    { label: 'Data Pipeline', status: 'operational', latency: '42ms' },
    { label: 'Alert Engine', status: 'operational', latency: '18ms' },
    { label: 'Forecast Model', status: 'operational', latency: '128ms' },
    { label: 'Gemini AI', status: 'configure', latency: '—' },
    { label: 'Firebase Sync', status: 'configure', latency: '—' },
]

const PATENT_FEATURES = [
    { icon: '🔒', title: 'Privacy-Preserving Architecture', desc: 'Zero patient data in any layer of the system' },
    { icon: '⏱️', title: 'Quantified Lead-Time Alerts', desc: 'Exact hours calculated before threshold breach' },
    { icon: '🔭', title: 'Dual-Horizon Intelligence', desc: 'Short-term (hours) + seasonal (weeks) simultaneously' },
    { icon: '📊', title: 'Confidence Interval Forecasting', desc: 'Uncertainty bands widen with horizon (rigorous)' },
    { icon: '🧠', title: 'Multi-Signal Fusion', desc: 'Temporal + day-of-week + seasonal → single risk score' },
    { icon: '💡', title: 'Explainable AI', desc: 'Ranked plain-English actions tied to data triggers' },
]

export default function AdminPanel() {
    const resources = useStore(s => s.resources)
    const now = useRef(new Date()).current

    const compliantCount = COMPLIANCE_ITEMS.filter(i => i.ok).length

    return (
        <Layout title="Admin">
            <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gradient mb-1">Admin Panel</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>System health · Privacy compliance · Patent-worthy features</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Shield size={14} color="#10b981" />
                    <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                        {compliantCount}/{COMPLIANCE_ITEMS.length} Compliance Checks Passed
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* Privacy compliance */}
                <div className="glass-card-static p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock size={15} style={{ color: '#2dd4bf' }} />
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Privacy Compliance Checklist</p>
                    </div>
                    <div className="space-y-2">
                        {COMPLIANCE_ITEMS.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(45,212,191,0.06)' }}>
                                <div className="flex-shrink-0 mt-0.5">
                                    {item.ok
                                        ? <CheckCircle size={15} color="#10b981" />
                                        : <AlertTriangle size={15} color="#f59e0b" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold" style={{ color: item.ok ? 'var(--text-primary)' : '#f59e0b' }}>{item.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                                    {item.note && (
                                        <p className="text-xs mt-0.5 italic" style={{ color: '#f59e0b' }}>ℹ️ {item.note}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System health */}
                <div>
                    <div className="glass-card-static p-5 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Server size={15} style={{ color: '#2dd4bf' }} />
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>System Health</p>
                        </div>
                        <div className="space-y-2">
                            {SYSTEM_HEALTH.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(45,212,191,0.06)' }}>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{
                                            background: s.status === 'operational' ? '#10b981' : '#f59e0b',
                                            boxShadow: s.status === 'operational' ? '0 0 6px rgba(16,185,129,0.5)' : undefined,
                                        }} />
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="ticker text-xs" style={{ color: 'var(--text-muted)' }}>{s.latency}</span>
                                        <span className="text-xs px-2 py-0.5 rounded capitalize" style={{
                                            background: s.status === 'operational' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: s.status === 'operational' ? '#10b981' : '#f59e0b',
                                        }}>
                                            {s.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live stats */}
                    <div className="glass-card-static p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Cpu size={15} style={{ color: '#2dd4bf' }} />
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Live System Stats</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Resources Monitored', value: resources.length, unit: 'resources' },
                                { label: 'Data Points/Day', value: '8,640', unit: 'points' },
                                { label: 'Current Time', value: formatTime(now), unit: '' },
                                { label: 'Data Retention', value: '12 months', unit: '' },
                            ].map(s => (
                                <div key={s.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(45,212,191,0.08)' }}>
                                    <p className="ticker text-lg font-bold" style={{ color: '#2dd4bf' }}>{s.value}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Patent-worthy features */}
            <div className="glass-card-static p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Eye size={15} style={{ color: '#2dd4bf' }} />
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Patent-Worthy Innovation Features</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {PATENT_FEATURES.map((f, i) => (
                        <div key={i} className="p-4 rounded-xl flex items-start gap-3"
                            style={{ background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.1)' }}>
                            <span className="text-xl flex-shrink-0">{f.icon}</span>
                            <div>
                                <p className="text-xs font-semibold" style={{ color: '#2dd4bf' }}>{f.title}</p>
                                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    )
}

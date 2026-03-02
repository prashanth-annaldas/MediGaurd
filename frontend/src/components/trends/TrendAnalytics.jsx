import React, { useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts'
import { Calendar, AlertTriangle, TrendingUp, Sun, Moon } from 'lucide-react'
import Layout from '../layout/Layout'
import useStore from '../../store/useStore'
import { generateMonthlyTrends } from '../../utils/dataGenerators'

const monthlyData = generateMonthlyTrends()

const RESOURCES = [
    { id: 'icu_beds', label: 'ICU Beds', color: '#3b82f6' },
    { id: 'oxygen_supply', label: 'Oxygen', color: '#06b6d4' },
    { id: 'ventilators', label: 'Ventilators', color: '#8b5cf6' },
    { id: 'blood_bank', label: 'Blood Bank', color: '#ef4444' },
    { id: 'ppe_stock', label: 'PPE Stock', color: '#f59e0b' },
    { id: 'nursing_staff', label: 'Nursing', color: '#10b981' },
]

const DOW_PATTERN = [
    { day: 'Mon', icu: 80, oxygen: 64, ventilators: 72, blood: 58, ppe: 46, nursing: 83 },
    { day: 'Tue', icu: 82, oxygen: 63, ventilators: 73, blood: 57, ppe: 45, nursing: 85 },
    { day: 'Wed', icu: 81, oxygen: 64, ventilators: 71, blood: 56, ppe: 44, nursing: 84 },
    { day: 'Thu', icu: 79, oxygen: 65, ventilators: 70, blood: 57, ppe: 45, nursing: 82 },
    { day: 'Fri', icu: 77, oxygen: 63, ventilators: 69, blood: 58, ppe: 45, nursing: 81 },
    { day: 'Sat', icu: 73, oxygen: 66, ventilators: 66, blood: 60, ppe: 47, nursing: 77 },
    { day: 'Sun', icu: 72, oxygen: 67, ventilators: 65, blood: 61, ppe: 48, nursing: 76 },
]

const SHORTAGE_HISTORY = [
    { date: '2025-01-15', resource: 'ICU Beds', hours: 72, severity: 'critical', notes: 'Flu season surge' },
    { date: '2025-04-03', resource: 'Oxygen Supply', hours: 18, severity: 'warning', notes: 'Supplier delay' },
    { date: '2025-07-22', resource: 'Nursing Staff', hours: 48, severity: 'critical', notes: 'Summer vacation gap' },
    { date: '2025-11-08', resource: 'Ventilators', hours: 36, severity: 'warning', notes: 'Respiratory season' },
    { date: '2026-01-30', resource: 'Blood Bank', hours: 24, severity: 'warning', notes: 'Donation shortfall' },
]

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-card-static p-3 text-xs">
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="ticker font-bold" style={{ color: 'var(--text-primary)' }}>{p.value}%</span>
                </div>
            ))}
        </div>
    )
}

export default function TrendAnalytics() {
    const { trends, fetchTrends } = useStore()
    const [activeResource, setActiveResource] = useState('icu_beds')
    const selected = RESOURCES.find(r => r.id === activeResource) || RESOURCES[0]

    React.useEffect(() => {
        fetchTrends()
    }, [fetchTrends])

    const displayData = trends && trends.length > 0 ? trends : monthlyData

    return (
        <Layout title="Trends">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gradient mb-1">Trend Analytics</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    12-month seasonal patterns · Day-of-week cycles · Historical shortage events
                </p>
            </div>

            {/* 12-Month trend chart */}
            <div className="glass-card-static p-5 mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>12-Month Utilization Trends</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aggregated monthly resource utilization indices</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {RESOURCES.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setActiveResource(r.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200"
                                style={{
                                    background: activeResource === r.id ? `${r.color}20` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${activeResource === r.id ? r.color + '50' : 'rgba(255,255,255,0.06)'}`,
                                    color: activeResource === r.id ? r.color : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={displayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[20, 100]} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={activeResource} name={selected.label} fill={selected.color} radius={[4, 4, 0, 0]}
                            fillOpacity={0.8} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Day-of-week pattern */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="glass-card-static p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={15} style={{ color: '#2dd4bf' }} />
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Day-of-Week Patterns</p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={DOW_PATTERN} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[50, 100]} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="icu" name="ICU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="nursing" name="Nursing" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="ventilators" name="Ventilators" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-3 mt-3 flex-wrap">
                        {[
                            { color: '#3b82f6', label: 'ICU Beds' },
                            { color: '#10b981', label: 'Nursing' },
                            { color: '#8b5cf6', label: 'Ventilators' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-0.5 rounded" style={{ background: l.color, display: 'inline-block' }} />
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak vs. trough */}
                <div className="glass-card-static p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={15} style={{ color: '#2dd4bf' }} />
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Peak vs. Trough Analysis</p>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Weekday Peak', days: 'Mon–Wed', value: '81%', icon: <Sun size={13} />, color: '#ef4444' },
                            { label: 'Weekend Trough', days: 'Sat–Sun', value: '72%', icon: <Moon size={13} />, color: '#3b82f6' },
                            { label: 'Flu Season Peak', months: 'Nov–Jan', value: '+8%', color: '#f59e0b', icon: '❄️' },
                            { label: 'Summer Dip', months: 'Jun–Aug', value: '-5%', color: '#10b981', icon: '☀️' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between p-3 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(45,212,191,0.06)' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ color: s.color }}>{s.icon}</span>
                                    <div>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.days || s.months}</p>
                                    </div>
                                </div>
                                <span className="ticker font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Historical shortage table */}
            <div className="glass-card-static p-5">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Historical Shortage Events</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(45,212,191,0.08)' }}>
                                {['Date', 'Resource', 'Duration', 'Severity', 'Root Cause', 'Status'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SHORTAGE_HISTORY.map((e, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors"
                                    style={{ borderBottom: i < SHORTAGE_HISTORY.length - 1 ? '1px solid rgba(45,212,191,0.05)' : 'none' }}>
                                    <td className="px-3 py-3 text-xs ticker" style={{ color: 'var(--text-secondary)' }}>{e.date}</td>
                                    <td className="px-3 py-3 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{e.resource}</td>
                                    <td className="px-3 py-3 text-xs ticker font-semibold" style={{ color: '#2dd4bf' }}>{e.hours}h</td>
                                    <td className="px-3 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                                            style={{
                                                background: e.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                color: e.severity === 'critical' ? '#ef4444' : '#f59e0b',
                                                border: `1px solid ${e.severity === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
                                            }}>
                                            {e.severity}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{e.notes}</td>
                                    <td className="px-3 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                                            Resolved
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    )
}

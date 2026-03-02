import React, { useState, useEffect } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { Clock, Target, Activity, TrendingUp } from 'lucide-react'
import Layout from '../layout/Layout'
import useStore from '../../store/useStore'

const RESOURCE_OPTIONS = [
    { id: 'icu_beds', label: 'ICU Beds', color: '#3b82f6', threshold: 85 },
    { id: 'oxygen_supply', label: 'Oxygen Supply', color: '#06b6d4', threshold: 30 },
    { id: 'ventilators', label: 'Ventilators', color: '#8b5cf6', threshold: 80 },
    { id: 'blood_bank', label: 'Blood Bank', color: '#ef4444', threshold: 25 },
    { id: 'ppe_stock', label: 'PPE Stock', color: '#f59e0b', threshold: 20 },
    { id: 'nursing_staff', label: 'Nursing Staff', color: '#10b981', threshold: 90 },
]

function buildForecastPoints(resourceId, horizon) {
    const bases = { icu_beds: 78.5, oxygen_supply: 62, ventilators: 71, blood_bank: 56, ppe_stock: 44, nursing_staff: 82 }
    const rates = { icu_beds: 0.8, oxygen_supply: -0.4, ventilators: 0.5, blood_bank: -0.6, ppe_stock: -0.3, nursing_staff: 0.2 }
    const base = bases[resourceId] ?? 70
    const rate = rates[resourceId] ?? 0

    return Array.from({ length: horizon + 1 }, (_, h) => {
        const step = Math.floor(h)
        const hour = (new Date().getHours() + step) % 24
        const seasonal = Math.sin((hour - 6) * Math.PI / 12) * 3
        const val = Math.min(100, Math.max(0, base + rate * step + seasonal))
        const uncertainty = 1.5 + (step / horizon) * 9
        return {
            hour: step,
            label: step === 0 ? 'Now' : `+${step}h`,
            forecast: parseFloat(val.toFixed(1)),
            ci_upper: parseFloat(Math.min(100, val + uncertainty).toFixed(1)),
            ci_lower: parseFloat(Math.max(0, val - uncertainty).toFixed(1)),
        }
    })
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const forecast = payload.find(p => p.dataKey === 'forecast')
    const upper = payload.find(p => p.dataKey === 'ci_upper')
    const lower = payload.find(p => p.dataKey === 'ci_lower')
    return (
        <div className="glass-card-static p-3 text-xs">
            <p className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
            <p style={{ color: forecast?.color || '#2dd4bf' }}>Forecast: <strong>{forecast?.value}%</strong></p>
            {upper && lower && (
                <p style={{ color: 'var(--text-muted)' }}>95% CI: {lower.value}% – {upper.value}%</p>
            )}
        </div>
    )
}

export default function ForecastDashboard() {
    const { resources, forecastData, fetchForecast } = useStore()
    const [selectedId, setSelectedId] = useState('icu_beds')
    const [horizon, setHorizon] = useState(24)

    const selected = RESOURCE_OPTIONS.find(r => r.id === selectedId)
    const resource = resources.find(r => r.id === selectedId)

    useEffect(() => {
        fetchForecast(selectedId, horizon)
    }, [selectedId, horizon, fetchForecast])

    const points = forecastData && forecastData.length > 0 ? forecastData : [];

    const breachPoint = points.find(p => {
        const inverted = ['oxygen_supply', 'blood_bank', 'ppe_stock'].includes(selectedId)
        return inverted
            ? p.forecast <= selected.threshold
            : p.forecast >= selected.threshold
    })

    return (
        <Layout title="AI Forecast">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gradient mb-1">AI Forecast Dashboard</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Multi-signal fusion · Dual-horizon intelligence · Confidence interval modelling
                </p>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Resource selector */}
                <div className="glass-card-static p-4">
                    <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Select Resource</p>
                    <div className="grid grid-cols-2 gap-2">
                        {RESOURCE_OPTIONS.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedId(r.id)}
                                className="px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all duration-200"
                                style={{
                                    background: selectedId === r.id ? `${r.color}20` : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${selectedId === r.id ? r.color + '50' : 'rgba(255,255,255,0.06)'}`,
                                    color: selectedId === r.id ? r.color : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Horizon slider */}
                <div className="glass-card-static p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Forecast Horizon</p>
                            <p className="ticker text-lg font-bold" style={{ color: '#2dd4bf' }}>{horizon}h</p>
                        </div>
                        <input
                            type="range" min={6} max={168} step={6} value={horizon}
                            onChange={e => setHorizon(Number(e.target.value))}
                            className="w-full accent-teal-500"
                            style={{ cursor: 'pointer' }}
                        />
                        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            <span>6h</span><span>24h</span><span>72h</span><span>7d (168h)</span>
                        </div>
                    </div>

                    {/* Breach prediction */}
                    {breachPoint ? (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <div className="flex items-center gap-2">
                                <Clock size={14} color="#ef4444" />
                                <p className="text-xs font-bold" style={{ color: '#ef4444' }}>
                                    Threshold breach predicted at +{breachPoint.hour}h
                                </p>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {selected.label} projected to reach {selected.threshold}% — immediate action recommended
                            </p>
                        </div>
                    ) : (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <p className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                ✅ No breach predicted within {horizon}h horizon
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Forecast chart */}
            <div className="glass-card-static p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.label} — {horizon}h Forecast</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Shaded area = 95% confidence interval · Wider bands = greater uncertainty with horizon
                        </p>
                    </div>
                    <Activity size={16} style={{ color: selected.color }} />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={points} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={selected.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={selected.color} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={selected.color} stopOpacity={0.08} />
                                <stop offset="95%" stopColor={selected.color} stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                            interval={Math.floor(points.length / 6)} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Threshold reference line */}
                        <ReferenceLine
                            y={selected.threshold} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5}
                            label={{ value: `Threshold ${selected.threshold}%`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                        />

                        {/* CI upper */}
                        <Area type="monotone" dataKey="ci_upper" stroke="none" fill="url(#ciGrad)" />
                        {/* CI lower (fill area between) */}
                        <Area type="monotone" dataKey="ci_lower" stroke="none" fill="var(--bg-primary)" />
                        {/* Forecast line */}
                        <Area type="monotone" dataKey="forecast" stroke={selected.color} strokeWidth={2.5}
                            fill="url(#forecastGrad)" dot={false} activeDot={{ r: 5, fill: selected.color }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Model info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Model', value: 'Multi-Signal Fusion', icon: '🧠' },
                    { label: 'Signals Used', value: '4 (temporal + seasonal)', icon: '📡' },
                    { label: 'Confidence', value: '95% CI', icon: '📊' },
                    { label: 'Lead Time', value: '18–31 hours', icon: '⏱️' },
                ].map(i => (
                    <div key={i.label} className="glass-card p-4">
                        <p className="text-xl mb-1">{i.icon}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{i.label}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: '#2dd4bf' }}>{i.value}</p>
                    </div>
                ))}
            </div>
        </Layout>
    )
}

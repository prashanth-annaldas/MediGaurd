import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { AlertTriangle, Zap, RefreshCw, TrendingUp, Clock, Brain } from 'lucide-react'
import useStore from '../../store/useStore'
import Layout from '../layout/Layout'
import StatCard from '../ui/StatCard'
import Gauge from '../ui/Gauge'
import { generate7DayChart } from '../../utils/dataGenerators'
import PredictionCard from './PredictionCard'

const chartData = generate7DayChart()

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-card-static p-3 text-xs" style={{ minWidth: 160 }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="ticker font-semibold" style={{ color: 'var(--text-primary)' }}>{p.value}%</span>
                </div>
            ))}
        </div>
    )
}

const aiInsights = [
    '🚨 ICU capacity on track to breach 85% threshold in ~18 hours — activate expansion protocol now.',
    '💉 Blood bank O-negative trending down 1.2%/day — emergency donation appeal recommended within 12h.',
    '👩‍⚕️ Weekend staffing gap detected — workload peaks predicted Saturday 14:00–22:00.',
    '✅ Oxygen and ventilator supplies stable — no action required this cycle.',
]

export default function Dashboard() {
    const { resources, alerts, simulateAlert, refreshData, trends, fetchTrends, selectedHospital, user } = useStore()
    const criticalCount = resources.filter(r => r.status === 'critical').length
    const warningCount = resources.filter(r => r.status === 'warning').length
    const navigate = useNavigate()

    useEffect(() => {
        const hospitalId = selectedHospital ? selectedHospital.id : null;
        refreshData(hospitalId)
        fetchTrends(hospitalId)
    }, [selectedHospital])

    const displayChartData = trends && trends.length > 0 ? trends : chartData
    const xKey = trends && trends.length > 0 ? "month" : "day"

    // Determine title
    let title = "Dashboard"
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF' && selectedHospital) {
        title = `${selectedHospital.name} Analysis`
    }

    return (
        <Layout title={title}>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Critical Resources', value: criticalCount, color: '#ef4444', icon: '🔴' },
                    { label: 'Warnings', value: warningCount, color: '#f59e0b', icon: '🟡' },
                    {
                        label: 'Avg Utilization',
                        value: resources.length
                            ? Math.round(resources.reduce((s, r) => s + r.utilization, 0) / resources.length) + '%'
                            : '--',
                        color: '#2dd4bf', icon: '📊',
                    },
                    {
                        label: 'Earliest Breach',
                        value: (() => {
                            const htbs = resources.filter(r => r.hours_to_breach).map(r => r.hours_to_breach)
                            return htbs.length ? `${Math.min(...htbs)}h` : 'None'
                        })(),
                        color: '#8b5cf6', icon: '⏱️',
                    },
                ].map(k => (
                    <div key={k.label} className="glass-card p-4 flex items-center gap-3">
                        <span className="text-2xl">{k.icon}</span>
                        <div>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{k.label}</p>
                            <p className="text-2xl font-bold ticker" style={{ color: k.color }}>{k.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resource gauges */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                {resources.map(r => (
                    <div key={r.id} className="glass-card p-3 flex flex-col items-center gap-2"
                        style={{
                            borderColor: r.status === 'critical' ? 'rgba(239,68,68,0.3)'
                                : r.status === 'warning' ? 'rgba(245,158,11,0.25)' : undefined,
                            boxShadow: r.status === 'critical' ? '0 0 16px rgba(239,68,68,0.15)' : undefined,
                        }}>
                        <Gauge
                            value={r.utilization}
                            size={100}
                            inverted={r.inverted}
                            critThreshold={r.criticalThreshold}
                            warnThreshold={r.warningThreshold}
                        />
                        <p className="text-xs font-semibold text-center" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                        {r.hours_to_breach && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                                style={{
                                    background: r.status === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                    border: `1px solid ${r.status === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
                                }}>
                                <Clock size={9} style={{ color: r.status === 'critical' ? '#ef4444' : '#f59e0b' }} />
                                <span className="text-xs font-bold ticker" style={{ color: r.status === 'critical' ? '#ef4444' : '#f59e0b' }}>
                                    {r.hours_to_breach}h
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Chart + AI insight + ML */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
                {/* 7-day chart */}
                <div className="glass-card-static p-5 xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Seasonal Resource Trends</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aggregated utilization patterns — {xKey === 'month' ? '12-Month View' : '7-Day View'}</p>
                        </div>
                        <TrendingUp size={16} style={{ color: '#2dd4bf' }} />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={displayChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                {[
                                    { id: 'icu', color: '#3b82f6' },
                                    { id: 'oxygen', color: '#06b6d4' },
                                    { id: 'ventilators', color: '#8b5cf6' },
                                ].map(g => (
                                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={g.color} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xKey} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[30, 100]} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="icu_beds" name="ICU Beds" stroke="#3b82f6" fill="url(#icu)" strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="oxygen_supply" name="Oxygen" stroke="#06b6d4" fill="url(#oxygen)" strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="ventilators" name="Ventilators" stroke="#8b5cf6" fill="url(#ventilators)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* AI insight panel */}
                <div className="glass-card-static p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#14b8a6,#0891b2)', boxShadow: '0 0 12px rgba(20,184,166,0.4)' }}>
                            <Brain size={16} color="white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Insights</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gemini-powered analysis</p>
                        </div>
                    </div>
                    <div className="space-y-3 flex-1">
                        {aiInsights.map((ins, i) => (
                            <div key={i} className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(45,212,191,0.08)' }}>
                                {ins}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/gemini')} className="btn-primary mt-4 w-full justify-center text-xs">
                        <Brain size={13} /> Ask AI a Question
                    </button>
                </div>

                {/* ML Prediction Panel */}
                <div className="xl:col-span-1 flex">
                    <PredictionCard />
                </div>
            </div>

            {/* Stat cards + simulate */}
            <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Resource Detail</p>
                <button onClick={simulateAlert} className="btn-danger text-xs">
                    <Zap size={13} /> Simulate Alert
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {resources.map(r => (
                    <StatCard key={r.id} resource={r} onClick={() => navigate('/resources')} />
                ))}
            </div>
        </Layout>
    )
}

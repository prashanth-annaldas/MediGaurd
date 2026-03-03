import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    AreaChart, Area, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Building2, BedDouble, Activity, Wind, AlertTriangle, ChevronRight } from 'lucide-react';
import useStore from '../../store/useStore';
import Layout from '../layout/Layout';

const COLORS = {
    bed: '#14b8a6',
    icu: '#f59e0b',
    vent: '#8b5cf6',
    pred: '#64748b',
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '10px 14px', fontSize: 12
        }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
                    <strong>{p.name}</strong>: {p.value}%
                </p>
            ))}
        </div>
    );
};

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4" style={{ border: '1px solid var(--border-color)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
            </div>
        </div>
    );
}

export default function HospitalDashboard() {
    const user = useStore(state => state.user);
    const hospitalName = user?.hospital_name;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!hospitalName) {
            setError('No hospital assigned to this admin account.');
            setLoading(false);
            return;
        }
        fetch(`/api/hospital-history/${encodeURIComponent(hospitalName)}`)
            .then(r => {
                if (!r.ok) throw new Error('No history data found for your hospital yet. Please seed the 5-year dataset.');
                return r.json();
            })
            .then(d => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [hospitalName]);

    // Merge history + prediction for the combined chart
    const combinedData = data ? [
        ...data.history.slice(-24).map(h => ({
            label: h.label,
            bed: h.avg_bed_occupancy,
            icu: h.avg_icu_occupancy,
            vent: h.avg_ventilator_util,
        })),
        ...data.predictions.map(p => ({
            label: p.label + ' ▶',
            bed_pred: p.pred_bed_occupancy,
            icu_pred: p.pred_icu_occupancy,
            vent_pred: p.pred_ventilator_util,
        })),
    ] : [];

    const lastHistory = data?.history?.[data.history.length - 1];
    const totalShortages = data?.history?.reduce((s, h) => s + h.shortage_days, 0) ?? 0;
    const avgAdmissions = data?.history
        ? Math.round(data.history.reduce((s, h) => s + h.avg_daily_admissions, 0) / data.history.length)
        : 0;

    return (
        <Layout title={`${hospitalName || 'Hospital'} Dashboard`}>
            <div className="p-6 space-y-6" style={{ color: 'var(--text-primary)' }}>
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#14b8a6,#0891b2)' }}>
                        <Building2 size={18} color="white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gradient">{hospitalName || 'Hospital Dashboard'}</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {data?.city || ''} — 5-Year Resource Intelligence
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="glass-card p-8 rounded-2xl flex items-center justify-center">
                        <p style={{ color: 'var(--text-muted)' }}>Loading hospital data…</p>
                    </div>
                )}

                {error && (
                    <div className="glass-card p-6 rounded-2xl flex items-center gap-3"
                        style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)' }}>
                        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                        <p style={{ color: '#ef4444' }}>{error}</p>
                    </div>
                )}

                {data && (
                    <>
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={BedDouble} label="Current Bed Occupancy" value={`${lastHistory?.avg_bed_occupancy ?? '–'}%`} color={COLORS.bed} sub="Live" />
                            <StatCard icon={Activity} label="Current ICU Occupancy" value={`${lastHistory?.avg_icu_occupancy ?? '–'}%`} color={COLORS.icu} sub="Live" />
                            <StatCard icon={Wind} label="Current Ventilator Util" value={`${lastHistory?.avg_ventilator_util ?? '–'}%`} color={COLORS.vent} sub="Live" />
                            <StatCard icon={AlertTriangle} label="Shortage Days (5yr)" value={totalShortages} color="#ef4444" sub={`avg ${avgAdmissions} admissions/day`} />
                        </div>

                        {/* Historical + Prediction Chart */}
                        <div className="glass-card p-5 rounded-2xl" style={{ border: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} style={{ color: COLORS.bed }} />
                                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Resource Occupancy — Last 24 Months + 6-Month Forecast
                                </h2>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={combinedData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={3} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    {/* Historical */}
                                    <Line dataKey="bed" name="Bed Occ %" stroke={COLORS.bed} dot={false} strokeWidth={2} />
                                    <Line dataKey="icu" name="ICU Occ %" stroke={COLORS.icu} dot={false} strokeWidth={2} />
                                    <Line dataKey="vent" name="Ventilator Util %" stroke={COLORS.vent} dot={false} strokeWidth={2} />
                                    {/* Predictions (dashed) */}
                                    <Line dataKey="bed_pred" name="Bed (forecast)" stroke={COLORS.bed} dot={false} strokeWidth={2} strokeDasharray="5 4" />
                                    <Line dataKey="icu_pred" name="ICU (forecast)" stroke={COLORS.icu} dot={false} strokeWidth={2} strokeDasharray="5 4" />
                                    <Line dataKey="vent_pred" name="Vent (forecast)" stroke={COLORS.vent} dot={false} strokeWidth={2} strokeDasharray="5 4" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Prediction Table */}
                        <div className="glass-card p-5 rounded-2xl" style={{ border: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <ChevronRight size={16} style={{ color: COLORS.icu }} />
                                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    6-Month Forward Predictions
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            {['Month', 'Bed Occ %', 'ICU Occ %', 'Vent Util %'].map(h => (
                                                <th key={h} className="text-left pb-2 pr-6 text-xs font-semibold"
                                                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.predictions.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td className="py-2 pr-6 font-medium" style={{ color: 'var(--text-primary)' }}>{p.label}</td>
                                                <td className="py-2 pr-6" style={{ color: COLORS.bed }}>{p.pred_bed_occupancy}%</td>
                                                <td className="py-2 pr-6" style={{ color: COLORS.icu }}>{p.pred_icu_occupancy}%</td>
                                                <td className="py-2 pr-6" style={{ color: COLORS.vent }}>{p.pred_ventilator_util}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Monthly shortage area chart */}
                        <div className="glass-card p-5 rounded-2xl" style={{ border: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    Monthly Shortage Days (5-Year History)
                                </h2>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={data.history} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="shortageGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={5} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                                    <Area type="monotone" dataKey="shortage_days" name="Shortage Days"
                                        stroke="#ef4444" fill="url(#shortageGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}

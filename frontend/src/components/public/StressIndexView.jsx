import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ShieldCheck, HeartPulse, RefreshCw } from 'lucide-react';

export default function StressIndexView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStressIndex = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/stress-index');
            if (!res.ok) throw new Error('Failed to fetch data');
            const result = await res.json();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStressIndex();
        const interval = setInterval(fetchStressIndex, 10000); // refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'critical':
                return { color: 'text-alert-critical', bg: 'bg-alert-critical/10', border: 'border-alert-critical/20', icon: AlertTriangle, shadow: 'shadow-[0_0_50px_rgba(239,68,68,0.2)]' };
            case 'warning':
                return { color: 'text-alert-warning', bg: 'bg-alert-warning/10', border: 'border-alert-warning/20', icon: Activity, shadow: 'shadow-[0_0_50px_rgba(245,158,11,0.2)]' };
            default:
                return { color: 'text-alert-success', bg: 'bg-alert-success/10', border: 'border-alert-success/20', icon: ShieldCheck, shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.2)]' };
        }
    };

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center">
                <HeartPulse className="w-12 h-12 text-teal-500 animate-pulse mb-4" />
                <p className="text-[var(--text-muted)] text-sm">Loading Hospital Status...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-alert-critical mb-4" />
                <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Service Unavailable</h1>
                <p className="text-[var(--text-muted)] max-w-md">{error}</p>
                <button onClick={fetchStressIndex} className="mt-6 px-4 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg hover:bg-navy-700 transition-colors flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry Connection
                </button>
            </div>
        );
    }

    const { status, stress_index, components, last_updated } = data;
    const config = getStatusConfig(status);
    const StatusIcon = config.icon;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Backgrounds based on status */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 pointer-events-none transition-colors duration-1000 ${status === 'critical' ? 'bg-alert-critical' : status === 'warning' ? 'bg-alert-warning' : 'bg-alert-success'
                }`} />

            <div className={`bg-[var(--bg-secondary)]/40 backdrop-blur-2xl border ${config.border} p-8 md:p-12 rounded-3xl w-full max-w-2xl text-center relative z-10 ${config.shadow} transition-all duration-700`}>

                <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-2xl ${config.bg} ${config.color} animate-bounce-slow`}>
                        <StatusIcon className="w-12 h-12" />
                    </div>
                </div>

                <h2 className="text-[var(--text-muted)] font-medium tracking-widest uppercase mb-1">City General Hospital</h2>
                <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] mb-8 tracking-tight">System Stress Index</h1>

                <div className="flex items-center justify-center gap-6 mb-10">
                    <div className="text-center">
                        <div className={`text-7xl md:text-8xl font-black ${config.color} tracking-tighter drop-shadow-lg`}>
                            {stress_index}
                        </div>
                        <p className="text-[var(--text-muted)] mt-2 font-medium">overall strain score</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-navy-800/50 pt-8 mt-4">
                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-xl border border-navy-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ICU</p>
                        <p className={`text-xl font-bold ${components.icu_utilization > 85 ? 'text-alert-critical' : 'text-[var(--text-primary)]'}`}>{components.icu_utilization}%</p>
                    </div>
                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-xl border border-navy-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ventilators</p>
                        <p className={`text-xl font-bold ${components.ventilators_utilization > 80 ? 'text-alert-critical' : 'text-[var(--text-primary)]'}`}>{components.ventilators_utilization}%</p>
                    </div>
                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-xl border border-navy-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Gen Beds</p>
                        <p className={`text-xl font-bold ${components.beds_utilization > 90 ? 'text-alert-critical' : 'text-[var(--text-primary)]'}`}>{components.beds_utilization}%</p>
                    </div>
                </div>

                <div className="mt-8 text-xs text-gray-500 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-alert-success animate-pulse" />
                    Live Data Feed • Last Updated: {new Date(last_updated).toLocaleTimeString()}
                </div>
            </div>

            <p className="mt-12 text-gray-600 text-sm italic relative z-10 text-center max-w-lg">
                This public dashboard provides real-time visibility into hospital operating capacity to assist EMS and community planning.
            </p>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Activity, Beaker, BedDouble, Save, Loader2, CheckCircle } from 'lucide-react';
import useStore from '../../store/useStore';

export default function CapacityForm() {
    const { addToast, addAlert, refreshData, resources, token } = useStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [formData, setFormData] = useState({
        beds_capacity: '',
        beds_occupied: '',
        icu_capacity: '',
        icu_occupied: '',
        ventilators_capacity: '',
        ventilators_occupied: '',
    });

    useEffect(() => {
        if (!hasInitialized && resources && resources.length > 0) {
            const getRes = (id) => resources.find(r => r.id === id);
            const beds = getRes('beds');
            const icu = getRes('icu_beds');
            const vent = getRes('ventilators');

            if (beds && icu && vent) {
                setFormData({
                    beds_capacity: beds.capacity || '',
                    beds_occupied: beds.capacity ? Math.round((beds.utilization / 100) * beds.capacity) : '',
                    icu_capacity: icu.capacity || '',
                    icu_occupied: icu.capacity ? Math.round((icu.utilization / 100) * icu.capacity) : '',
                    ventilators_capacity: vent.capacity || '',
                    ventilators_occupied: vent.capacity ? Math.round((vent.utilization / 100) * vent.capacity) : '',
                });
                setHasInitialized(true);
            }
        }
    }, [resources, hasInitialized]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? '' : parseInt(value, 10) || 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/api/capacity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                throw new Error('Failed to update capacity');
            }

            setSuccess(true);
            addToast({
                type: 'success',
                title: 'Capacity Updated',
                message: 'Hospital resource capacity has been successfully updated.'
            });

            const bedsUtil = formData.beds_capacity > 0 ? (formData.beds_occupied / formData.beds_capacity) * 100 : 0;
            const icuUtil = formData.icu_capacity > 0 ? (formData.icu_occupied / formData.icu_capacity) * 100 : 0;
            const ventUtil = formData.ventilators_capacity > 0 ? (formData.ventilators_occupied / formData.ventilators_capacity) * 100 : 0;

            const utilizations = [
                { name: 'Beds', value: bedsUtil, occupied: formData.beds_occupied, capacity: formData.beds_capacity },
                { name: 'ICU', value: icuUtil, occupied: formData.icu_occupied, capacity: formData.icu_capacity },
                { name: 'Ventilators', value: ventUtil, occupied: formData.ventilators_occupied, capacity: formData.ventilators_capacity }
            ];
            const maxResource = utilizations.reduce((prev, current) => (prev.value > current.value) ? prev : current);
            const maxUtil = maxResource.value;

            let alertSeverity = 'safe'; // 'safe' is normal/green in UI
            if (maxUtil > 85) alertSeverity = 'critical';
            else if (maxUtil >= 50) alertSeverity = 'warning';

            addAlert({
                resource: 'Capacity Update',
                resource_id: 'capacity_input',
                severity: alertSeverity,
                message: `Hospital occupancy updated — Beds: ${formData.beds_occupied}/${formData.beds_capacity}, ICU: ${formData.icu_occupied}/${formData.icu_capacity}, Ventilators: ${formData.ventilators_occupied}/${formData.ventilators_capacity}. Highest utilization is ${maxResource.name} at ${maxResource.occupied}/${maxResource.capacity}.`,
                trend: 'stable',
                recommendations: ['Review resource allocation across active wards', 'Monitor updated utilization rate']
            });

            // Trigger a refresh to update the rest of the application's data
            await refreshData();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Resource Capacity Input</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Update the latest hospital bed and ventilator capacities for accurate intelligence tracking.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-[var(--bg-secondary)] border border-navy-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">

                    {/* General Beds */}
                    <div className="space-y-4 bg-[var(--bg-primary)]/50 p-5 rounded-xl border border-navy-800">
                        <div className="flex items-center gap-3 mb-4 text-teal-400">
                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                <BedDouble size={20} />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">General Beds</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-muted)]">Total Capacity</label>
                            <input
                                type="number"
                                name="beds_capacity"
                                value={formData.beds_capacity}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-[var(--bg-card)] border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-muted)]">Currently Occupied</label>
                            <input
                                type="number"
                                name="beds_occupied"
                                value={formData.beds_occupied}
                                onChange={handleChange}
                                min="0"
                                max={formData.beds_capacity}
                                className="w-full bg-[var(--bg-card)] border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-mono"
                                required
                            />
                        </div>
                    </div>

                    {/* ICU Beds */}
                    <div className="space-y-4 bg-[var(--bg-primary)]/50 p-5 rounded-xl border border-navy-800">
                        <div className="flex items-center gap-3 mb-4 text-alert-warning">
                            <div className="p-2 bg-alert-warning/10 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">ICU Beds</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-muted)]">Total Capacity</label>
                            <input
                                type="number"
                                name="icu_capacity"
                                value={formData.icu_capacity}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-[var(--bg-card)] border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-alert-warning/50 transition-all font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-muted)]">Currently Occupied</label>
                            <input
                                type="number"
                                name="icu_occupied"
                                value={formData.icu_occupied}
                                onChange={handleChange}
                                min="0"
                                max={formData.icu_capacity}
                                className="w-full bg-[var(--bg-card)] border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-alert-warning/50 transition-all font-mono"
                                required
                            />
                        </div>
                    </div>

                    {/* Ventilators */}
                    <div className="space-y-4 bg-[var(--bg-primary)]/50 p-5 rounded-xl border border-navy-800">
                        <div className="flex items-center gap-3 mb-4 text-alert-info">
                            <div className="p-2 bg-alert-info/10 rounded-lg">
                                <Beaker size={20} />
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)]">Ventilators</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-muted)]">Total Capacity</label>
                            <input
                                type="number"
                                name="ventilators_capacity"
                                value={formData.ventilators_capacity}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-[var(--bg-card)] border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-alert-info/50 transition-all font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-muted)]">Currently Occupied</label>
                            <input
                                type="number"
                                name="ventilators_occupied"
                                value={formData.ventilators_occupied}
                                onChange={handleChange}
                                min="0"
                                max={formData.ventilators_capacity}
                                className="w-full bg-[var(--bg-card)] border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-alert-info/50 transition-all font-mono"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-navy-800 flex items-center justify-end z-10 relative">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${success
                            ? 'bg-alert-success text-navy-950'
                            : 'bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-[0_0_15px_rgba(20,184,166,0.15)] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                            } disabled:opacity-50`}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : success ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {loading ? 'Saving...' : success ? 'Saved!' : 'Update Capacities'}
                    </button>
                </div>
            </form>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, XCircle, Building2, Search, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

// ── Hospital Picker (shown when doctor has no hospital assigned) ───────────────
function HospitalPicker({ token, onSaved }) {
    const [search, setSearch] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [selected, setSelected] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const setUser = useStore(s => s.setUser);
    const user = useStore(s => s.user);

    useEffect(() => {
        fetch('/api/hospitals')
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d) ? d : (d.hospitals || []);
                setHospitals(list.map(h => h.name));
            })
            .catch(() => { });
    }, []);

    const filtered = hospitals.filter(h => h.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/user/hospital', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ hospital_name: selected })
            });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.detail || 'Failed to save');
            }
            const data = await res.json();
            // Update stored user + token so the rest of the app reflects the hospital
            setUser({ ...user, hospital_name: data.hospital_name }, data.access_token);
            onSaved();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 p-8 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 mx-auto"
                style={{ background: 'rgba(45,212,191,0.12)' }}>
                <Building2 className="w-7 h-7" style={{ color: 'var(--teal-strong, #2dd4bf)' }} />
            </div>
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
                Select Your Hospital
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
                Your account doesn't have a hospital assigned yet. Search and select the hospital you work at.
            </p>

            {selected ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
                    style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--teal-strong, #2dd4bf)' }} />
                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selected}</span>
                    <button onClick={() => setSelected('')} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Change
                    </button>
                </div>
            ) : (
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search hospital name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                        style={{
                            background: 'var(--bg-card, var(--bg-primary))',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                        }}
                    />
                    {search && filtered.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-2xl overflow-y-auto z-50"
                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', maxHeight: 200 }}>
                            {filtered.map(h => (
                                <button key={h} type="button"
                                    onClick={() => { setSelected(h); setSearch(''); }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-500/10 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}>
                                    {h}
                                </button>
                            ))}
                        </div>
                    )}
                    {search && filtered.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-2xl overflow-y-auto z-50 px-4 py-3"
                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hospitals found</p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400 mb-3">{error}</p>
            )}

            <button
                onClick={handleSave}
                disabled={!selected || saving}
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                style={{
                    background: 'var(--teal-strong, #2dd4bf)',
                    color: '#0f172a',
                }}>
                {saving ? 'Saving…' : 'Confirm Hospital'}
            </button>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = useStore(state => state.token);
    const user = useStore(state => state.user);
    const selectedHospital = useStore(state => state.selectedHospital);
    const location = useLocation();

    // Read the ?doctor=name query param
    const urlParams = new URLSearchParams(location.search);
    const selectedDoctor = urlParams.get('doctor') || '';

    // Effective hospital name — prefer DB value, fallback to selected hospital
    const effectiveHospital = user?.hospital_name || selectedHospital?.name || '';

    useEffect(() => {
        if (effectiveHospital) fetchAppointments();
        else setLoading(false);
    }, [token, location.search, effectiveHospital]);

    const fetchAppointments = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const hospitalFallback = !user?.hospital_name && selectedHospital?.name
                ? `&hospital_name=${encodeURIComponent(selectedHospital.name)}`
                : '';
            const url = selectedDoctor
                ? `/api/appointments?doctor_name=${encodeURIComponent(selectedDoctor)}${hospitalFallback}`
                : `/api/appointments${hospitalFallback ? `?${hospitalFallback.slice(1)}` : ''}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch appointments');
            const data = await res.json();
            data.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
            setAppointments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime12h = (time24) => {
        if (!time24 || time24 === "null") return "TBD";
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    return (
        <Layout title="My Appointments">
            <div className="max-w-7xl mx-auto py-6 px-4">
                {/* If no hospital is set — show picker */}
                {!effectiveHospital ? (
                    <HospitalPicker token={token} onSaved={() => fetchAppointments()} />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                    {selectedDoctor ? `${selectedDoctor}'s Appointments` : 'My Appointments'}
                                </h1>
                                <p className="text-[var(--text-muted)] text-sm mt-1">
                                    {selectedDoctor
                                        ? `Viewing appointments for ${selectedDoctor} at ${effectiveHospital}.`
                                        : `Welcome, Dr. ${user?.displayName || user?.name}. Here are your upcoming patient bookings at ${effectiveHospital}.`
                                    }
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                {error}
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-gray-700">
                                <div className="bg-teal-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="text-teal-500 w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Appointments Found</h3>
                                <p className="text-[var(--text-muted)] max-w-sm mx-auto">
                                    There are currently no patient bookings assigned to you at {effectiveHospital}.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-navy-700 overflow-hidden">
                                <div className="p-0 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-navy-700">
                                        <thead className="bg-[#0f172a]/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Patient</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Date &amp; Time</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Specialization</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-navy-700">
                                            {appointments.map((appt) => (
                                                <tr key={appt.id} className="hover:bg-teal-500/5 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-teal-500/10 rounded-full flex items-center justify-center">
                                                                <User className="h-5 w-5 text-teal-500" />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-[var(--text-primary)]">{appt.patient_name || 'Anonymous User'}</div>
                                                                <div className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                                                    <Phone className="w-3 h-3" />
                                                                    {appt.patient_phone || 'No contact'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-primary)] font-medium">
                                                            <Calendar className="w-4 h-4 text-teal-500" />
                                                            {appt.date}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-0.5">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            {formatTime12h(appt.time)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                            {appt.specialization || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${appt.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                            appt.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                            }`}>
                                                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}

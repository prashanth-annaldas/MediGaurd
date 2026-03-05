import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, XCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = useStore(state => state.token);
    const user = useStore(state => state.user);
    const selectedHospital = useStore(state => state.selectedHospital);
    const location = useLocation();

    // Read the ?doctor=name query param (set by clicking a doctor in the sidebar)
    const urlParams = new URLSearchParams(location.search);
    const selectedDoctor = urlParams.get('doctor') || '';

    // Effective hospital — prefer the DB value, fall back to whatever was selected
    const effectiveHospital = user?.hospital_name || selectedHospital?.name || '';

    useEffect(() => {
        fetchAppointments();
    }, [token, location.search, effectiveHospital]);

    const fetchAppointments = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (selectedDoctor) params.set('doctor_name', selectedDoctor);
            if (!user?.hospital_name && selectedHospital?.name) {
                params.set('hospital_name', selectedHospital.name);
            }
            const query = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`/api/appointments${query}`, {
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
                            There are currently no patient bookings
                            {selectedDoctor ? ` for ${selectedDoctor}` : ' assigned to you'}
                            {effectiveHospital ? ` at ${effectiveHospital}` : ''}.
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
                                                            {appt.patient_phone || appt.patient_email || 'No contact'}
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
                                                    {appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, Activity, Stethoscope, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = useStore(state => state.token);
    const user = useStore(state => state.user);
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com';

    useEffect(() => {
        fetchAppointments();
    }, [token, user]);

    const fetchAppointments = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch appointments');
            const data = await res.json();

            // Backend already filters by doctor name + hospital — no client-side filter needed
            // Sort by date/time (most recent first
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
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Appointments</h1>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            Welcome, Dr. {user?.displayName || user?.name}. Here are your upcoming patient bookings at {user?.hospital_name}.
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
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto">There are currently no patient bookings assigned to you.</p>
                    </div>
                ) : (
                    <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-navy-700 overflow-hidden">
                        <div className="p-0 overflow-x-auto">
                            <table className="min-w-full divide-y divide-navy-700">
                                <thead className="bg-[#0f172a]/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Patient</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Date & Time</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Specialization</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Action</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => navigate(`/doctor/prescription/${appt.id}`)}
                                                    className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 transition-colors bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-500/20"
                                                >
                                                    <FileText size={14} />
                                                    Prescribe
                                                </button>
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

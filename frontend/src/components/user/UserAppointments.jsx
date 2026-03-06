import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, FileText, ExternalLink, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

const API_URL = '';

export default function UserAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, user } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const fetchAppointments = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch appointments');
            const data = await res.json();

            // Sort by date/time (most recent first)
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

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'finished': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'ongoing': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'follow_up': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <Layout title="My Appointments">
            <div className="max-w-7xl mx-auto py-6 px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Medical Appointments</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                        View your booking history and access digital prescriptions.
                    </p>
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
                    <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-navy-700">
                        <div className="bg-teal-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-teal-500 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Bookings Yet</h3>
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto">You haven't made any medical appointments yet.</p>
                        <button
                            onClick={() => navigate('/user/hospitals')}
                            className="mt-6 btn-primary px-6 py-2 rounded-xl"
                        >
                            Find a Hospital
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map((appt) => (
                            <div key={appt.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-teal-500/30 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center border border-navy-700 group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-colors">
                                        <Calendar className="text-teal-400 w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                            {appt.specialization} Consultation
                                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusStyle(appt.status)}`}>
                                                {appt.status?.replace('_', ' ')}
                                            </span>
                                        </h3>
                                        <div className="text-sm text-[var(--text-muted)] space-y-1 mt-1">
                                            <p className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-teal-500/60" />
                                                {appt.hospital_name}
                                            </p>
                                            <p className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                                                <User size={14} className="text-teal-500/60" />
                                                Dr. {appt.doctor_name || 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{appt.date}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{formatTime12h(appt.time)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {(appt.status === 'FINISHED' || appt.status === 'FOLLOW_UP' || appt.status === 'FOLLOW_UP_REQUIRED') && (
                                            <button
                                                onClick={() => navigate(`/user/prescription/${appt.id}`)}
                                                className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-2 font-bold shadow-[0_5px_15px_rgba(20,184,166,0.2)]"
                                            >
                                                <FileText size={14} />
                                                View Prescription
                                            </button>
                                        )}
                                        <div className="p-2 rounded-xl border border-navy-700 text-[var(--text-muted)] hover:text-teal-400 cursor-pointer transition-colors" title="View details">
                                            <ExternalLink size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, FileText, ExternalLink, MapPin, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

export default function DoctorAppointmentHistory() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const { token, user } = useStore();
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
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'FINISHED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'ONGOING': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'FOLLOW_UP': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'FOLLOW_UP_REQUIRED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const filteredAppointments = appointments.filter(appt => {
        const matchesSearch = appt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             appt.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || appt.status?.toUpperCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <Layout title="Appointment History">
            <div className="max-w-7xl mx-auto py-6 px-4">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-navy-700/50 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Patient Appointment History</h1>
                        <p className="text-[var(--text-muted)] text-sm mt-2 font-medium">
                            Comprehensive record of all patient consultations at {user?.hospital_name}.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search patient or specialization..." 
                            className="w-full bg-navy-900 border border-navy-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select 
                                className="w-full bg-navy-900 border border-navy-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 outline-none appearance-none transition-all"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="ONGOING">Ongoing</option>
                                <option value="FINISHED">Finished</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
                        <p className="text-teal-500 font-bold animate-pulse">Loading Records...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 text-red-500 p-6 rounded-2xl border border-red-500/20 flex items-center gap-3 backdrop-blur-md">
                        <XCircle className="w-6 h-6" />
                        <span className="font-medium">{error}</span>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-24 bg-[var(--bg-secondary)] rounded-3xl border border-dashed border-navy-700">
                        <div className="bg-teal-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                            <Calendar className="text-teal-500 w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">No Records Found</h3>
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto font-medium">No patient appointments match your current filters.</p>
                        {(searchTerm || statusFilter !== 'ALL') && (
                            <button 
                                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                                className="mt-6 text-teal-400 hover:text-teal-300 font-bold underline underline-offset-4"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredAppointments.map((appt) => (
                            <div key={appt.id} className="glass-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-teal-500/40 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] transition-all group relative overflow-hidden">
                                {/* Accent Gradient */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 bg-navy-800 rounded-2xl flex items-center justify-center border border-navy-700 group-hover:bg-teal-500/10 group-hover:border-teal-500/30 transition-all transform group-hover:rotate-6">
                                        <User className="text-teal-400 w-7 h-7" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] leading-none">
                                                {appt.patient_name || 'Anonymous User'}
                                            </h3>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${getStatusStyle(appt.status)}`}>
                                                {appt.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                                            <p className="flex items-center gap-1.5 text-purple-400 font-bold">
                                                <Activity size={14} className="opacity-70" />
                                                {appt.specialization || 'General'}
                                            </p>
                                            <p className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                                <Phone size={14} className="text-teal-500/60" />
                                                {appt.patient_phone || 'No contact info'}
                                            </p>
                                            <p className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                                <MapPin size={14} className="text-teal-500/60" />
                                                {appt.hospital_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-6 border-t lg:border-t-0 pt-5 lg:pt-0 mt-2 lg:mt-0">
                                    <div className="text-left lg:text-right bg-navy-900/50 p-3 rounded-xl border border-navy-700/50 group-hover:border-teal-500/20 transition-colors capitalize">
                                        <div className="flex items-center lg:justify-end gap-2 text-[var(--text-primary)] font-bold">
                                            <Calendar size={14} className="text-teal-500" />
                                            {appt.date}
                                        </div>
                                        <div className="flex items-center lg:justify-end gap-2 text-[var(--text-muted)] text-xs mt-1">
                                            <Clock size={14} />
                                            {formatTime12h(appt.time)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/doctor/prescription/${appt.id}`)}
                                            className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 font-black transition-all shadow-lg ${
                                                appt.status === 'FINISHED' 
                                                ? 'bg-navy-800 text-teal-400 border border-teal-500/30 hover:bg-navy-700' 
                                                : 'bg-teal-500 text-navy-950 hover:bg-teal-400 shadow-[0_5px_15px_rgba(20,184,166,0.3)]'
                                            }`}
                                        >
                                            <FileText size={14} />
                                            {appt.status === 'FINISHED' ? 'View Prescription' : 'Prescribe Now'}
                                        </button>
                                        <button className="p-2.5 rounded-xl border border-navy-700 text-[var(--text-muted)] hover:text-teal-400 hover:border-teal-500/30 transition-all bg-navy-900/40">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .glass-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(30, 41, 59, 0.7);
                    border-radius: 24px;
                }
                .text-gradient {
                    background: linear-gradient(135deg, #2dd4bf 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </Layout>
    );
}

const Activity = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

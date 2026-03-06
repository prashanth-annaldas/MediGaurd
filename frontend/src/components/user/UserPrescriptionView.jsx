import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Calendar, Clock, Activity, FileText, CheckCircle,
    ArrowLeft, Loader2, AlertCircle, Clipboard, Download, ExternalLink, Repeat
} from 'lucide-react';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

const API_URL = '';

export default function UserPrescriptionView() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { token } = useStore();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [appointment, setAppointment] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token && appointmentId) {
            fetchAllDetails();
        }
    }, [appointmentId, token]);

    const fetchAllDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Appointment Info
            const apptRes = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!apptRes.ok) throw new Error('Failed to fetch appointment details');
            const apptData = await apptRes.json();
            setAppointment(apptData);

            // 2. Fetch Prescription Info
            const rxRes = await fetch(`${API_URL}/api/prescriptions/appointment/${appointmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!rxRes.ok) throw new Error('Prescription details not found');
            const rxData = await rxRes.json();
            setData(rxData);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Prescription">
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Prescription">
                <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Error Loading Prescription</h2>
                    <p className="text-[var(--text-muted)] mt-2">{error}</p>
                    <button onClick={() => navigate('/user/appointments')} className="mt-6 btn-primary px-6 py-2 rounded-xl">
                        Back to Appointments
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Digital Prescription">
            <div className="max-w-5xl mx-auto py-8 px-4">
                <button
                    onClick={() => navigate('/user/appointments')}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-teal-400 transition-colors mb-6"
                >
                    <ArrowLeft size={18} /> Back to My Appointments
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Prescription Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Prescription Details Card */}
                        <div className="glass-card p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full border-l border-b border-teal-500/10 flex items-start justify-end p-4">
                                <Clipboard className="text-teal-500/20 w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <Clipboard className="text-teal-400" /> Prescription Details
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-500 mb-2">Clinical Notes & Observations</h4>
                                    <div className="bg-navy-900/40 border border-navy-700 rounded-2xl p-4 text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap italic">
                                        "{data.prescription.notes}"
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-500 mb-3">Prescribed Medicines</h4>
                                    <div className="space-y-3">
                                        {data.medicines.map((med, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-navy-900/40 border border-navy-700 flex justify-between items-center group hover:border-teal-500/30 transition-all">
                                                <div>
                                                    <h5 className="font-bold text-[var(--text-primary)] group-hover:text-teal-400 transition-colors">{med.name}</h5>
                                                    <p className="text-sm text-[var(--text-muted)]">{med.dose}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['morning', 'afternoon', 'night'].map(time => (
                                                        <div key={time} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${med[time]
                                                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                                                            : 'bg-navy-800 text-gray-600 border-navy-700'}`}>
                                                            {time.charAt(0)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reports Section */}
                        {data.reports.length > 0 && (
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <FileText className="text-teal-400" size={20} /> Associated Reports
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {data.reports.map((report, idx) => (
                                        <a
                                            key={idx}
                                            href={`http://localhost:8000/uploads/reports/${report.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-3 rounded-xl bg-navy-900/40 border border-navy-700 hover:border-teal-500/30 group transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                                                    <Download size={16} />
                                                </div>
                                                <span className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[120px]">
                                                    Report {idx + 1}
                                                </span>
                                            </div>
                                            <ExternalLink size={14} className="text-gray-600 group-hover:text-teal-400" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Verification Info</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                                    <User className="text-teal-400 w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">Dr. {appointment?.doctor_name}</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                        {appointment?.specialization} Specialist
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm py-2 border-b border-navy-700/50">
                                    <span className="text-[var(--text-muted)]">Hospital</span>
                                    <span className="text-[var(--text-primary)] font-medium text-right">{appointment?.hospital_name}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-navy-700/50">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Calendar size={14} /> Date
                                    </span>
                                    <span className="text-[var(--text-primary)] font-medium">{appointment?.date}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-navy-700/50">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Clock size={14} /> Time
                                    </span>
                                    <span className="text-[var(--text-primary)] font-medium">{appointment?.time}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-[var(--text-muted)]">Prescribed On</span>
                                    <span className="text-[var(--text-primary)] font-medium">
                                        {new Date(data.prescription.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {data.prescription.follow_up_days && (
                            <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                                        <Repeat size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-teal-400">Follow-Up Required</h4>
                                        <p className="text-sm text-teal-400/70 mt-1 leading-relaxed">
                                            The doctor requested a follow-up visit after <strong>{data.prescription.follow_up_days} days</strong>.
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                            </div>
                        )}

                        <button
                            onClick={() => window.print()}
                            className="w-full bg-navy-800 hover:bg-navy-700 border border-navy-700 text-[var(--text-primary)] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                            <Download size={18} /> Download/Print RX
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

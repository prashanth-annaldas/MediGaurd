import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, FileText, ExternalLink, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, FileText as FileIcon } from 'lucide-react';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

const API_URL = '';

export default function UserAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'reports'
    const [reports, setReports] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);
    const { token, user } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
        fetchReports();
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

    const fetchReports = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/user/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const res = await fetch(`${API_URL}/api/user/reports`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                fetchReports(); // Refresh the list
            } else {
                const errData = await res.json();
                alert(errData.detail || 'Failed to upload reports');
            }
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-navy-700/50 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Medical Records</h1>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            Manage your appointments, prescriptions, and medical reports.
                        </p>
                    </div>
                    <div className="flex bg-navy-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'appointments' ? 'bg-teal-500 text-navy-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Appointments
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-teal-500 text-navy-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            My Reports
                        </button>
                    </div>
                </div>

                {activeTab === 'reports' ? (
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Upload className="text-teal-400" size={20} /> Upload New Report
                            </h2>
                            <div
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${uploading ? 'border-navy-600 bg-navy-800/50 cursor-wait' : 'border-navy-700 hover:border-teal-500/50 hover:bg-teal-500/5 cursor-pointer group'}`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="application/pdf,image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-3"></div>
                                        <p className="text-teal-400 font-medium">Uploading files...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="text-teal-500" />
                                        </div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">Click to browse or drop files here</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Supported formats: PDF, JPG, PNG.</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <FileIcon className="text-teal-400" /> Document History
                            </h2>
                            {reports.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl bg-navy-900/50 border border-navy-700">
                                    <FileIcon className="w-12 h-12 text-navy-600 mx-auto mb-3" />
                                    <p className="text-[var(--text-muted)]">No medical reports uploaded yet.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {reports.map((report) => (
                                        <div key={report.id} className="flex items-center justify-between p-4 rounded-xl border border-navy-700 bg-[var(--bg-card)] hover:border-teal-500/30 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                                                    <FileIcon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px] md:max-w-md" title={report.filename}>
                                                        {report.filename}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1">
                                                        <span>{new Date(report.uploaded_at).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 rounded-full bg-navy-600"></span>
                                                        <span className={report.source === 'Doctor' ? 'text-blue-400' : 'text-teal-400'}>
                                                            Uploaded by {report.source}
                                                        </span>
                                                        {report.doctor_name && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-navy-600"></span>
                                                                <span>Dr. {report.doctor_name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <a
                                                href={`${API_URL}/api/files/${report.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded-lg bg-navy-800 text-teal-400 text-xs font-medium hover:bg-navy-700 transition-colors flex items-center gap-1.5"
                                            >
                                                <ExternalLink size={14} /> View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : loading ? (
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

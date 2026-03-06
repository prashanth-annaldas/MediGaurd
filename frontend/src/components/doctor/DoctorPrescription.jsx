import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Calendar, Clock, Activity, FileText, Plus, Trash2,
    Upload, CheckCircle, Save, ArrowLeft, Loader2, AlertCircle,
    Check, X, Repeat, Clipboard
} from 'lucide-react';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

const API_URL = ''; // Use relative paths to leverage Vite proxy

export default function DoctorPrescription() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useStore();

    // States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appointment, setAppointment] = useState(null);
    const [notes, setNotes] = useState('');
    const [medicines, setMedicines] = useState([
        { id: Date.now(), name: '', dose: '', morning: false, afternoon: false, night: false }
    ]);
    const [reports, setReports] = useState([]);
    const [followUpDays, setFollowUpDays] = useState('');
    const [status, setStatus] = useState('PENDING'); // PENDING, ONGOING, FINISHED
    const [message, setMessage] = useState({ type: '', text: '' });

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchAppointmentDetails();
    }, [appointmentId, token]);

    const fetchAppointmentDetails = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch appointment details');
            const data = await res.json();
            setAppointment(data);
            setStatus(data.status);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        console.log(`Updating status to: ${newStatus} for appt: ${appointmentId}`);
        try {
            const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/status?status=${newStatus}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Status update response:', res.status);
            if (res.ok) {
                setStatus(newStatus);
                setMessage({ type: 'success', text: `Consultation marked as ${newStatus}` });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update status' });
        }
    };

    const addMedicine = () => {
        setMedicines([...medicines, { id: Date.now(), name: '', dose: '', morning: false, afternoon: false, night: false }]);
    };

    const removeMedicine = (id) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter(m => m.id !== id));
        }
    };

    const updateMedicine = (id, field, value) => {
        setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            setMessage({ type: 'error', text: 'Only PDF and Images are allowed' });
        }
        setReports([...reports, ...validFiles]);
    };

    const removeReport = (index) => {
        setReports(reports.filter((_, i) => i !== index));
    };

    const handleSavePrescription = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('appointment_id', appointmentId);
            formData.append('notes', notes);
            if (followUpDays) formData.append('follow_up_days', parseInt(followUpDays));
            formData.append('medicines', JSON.stringify(medicines));

            reports.forEach(file => {
                formData.append('reports', file);
            });

            const res = await fetch(`${API_URL}/api/prescriptions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Failed to save prescription');

            // Handle follow-up if specified
            if (followUpDays) {
                await fetch(`${API_URL}/api/appointments/${appointmentId}/follow-up?days=${followUpDays}&notes=${notes}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            setMessage({ type: 'success', text: 'Prescription saved successfully!' });
            // Close consultation automatically
            handleUpdateStatus('FINISHED');

            setTimeout(() => navigate('/doctor/appointments'), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Doctor Portal">
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Create Prescription">
            <div className="max-w-5xl mx-auto py-8 px-4">
                <button
                    onClick={() => navigate('/doctor/appointments')}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-teal-400 transition-colors mb-6"
                >
                    <ArrowLeft size={18} /> Back to Appointments
                </button>

                {message.text && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Consultation Status Card */}
                        <div className="glass-card p-6 flex justify-between items-center bg-gradient-to-r from-navy-900/50 to-navy-800/50">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">Consultation</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${status === 'ONGOING' ? 'bg-orange-500 animate-pulse' :
                                        status === 'FINISHED' ? 'bg-green-500' : 'bg-gray-500'
                                        }`} />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                        {status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {status !== 'ONGOING' && status !== 'FINISHED' && (
                                    <button
                                        onClick={() => handleUpdateStatus('ONGOING')}
                                        className="btn-primary flex items-center gap-2 px-4 py-2"
                                    >
                                        <Activity size={16} /> Start
                                    </button>
                                )}
                                {status === 'ONGOING' && (
                                    <button
                                        onClick={() => handleUpdateStatus('FINISHED')}
                                        className="bg-green-500 hover:bg-green-400 text-navy-950 px-4 py-2 rounded-xl font-bold transition-all transition-colors flex items-center gap-2"
                                    >
                                        <Check size={16} /> Finish
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Prescription Section */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <Clipboard className="text-teal-400" /> Prescription Details
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Clinical Notes / Symptoms</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-[var(--bg-card)]/50 border border-navy-700 rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-teal-500/50 min-h-[120px]"
                                        placeholder="Enter patient diagnosis, symptoms, or observation..."
                                    />
                                </div>

                                <div className="pt-4 border-t border-navy-700/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">Medicines</label>
                                        <button
                                            onClick={addMedicine}
                                            className="text-teal-400 hover:text-teal-300 text-sm flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={16} /> Add Medicine
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {medicines.map((med, index) => (
                                            <div key={med.id} className="p-4 rounded-xl bg-navy-900/40 border border-navy-700 space-y-4">
                                                <div className="flex gap-4 items-start">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Medicine Name (e.g. Paracetamol)"
                                                            value={med.name}
                                                            onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                                                            className="w-full bg-transparent border-b border-navy-700 focus:border-teal-500 outline-none text-sm py-1"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <input
                                                            type="text"
                                                            placeholder="Dose (e.g. 500mg)"
                                                            value={med.dose}
                                                            onChange={(e) => updateMedicine(med.id, 'dose', e.target.value)}
                                                            className="w-full bg-transparent border-b border-navy-700 focus:border-teal-500 outline-none text-sm py-1 text-right"
                                                        />
                                                    </div>
                                                    {medicines.length > 1 && (
                                                        <button
                                                            onClick={() => removeMedicine(med.id)}
                                                            className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center px-2">
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">Dosage Schedule:</span>
                                                    <div className="flex gap-6">
                                                        {['morning', 'afternoon', 'night'].map(time => (
                                                            <label key={time} className="flex items-center gap-2 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={med[time]}
                                                                    onChange={(e) => updateMedicine(med.id, time, e.target.checked)}
                                                                    className="hidden"
                                                                />
                                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${med[time]
                                                                    ? 'bg-teal-500 border-teal-500 text-navy-950 scale-110 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                                                                    : 'bg-navy-800 border-navy-600 text-transparent group-hover:border-teal-500/50'
                                                                    }`}>
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                                <span className={`text-xs capitalize font-medium ${med[time] ? 'text-teal-400' : 'text-[var(--text-muted)]'}`}>
                                                                    {time}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reports Section */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Upload className="text-teal-400" size={20} /> Upload Reports
                            </h2>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-navy-700 rounded-2xl p-8 text-center hover:border-teal-500/50 hover:bg-teal-500/5 transition-all cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="application/pdf,image/*"
                                    onChange={handleFileChange}
                                />
                                <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="text-teal-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">Click or drag files to upload</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">PDF or Imaging reports (Max 10MB per file)</p>
                            </div>

                            {reports.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {reports.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-lg px-3 py-1.5 text-xs text-teal-400">
                                            <FileText size={14} />
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                            <button onClick={(e) => { e.stopPropagation(); removeReport(i); }} className="hover:text-red-400">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Summary & Actions */}
                    <div className="space-y-6">
                        {/* Patient Summary Card */}
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Patient Profile</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                                    <User className="text-teal-400 w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">{appointment?.patient_name}</h4>
                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                        #{appointmentId} • {appointment?.specialization}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm py-2 border-b border-navy-700/50">
                                    <span className="text-[var(--text-muted)]">Age</span>
                                    <span className="text-[var(--text-primary)] font-medium">{appointment?.patient_age || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-navy-700/50">
                                    <span className="text-[var(--text-muted)]">Gender</span>
                                    <span className="text-[var(--text-primary)] font-medium capitalize">{appointment?.patient_gender || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-navy-700/50">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Calendar size={14} /> Date
                                    </span>
                                    <span className="text-[var(--text-primary)] font-medium">{appointment?.date}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Clock size={14} /> Time
                                    </span>
                                    <span className="text-[var(--text-primary)] font-medium">{appointment?.time}</span>
                                </div>
                            </div>
                        </div>

                        {/* Follow Up Card */}
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                                <Repeat size={16} /> Follow-Up
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Come back after (days)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 7"
                                        value={followUpDays}
                                        onChange={(e) => setFollowUpDays(e.target.value)}
                                        className="w-full bg-[var(--bg-card)] border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-teal-500/50"
                                    />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                                        System will automatically schedule a follow-up appointment if days are specified.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Save Action */}
                        <button
                            onClick={handleSavePrescription}
                            disabled={saving || !notes || medicines[0].name === ''}
                            className="w-full btn-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(20,184,166,0.3)] hover:shadow-[0_15px_40px_rgba(20,184,166,0.4)] disabled:opacity-50 disabled:shadow-none transition-all group"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                                    Save Prescription
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

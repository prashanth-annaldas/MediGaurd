import React, { useState, useRef } from 'react';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';
import { ClipboardList, CheckCircle, AlertCircle, Loader2, User, Phone, Heart, AlertTriangle, Upload, FileText, X } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const API_URL = import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com';

const initialForm = {
    age: '',
    gender: '',
    height: '',
    weight: '',
    phone: '',
    email: '',
    address: '',
    blood_group: '',
    emergency_contact: '',
};

function validate(form) {
    const errors = {};
    if (!form.age || isNaN(form.age) || Number(form.age) <= 0 || Number(form.age) > 150)
        errors.age = 'Please enter a valid age (1–150)';
    if (!form.gender) errors.gender = 'Gender is required';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone.trim()))
        errors.phone = 'Enter a valid phone number';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        errors.email = 'Enter a valid email address';
    if (!form.address.trim()) errors.address = 'Address is required';
    if (!form.blood_group) errors.blood_group = 'Blood group is required';
    if (!form.emergency_contact.trim()) errors.emergency_contact = 'Emergency contact is required';
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.emergency_contact.trim()))
        errors.emergency_contact = 'Enter a valid phone number';
    return errors;
}

function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
            <AlertTriangle size={11} />
            {msg}
        </p>
    );
}

export default function PatientRegistration() {
    const user = useStore(state => state.user);
    const patientName = user?.displayName || user?.name || 'Unknown User';

    const [form, setForm] = useState(initialForm);
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfError, setPdfError] = useState('');
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [apiMessage, setApiMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setPdfError('Only PDF files are allowed.');
            setPdfFile(null);
            e.target.value = '';
            return;
        }
        setPdfError('');
        setPdfFile(file);
    };

    const handleFileClear = () => {
        setPdfFile(null);
        setPdfError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setStatus('loading');
        setApiMessage('');

        try {
            // Use FormData (multipart) so the PDF file can be sent alongside text fields
            const formData = new FormData();
            formData.append('full_name', patientName);
            formData.append('age', parseInt(form.age, 10));
            formData.append('gender', form.gender);
            if (form.height) formData.append('height', parseFloat(form.height));
            if (form.weight) formData.append('weight', parseFloat(form.weight));
            formData.append('phone', form.phone);
            formData.append('email', form.email);
            formData.append('address', form.address);
            formData.append('blood_group', form.blood_group);
            formData.append('emergency_contact', form.emergency_contact);
            if (pdfFile) formData.append('medical_history_file', pdfFile);

            const res = await fetch(`${API_URL}/api/patients`, {
                method: 'POST',
                body: formData,
                // Do NOT set Content-Type — browser sets multipart boundary automatically
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setApiMessage(data.message || 'Patient information saved successfully');
                setForm(initialForm);
                setPdfFile(null);
                setPdfError('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                setErrors({});
            } else {
                setStatus('error');
                setApiMessage(data.detail || 'Failed to save patient information. Please try again.');
            }
        } catch {
            setStatus('error');
            setApiMessage('Network error. Please check your connection and try again.');
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setApiMessage('');
        setForm(initialForm);
        setPdfFile(null);
        setPdfError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setErrors({});
    };

    const inputClass = (field) => `
        w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none
        ${errors[field]
            ? 'border border-red-500/60 bg-red-500/5'
            : 'border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20'
        }
        text-[var(--text-primary)] placeholder-[var(--text-muted)]
    `.trim();

    return (
        <Layout title="Patient Registration">
            <div className="max-w-3xl mx-auto py-6">
                {/* Header */}
                <div className="glass-card p-6 mb-6 flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ background: 'rgba(45,212,191,0.12)', color: '#2dd4bf' }}>
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Registering Patient</p>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{patientName}</h1>
                        <p className="text-sm text-[var(--text-muted)] mt-0.5">
                            Fill in the details below. All fields are required except Height, Weight &amp; Medical History.
                        </p>
                    </div>
                </div>

                {/* Success Banner */}
                {status === 'success' && (
                    <div className="glass-card p-5 mb-6 flex items-start gap-4 border border-teal-500/30 bg-teal-500/5">
                        <CheckCircle size={24} className="text-teal-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-teal-400">{apiMessage}</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">The patient record has been saved to the database.</p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="btn-primary text-sm px-4 py-2 flex-shrink-0"
                        >
                            Register Another
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {status === 'error' && (
                    <div className="glass-card p-5 mb-6 flex items-start gap-3 border border-red-500/30 bg-red-500/5">
                        <AlertCircle size={22} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{apiMessage}</p>
                    </div>
                )}

                {/* Form */}
                {status !== 'success' && (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="glass-card p-6 space-y-6">

                            {/* Section: Personal Info */}
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                                    <User size={14} /> Personal Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Age */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Age <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pr-age"
                                            type="number"
                                            name="age"
                                            value={form.age}
                                            onChange={handleChange}
                                            placeholder="e.g. 34"
                                            min="1"
                                            max="150"
                                            className={inputClass('age')}
                                        />
                                        <FieldError msg={errors.age} />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Gender <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            id="pr-gender"
                                            name="gender"
                                            value={form.gender}
                                            onChange={handleChange}
                                            className={inputClass('gender')}
                                        >
                                            <option value="">Select gender</option>
                                            {GENDERS.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        <FieldError msg={errors.gender} />
                                    </div>

                                    {/* Height */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Height <span className="text-[var(--text-muted)] font-normal">(cm, optional)</span>
                                        </label>
                                        <input
                                            id="pr-height"
                                            type="number"
                                            name="height"
                                            value={form.height}
                                            onChange={handleChange}
                                            placeholder="e.g. 170"
                                            min="1"
                                            max="300"
                                            step="0.1"
                                            className={inputClass('height')}
                                        />
                                        <FieldError msg={errors.height} />
                                    </div>

                                    {/* Weight */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Weight <span className="text-[var(--text-muted)] font-normal">(kg, optional)</span>
                                        </label>
                                        <input
                                            id="pr-weight"
                                            type="number"
                                            name="weight"
                                            value={form.weight}
                                            onChange={handleChange}
                                            placeholder="e.g. 65.5"
                                            min="1"
                                            max="500"
                                            step="0.1"
                                            className={inputClass('weight')}
                                        />
                                        <FieldError msg={errors.weight} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[var(--border-color)]" />

                            {/* Section: Contact Info */}
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                                    <Phone size={14} /> Contact Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Phone Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pr-phone"
                                            type="tel"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="e.g. +91 98765 43210"
                                            className={inputClass('phone')}
                                        />
                                        <FieldError msg={errors.phone} />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pr-email"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="e.g. priya@email.com"
                                            className={inputClass('email')}
                                        />
                                        <FieldError msg={errors.email} />
                                    </div>

                                    {/* Address */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Address <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pr-address"
                                            type="text"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="e.g. 12 MG Road, Bengaluru, Karnataka 560001"
                                            className={inputClass('address')}
                                        />
                                        <FieldError msg={errors.address} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[var(--border-color)]" />

                            {/* Section: Medical Info */}
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
                                    <Heart size={14} /> Medical Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Blood Group */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Blood Group <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            id="pr-blood-group"
                                            name="blood_group"
                                            value={form.blood_group}
                                            onChange={handleChange}
                                            className={inputClass('blood_group')}
                                        >
                                            <option value="">Select blood group</option>
                                            {BLOOD_GROUPS.map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                        <FieldError msg={errors.blood_group} />
                                    </div>

                                    {/* Emergency Contact */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Emergency Contact Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="pr-emergency-contact"
                                            type="tel"
                                            name="emergency_contact"
                                            value={form.emergency_contact}
                                            onChange={handleChange}
                                            placeholder="e.g. +91 91234 56789"
                                            className={inputClass('emergency_contact')}
                                        />
                                        <FieldError msg={errors.emergency_contact} />
                                    </div>

                                    {/* Medical History — PDF Upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Medical History{' '}
                                            <span className="text-[var(--text-muted)] font-normal">(optional — PDF only)</span>
                                        </label>

                                        {/* Hidden native input */}
                                        <input
                                            ref={fileInputRef}
                                            id="pr-medical-history-file"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        {!pdfFile ? (
                                            /* Upload trigger area */
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-7 rounded-xl border-2 border-dashed transition-colors"
                                                style={{
                                                    borderColor: pdfError ? '#f87171' : 'var(--border-color)',
                                                    background: pdfError ? 'rgba(248,113,113,0.04)' : 'var(--bg-secondary)',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2dd4bf'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = pdfError ? '#f87171' : 'var(--border-color)'; }}
                                            >
                                                <Upload size={24} style={{ color: '#2dd4bf' }} />
                                                <span className="text-sm font-medium text-[var(--text-secondary)]">Click to upload PDF</span>
                                                <span className="text-xs text-[var(--text-muted)]">Medical history, discharge summaries, prescriptions…</span>
                                            </button>
                                        ) : (
                                            /* File selected — preview pill */
                                            <div
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                                                style={{ borderColor: 'rgba(45,212,191,0.35)', background: 'rgba(45,212,191,0.06)' }}
                                            >
                                                <FileText size={20} style={{ color: '#2dd4bf', flexShrink: 0 }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{pdfFile.name}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{(pdfFile.size / 1024).toFixed(1)} KB · PDF</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleFileClear}
                                                    title="Remove file"
                                                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-red-500/10 transition-colors"
                                                    style={{ color: '#f87171' }}
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        )}

                                        {pdfError && (
                                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
                                                <AlertTriangle size={11} />
                                                {pdfError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[var(--border-color)]" />

                            {/* Submit */}
                            <div className="flex items-center justify-between pt-1">
                                <p className="text-xs text-[var(--text-muted)]">
                                    <span className="text-red-400">*</span> Required fields
                                </p>
                                <button
                                    id="pr-submit"
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardList size={16} />
                                            Register Patient
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}

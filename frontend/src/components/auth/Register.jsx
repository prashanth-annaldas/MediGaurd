import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getFirebaseAuth,
    createUserWithEmailAndPassword
} from '../../services/firebase';
import { Mail, Lock, User, AlertCircle, Loader2, Building2 } from 'lucide-react';
import useStore from '../../store/useStore';
import NetworkBackground from '../public/NetworkBackground';

export default function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [hospitalName, setHospitalName] = useState('');
    const [hospitalList, setHospitalList] = useState([]);
    const [hospitalSearch, setHospitalSearch] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const setUser = useStore(state => state.setUser);
    const auth = getFirebaseAuth();

    // Fetch hospital list for admin picker
    useEffect(() => {
        fetch('/api/hospitals')
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d) ? d : (d.hospitals || []);
                setHospitalList(list.map(h => h.name));
            })
            .catch(() => { });
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    password,
                    role: role,
                    hospital_name: (role === 'ADMIN' || role === 'STAFF' || role === 'DOCTOR') ? hospitalName : undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Registration failed.');
            }

            const data = await response.json();

            setUser({
                uid: data.userId,
                email: data.email,
                displayName: data.name,
                role: data.role,
                hospital_name: data.hospital_name || null
            }, data.access_token);

            if (data.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (data.role === 'STAFF') {
                navigate('/staff/dashboard');
            } else if (data.role === 'DOCTOR') {
                navigate('/doctor/appointments');
            } else {
                navigate('/user/hospitals');
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
            <NetworkBackground />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl border border-navy-700 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Register</h1>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-alert-critical/10 border border-alert-critical/20 rounded-lg flex items-center gap-2 text-alert-critical text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1">Last Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-muted)] ml-1">Email address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-muted)] ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-muted)] ml-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-muted)] ml-1">Select Role</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => { setRole(e.target.value); setHospitalName(''); setHospitalSearch(''); }}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] px-4 py-2.5 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            >
                                <option value="USER" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">User</option>
                                <option value="DOCTOR" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Doctor</option>
                                <option value="STAFF" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Staff</option>
                                <option value="ADMIN" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Admin</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Hospital name picker — for ADMIN, STAFF, and DOCTOR */}
                    {(role === 'ADMIN' || role === 'STAFF' || role === 'DOCTOR') && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1">
                                Hospital Name <span className="text-red-400">*</span>
                            </label>
                            {hospitalName ? (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                                    style={{ background: 'rgba(20,184,166,0.08)', borderColor: 'rgba(20,184,166,0.3)' }}>
                                    <Building2 size={14} style={{ color: '#14b8a6' }} />
                                    <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{hospitalName}</span>
                                    <button type="button" onClick={() => { setHospitalName(''); setHospitalSearch(''); }}
                                        className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ Change</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search hospital…"
                                        value={hospitalSearch}
                                        onChange={e => setHospitalSearch(e.target.value)}
                                        className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                    />
                                    {hospitalSearch.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-2xl overflow-y-auto z-50"
                                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', maxHeight: 180 }}>
                                            {hospitalList
                                                .filter(h => h.toLowerCase().includes(hospitalSearch.toLowerCase()))
                                                .slice(0, 8)
                                                .map(h => (
                                                    <button key={h} type="button"
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-teal-500/10 transition-colors"
                                                        style={{ color: 'var(--text-primary)' }}
                                                        onClick={() => { setHospitalName(h); setHospitalSearch(''); }}>
                                                        {h}
                                                    </button>
                                                ))}
                                            {hospitalList.filter(h => h.toLowerCase().includes(hospitalSearch.toLowerCase())).length === 0 && (
                                                <p className="px-4 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>No hospitals found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email || !password || !confirmPassword || !firstName || !lastName || ((role === 'ADMIN' || role === 'STAFF' || role === 'DOCTOR') && !hospitalName)}
                        className="w-full mt-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Register
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
                    <p>Already have an account? <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
}

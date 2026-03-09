import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getFirebaseAuth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from '../../services/firebase';
import { Mail, Lock, Phone, AlertCircle, Loader2 } from 'lucide-react';
import useStore from '../../store/useStore';
import NetworkBackground from '../public/NetworkBackground';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [authMode, setAuthMode] = useState('email'); // 'email' | 'phone'
    const [step, setStep] = useState('request'); // 'request' | 'verify' for phone
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const setUser = useStore(state => state.setUser);
    const clearSelectedHospital = useStore(state => state.clearSelectedHospital);
    const auth = getFirebaseAuth();

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);
            setUser({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL
            });
            clearSelectedHospital();
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to sign in.');
            }

            const data = await response.json();

            setUser({
                uid: data.userId,
                email: data.email,
                displayName: data.name,
                role: data.role,
                hospital_name: data.hospital_name || null
            }, data.access_token);

            // Redirect based on role
            if (data.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (data.role === 'STAFF') {
                navigate('/staff/dashboard');
            } else if (data.role === 'DOCTOR') {
                navigate('/doctor/appointments');
            } else {
                clearSelectedHospital();
                navigate('/user/hospitals');
            }

        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
    };

    const handlePhoneSignIn = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
            window.confirmationResult = confirmationResult;
            setStep('verify');
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const result = await window.confirmationResult.confirm(otp);
            setUser({
                uid: result.user.uid,
                phoneNumber: result.user.phoneNumber,
                displayName: result.user.phoneNumber
            });
            clearSelectedHospital();
            navigate('/');
        } catch (err) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
            <NetworkBackground />
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl border border-navy-700 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center mb-4">
                        <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center border border-teal-500/30">
                            <AlertCircle className="w-6 h-6 text-teal-400" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Welcome back</h1>
                    <p className="text-sm text-[var(--text-muted)]">Sign in to MedGuard AI to continue</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-alert-critical/10 border border-alert-critical/20 rounded-lg flex items-center gap-2 text-alert-critical text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                    placeholder="admin@hospital.org"
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
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Sign In
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
                    <p>New hospital administrator? <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">Apply for access</Link></p>
                </div>
            </div>
        </div>
    );
}

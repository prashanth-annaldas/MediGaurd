import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import NetworkBackground from './NetworkBackground';
import useStore from '../../store/useStore';

export default function Landing() {
    const user = useStore(state => state.user);

    // If user is logged in, redirect them to appropriate dashboard
    if (user) {
        if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
        if (user.role === 'DOCTOR') return <Navigate to="/doctor/appointments" replace />;
        return <Navigate to="/user/hospitals" replace />;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden flex flex-col font-sans">
            {/* Hero Section */}
            <div className="relative min-h-screen flex flex-col items-center justify-center">
                {/* Interactive Particle Background */}
                <NetworkBackground />

                {/* Top Navigation Bar */}
                <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20 px-8 lg:px-12 backdrop-blur-sm border-b border-navy-700/30">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center border border-teal-500/30">
                            <Activity className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                            MediGuard<span className="text-teal-500">AI</span>
                        </span>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link
                            to="/login"
                            className="text-[var(--text-primary)] hover:text-teal-400 font-semibold transition-colors px-3 py-2 md:px-4"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold py-2 px-4 md:px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]"
                        >
                            Register
                        </Link>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="z-10 text-center px-4 max-w-4xl pt-20">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[var(--text-primary)] mb-4 mt-8">
                        <span className="text-teal-500">MediGuard</span> AI
                    </h1>

                    <p className="text-xl md:text-2xl text-[var(--text-muted)] font-medium mb-8">
                        Intelligent Hospital Resource & Bed Management System
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12 text-[var(--text-muted)] bg-[var(--bg-secondary)]/30 p-6 rounded-2xl backdrop-blur-sm border border-navy-700/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🏥</span>
                            <span>Real-time Bed Tracking</span>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-navy-700"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <span>AI Resource Forecasting</span>
                        </div>
                        <div className="hidden md:block w-px h-6 bg-navy-700"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚡</span>
                            <span>Instant Alerts</span>
                        </div>
                    </div>
                </main>
            </div>

            {/* Features Section */}
            <section className="bg-[var(--bg-secondary)] py-24 px-6 md:px-12 z-10 relative">
                <div className="max-w-7xl mx-auto space-y-32">
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">A Next-Generation Healthcare Approach</h2>
                        <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">Our platform combines cutting-edge AI and seamless real-time tracking to ensure your medical facility operates at peak efficiency.</p>
                    </div>

                    {/* Feature 1: Dashboard (Image Left) */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-2xl overflow-hidden border border-navy-700 shadow-[0_0_30px_rgba(20,184,166,0.15)] relative group">
                                <img src="/images/dashboard_preview.png" alt="Intelligent Resource Dashboard" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold tracking-wide">
                                01 • Centralized Admin
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Intelligent Resource Dashboard</h3>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                View all facility resources, upcoming patient needs, and equipment availability in one elegant and comprehensive interface. Access critical metrics instantly to make data-driven decisions that improve patient care.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2: Bed Tracking (Image Right) */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-2xl overflow-hidden border border-navy-700 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative group">
                                <img src="/images/ai_bed_tracking.png" alt="Real-time Bed Tracking" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide">
                                02 • Live Tracking
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">QR-Connected Bed Management</h3>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                Every physical bed is linked via QR code to our digital network. Staff can update admission flows seamlessly from their mobile devices while our algorithm analyzes stress loads on personnel to route patients optimally.
                            </p>
                        </div>
                    </div>

                    {/* Feature 3: Forecasting (Image Left) */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-2xl overflow-hidden border border-navy-700 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative group">
                                <img src="/images/alert_forecasting.png" alt="Predictive Surge Alerts" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold tracking-wide">
                                03 • AI Forecasting
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Predictive Surge Alerts</h3>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                Stay steps ahead of admission spikes. Our AI forecasting continuously models historical trends and real-time data to generate alerts, allowing administrators to adjust capacity flows before critical shortages occur.
                            </p>
                        </div>
                    </div>

                    {/* Feature 4: Appointments (Image Right) */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-2xl overflow-hidden border border-navy-700 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative group">
                                <img src="/images/feature_appointments.png" alt="Smart Appointments" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold tracking-wide">
                                04 • Patient Portal
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Smart Appointments & Prescriptions</h3>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                A frictionless experience for both doctors and patients. Seamlessly book appointments, manage scheduling, and instantly issue or access cryptographic digital prescriptions directly within a unified portal.
                            </p>
                        </div>
                    </div>

                    {/* Feature 5: AI Chat (Image Left) */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-2xl overflow-hidden border border-navy-700 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative group">
                                <img src="/images/feature_ai_chat.png" alt="Interactive Gemini AI Assistant" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold tracking-wide">
                                05 • Integrated AI
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Interactive Gemini AI Assistant</h3>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                Need quick insights? Chat with our deeply integrated Gemini AI model. It instantly analyzes hospital stress patterns, queries backend datasets, and provides precise data-driven guidance for operational decisions.
                            </p>
                        </div>
                    </div>

                    {/* Feature 6: Hospital Map (Image Right) */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-2xl overflow-hidden border border-navy-700 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative group">
                                <img src="/images/feature_hospital_map.png" alt="Public Hospital Stress Map" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-semibold tracking-wide">
                                06 • Public View
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Public Hospital Mapping</h3>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                Empowerizing incoming patients before they arrive. Our public interface allows users to survey nearby facilities on a visual map and monitor live bed availability and stress scores to make critical travel decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

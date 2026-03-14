import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Hero3D } from './Hero3D';
import ShaderBackground from '../ui/shader-background';
import useStore from '../../store/useStore';

export default function Landing() {
    const user = useStore(state => state.user);

    // If user is logged in and has a valid role, redirect them to appropriate dashboard
    if (user && user.role) {
        if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
        if (user.role === 'DOCTOR') return <Navigate to="/doctor/appointments" replace />;
        if (user.role === 'USER') return <Navigate to="/user/hospitals" replace />;
    }

    return (
        <div className="min-h-screen bg-transparent overflow-x-hidden flex flex-col font-sans relative">
            {/* Shader Background covering the entire page */}
            <ShaderBackground />

            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 px-8 lg:px-12 backdrop-blur-md bg-white/70 border-b border-slate-100">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-slate-100/50">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl md:text-2xl font-bold tracking-tight text-black" style={{ color: 'black' }}>
                        MedGuard<span className="text-black" style={{ color: 'black' }}>AI</span>
                    </span>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2 md:gap-4">
                    <Link
                        to="/login"
                        className="text-black hover:text-emerald-600 font-semibold transition-colors px-3 py-2 md:px-4"
                        style={{ color: 'black' }}
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 md:px-6 rounded-xl transition-all shadow-lg shadow-slate-100/50"
                    >
                        Register
                    </Link>
                </div>
            </nav>

            {/* Main 3D Hero - Center aligned with RGB background for the robot */}
            <div className="pt-20">
                <Hero3D />
            </div>

            {/* Features Section - Cleanly aligned below the 3D Hero */}
            <section className="bg-transparent py-24 px-6 md:px-12 relative">
                <div className="max-w-7xl mx-auto space-y-32">
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Enterprise Healthcare Intelligence</h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">Our platform combines cutting-edge AI and seamless real-time tracking to ensure your medical facility operates at peak efficiency.</p>
                    </div>

                    {/* Feature 1: Dashboard (Image Left) */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl relative group bg-white">
                                <img src="/images/dashboard_preview.png" alt="Intelligent Resource Dashboard" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold tracking-wide">
                                01 • Centralized Admin
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900">Intelligent Resource Dashboard</h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                View all facility resources, upcoming patient needs, and equipment availability in one elegant and comprehensive interface. Access critical metrics instantly to make data-driven decisions that improve patient care.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2: Bed Tracking (Image Right) */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl relative group bg-white">
                                <img src="/images/ai_bed_tracking.png" alt="Real-time Bed Tracking" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold tracking-wide">
                                02 • Live Tracking
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900">QR-Connected Bed Management</h3>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Every physical bed is linked via QR code to our digital network. Staff can update admission flows seamlessly from their mobile devices while our algorithm analyzes stress loads on personnel to route patients optimally.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div className="bg-slate-900 py-16 px-6 text-center text-white relative z-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to modernize your hospital?</h2>
                <Link
                    to="/register"
                    className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
                >
                    Get Started with MedGuard AI
                </Link>
                <p className="mt-8 text-slate-400">© 2026 MedGuard AI. All rights reserved.</p>
            </div>
        </div>
    );
}

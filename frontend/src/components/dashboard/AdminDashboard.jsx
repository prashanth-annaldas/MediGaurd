import React from 'react';
import useStore from '../../store/useStore';
import Dashboard from './Dashboard';

export default function AdminDashboard() {
    const user = useStore(state => state.user);
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8">
            <h1 className="text-3xl font-bold text-teal-400 mb-4">Admin Dashboard</h1>
            <p className="text-[var(--text-primary)] mb-8">Welcome {user?.displayName}. You have full access.</p>
            <div className="opacity-80 scale-95 transform origin-top-left border border-teal-500/30 rounded-2xl overflow-hidden shadow-2xl">
                <Dashboard />
            </div>
        </div>
    );
}

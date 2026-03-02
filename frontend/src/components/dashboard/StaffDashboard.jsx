import React from 'react';
import useStore from '../../store/useStore';
import Dashboard from './Dashboard';

export default function StaffDashboard() {
    const user = useStore(state => state.user);
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8">
            <h1 className="text-3xl font-bold text-blue-400 mb-4">Staff Dashboard</h1>
            <p className="text-[var(--text-primary)] mb-8">Welcome {user?.displayName}. You have staff-level access.</p>
            <div className="opacity-80 scale-95 transform origin-top-left border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
                <Dashboard />
            </div>
        </div>
    );
}

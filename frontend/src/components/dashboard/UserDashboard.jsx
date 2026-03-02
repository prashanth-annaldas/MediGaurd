import React from 'react';
import useStore from '../../store/useStore';

export default function UserDashboard() {
    const user = useStore(state => state.user);
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-8">
            <div className="bg-[var(--bg-secondary)] border border-navy-700 p-8 rounded-2xl max-w-md text-center">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">User Dashboard</h1>
                <p className="text-[var(--text-muted)]">Welcome {user?.displayName}. You have limited view access.</p>
            </div>
        </div>
    );
}

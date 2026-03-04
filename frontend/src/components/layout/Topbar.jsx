import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw, Bell, User, Zap, Wifi, LogOut, Sun, Moon } from 'lucide-react'
import useStore from '../../store/useStore'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { getFirebaseAuth, signOut } from '../../services/firebase'

export default function Topbar({ title = 'Dashboard' }) {
    const { refreshData, unreadAlertCount, isLoading, lastRefreshed, user, setUser, theme, toggleTheme } = useStore()
    const { isRefreshing, forceRefresh } = useAutoRefresh(refreshData, 30000)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    const timeStr = lastRefreshed
        ? lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '--:--'

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        const auth = getFirebaseAuth();
        if (auth) {
            await signOut(auth);
        }
        setUser(null);
        navigate('/login');
    };

    return (
        <header
            className="flex items-center justify-between px-6 flex-shrink-0"
            style={{
                height: 64,
                background: 'var(--bg-topbar)',
                borderBottom: '1px solid var(--border-color)',
                backdropFilter: 'blur(12px)',
                zIndex: 100,
            }}
        >
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {user?.hospital_name || 'City General Hospital'} — Resource Intelligence Platform
                    </p>
                </div>
            </div>

            {/* Right: status + controls */}
            <div className="flex items-center gap-3">
                {/* Live indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span className="w-2 h-2 rounded-full pulse-ring" style={{ background: '#10b981' }} />
                    <span className="text-xs font-medium" style={{ color: '#10b981' }}>LIVE</span>
                    <Wifi size={12} style={{ color: '#10b981' }} />
                </div>

                {/* Last refresh */}
                <span className="text-xs ticker hidden md:block" style={{ color: 'var(--text-muted)' }}>
                    Updated {timeStr}
                </span>

                {/* Refresh */}
                <button
                    onClick={forceRefresh}
                    disabled={isRefreshing}
                    title="Refresh data"
                    className="flex items-center justify-center rounded-lg transition-all duration-200"
                    style={{
                        width: 36, height: 36,
                        background: 'rgba(45, 212, 191, 0.08)',
                        border: '1px solid rgba(45, 212, 191, 0.15)',
                        color: 'var(--teal-strong, #2dd4bf)',
                        cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    }}
                >
                    <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title="Toggle Theme"
                    className="flex items-center justify-center rounded-lg transition-all duration-200"
                    style={{
                        width: 36, height: 36,
                        background: 'rgba(45, 212, 191, 0.08)',
                        border: '1px solid rgba(45, 212, 191, 0.15)',
                        color: 'var(--teal-strong, #2dd4bf)',
                        cursor: 'pointer',
                    }}
                >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                {/* Alerts bell */}
                <div className="relative">
                    <Link
                        to="/alerts"
                        title="Alerts"
                        className="flex items-center justify-center rounded-lg transition-all duration-200"
                        style={{
                            width: 36, height: 36,
                            background: unreadAlertCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(45, 212, 191, 0.08)',
                            border: `1px solid ${unreadAlertCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(45, 212, 191, 0.15)'}`,
                            color: unreadAlertCount > 0 ? '#ef4444' : '#2dd4bf',
                            cursor: 'pointer',
                        }}
                    >
                        <Bell size={15} />
                    </Link>
                    {unreadAlertCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 text-[var(--text-primary)] text-xs font-bold rounded-full flex items-center justify-center pointer-events-none"
                            style={{ width: 18, height: 18, background: '#ef4444', fontSize: 10 }}
                        >
                            {unreadAlertCount}
                        </span>
                    )}
                </div>

                {/* User */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-center rounded-xl font-semibold text-sm hover:opacity-80 transition-opacity"
                        title={user?.email || user?.phoneNumber || 'Profile'}
                        style={{
                            width: 36, height: 36,
                            background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                    </button>

                    {dropdownOpen && (
                        <div
                            className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-navy-700 rounded-xl shadow-2xl py-2 animate-fade-in"
                            style={{ zIndex: 9999 }}
                        >
                            <div className="px-4 py-2 border-b border-navy-800 mb-1">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.displayName || 'User'}</p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || user?.phoneNumber || 'admin'}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-alert-critical hover:bg-[var(--bg-card)] transition-colors flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                Sign Off
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

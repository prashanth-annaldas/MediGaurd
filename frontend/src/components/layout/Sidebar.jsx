import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Activity, Bell, TrendingUp,
    Brain, Settings, ChevronLeft, ChevronRight,
    Shield, Zap, Users, MapPin
} from 'lucide-react'
import useStore from '../../store/useStore'
import { useClock } from '../../hooks/useClock'
import { formatTime, formatDate } from '../../utils/dateUtils'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true, requiresSelectedHospital: true },
    { to: '/resources', icon: Activity, label: 'Resources', requiresSelectedHospital: true },
    { to: '/alerts', icon: Bell, label: 'Alert Center', requiresSelectedHospital: true },
    { to: '/forecast', icon: TrendingUp, label: 'AI Forecast', requiresSelectedHospital: true },
    { to: '/trends', icon: TrendingUp, label: 'Trends', requiresSelectedHospital: true },
    { to: '/gemini', icon: Brain, label: 'Gemini AI', alwaysShowForUser: true },
    { to: '/hospitals', icon: MapPin, label: 'Hospital Search', userOnly: true, alwaysShowForUser: true },
    { to: '/staff', icon: Users, label: 'Staff Data', adminOnly: true },
    { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
]

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, unreadAlertCount, user, selectedHospital, clearSelectedHospital } = useStore()
    const now = useClock()
    const navigate = useNavigate()

    const handleLogoClick = () => {
        if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
            clearSelectedHospital();
            navigate('/hospitals');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <aside
            className="flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 relative"
            style={{
                width: sidebarCollapsed ? '68px' : '220px',
                background: 'var(--bg-topbar)',
                borderRight: '1px solid var(--border-color)',
            }}
        >
            {/* Logo */}
            <div
                className={`flex items-center gap-3 px-4 py-5 flex-shrink-0 ${user?.role !== 'ADMIN' && user?.role !== 'STAFF' ? 'cursor-pointer hover:bg-white/5' : ''}`}
                style={{ minHeight: 72 }}
                onClick={handleLogoClick}
            >
                <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl"
                    style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
                        boxShadow: '0 0 16px rgba(20, 184, 166, 0.4)',
                    }}
                >
                    <Zap size={18} color="white" />
                </div>
                {!sidebarCollapsed && (
                    <div className="overflow-hidden">
                        <p className="font-bold text-sm text-gradient leading-tight tracking-wide">MedGuard</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>AI Platform</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden py-2">
                {navItems.map(({ to, icon: Icon, label, end, adminOnly, userOnly, requiresSelectedHospital, alwaysShowForUser }) => {
                    if (adminOnly && user?.role !== 'ADMIN') return null;
                    if (userOnly && (user?.role === 'ADMIN' || user?.role === 'STAFF')) return null;

                    // For normal users (not ADMIN, not STAFF)
                    if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
                        if (!selectedHospital) {
                            // First site: Only show items that are always visible to user (e.g. Hospital Search, Gemini AI)
                            if (requiresSelectedHospital) return null;
                        } else {
                            // Second site: Hide "alwaysShowForUser" (like Hospital Search) if we prefer them gone?
                            // Wait, the prompt says "second site that is like side bar has Dashboard, Resources, Alert Center, AI Forecast, Trends, Gemini AI"
                            // So Hospital Search shouldn't be there.
                            if (label === 'Hospital Search') return null;
                        }
                    }

                    return (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                            }
                            title={sidebarCollapsed ? label : undefined}
                            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        >
                            <div className="relative flex-shrink-0">
                                <Icon size={18} />
                                {label === 'Alert Center' && unreadAlertCount > 0 && (
                                    <span
                                        className="absolute -top-1.5 -right-1.5 text-[var(--text-primary)] rounded-full flex items-center justify-center font-bold"
                                        style={{
                                            fontSize: '9px',
                                            width: 16, height: 16,
                                            background: '#ef4444',
                                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                                        }}
                                    >
                                        {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                                    </span>
                                )}
                            </div>
                            {!sidebarCollapsed && <span>{label}</span>}
                        </NavLink>
                    )
                })}
            </nav>

            {/* Clock */}
            {!sidebarCollapsed && (
                <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <p className="ticker text-xs font-medium" style={{ color: 'var(--teal-strong, #2dd4bf)' }}>{formatTime(now)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(now)}</p>
                </div>
            )}

            {/* Collapse toggle */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full z-10"
                style={{
                    width: 24, height: 24,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-hover)',
                    color: 'var(--teal-strong)',
                    cursor: 'pointer',
                }}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </aside>
    )
}

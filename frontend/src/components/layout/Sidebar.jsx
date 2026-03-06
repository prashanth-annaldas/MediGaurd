import React, { useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import useStore from '../../store/useStore'
import { formatTime, formatDate } from '../../utils/dateUtils'

const navItems = [
    { to: '/dashboard', label: 'Dashboard', end: true, requiresSelectedHospital: true },
    { to: '/resources', label: 'Resources', requiresSelectedHospital: true },
    { to: '/alerts', label: 'Alert Center', requiresSelectedHospital: true },
    { to: '/forecast', label: 'AI Forecast', requiresSelectedHospital: true },
    { to: '/trends', label: 'Trends', requiresSelectedHospital: true },
    { to: '/gemini', label: 'Gemini AI', alwaysShowForUser: true },
    { to: '/hospitals', label: 'Hospital Search', userOnly: true, alwaysShowForUser: true },
    { to: '/admin', label: 'Admin', adminOnly: true },
    { to: '/appointments', label: 'Appointments', staffOnly: true },
    { to: '/admit', label: 'Admit Patient', staffOnly: true },
    { to: '/discharge', label: 'Discharge Patient', staffOnly: true },
    { to: '/qr-gen', label: 'QR Generator', staffOnly: true },
    { to: '/patients', label: 'Register Patient', userOnly: true, alwaysShowForUser: true },
    { to: '/appointments', label: 'Appointments', userOnly: true, alwaysShowForUser: true },
    { to: '/appointments', label: 'Prescriptions', doctorOnly: true },
]

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, unreadAlertCount, user, selectedHospital, clearSelectedHospital } = useStore()
    const now = useRef(new Date()).current
    const navigate = useNavigate()

    const handleLogoClick = () => {
        const rolePrefix = user?.role?.toLowerCase() || 'user';
        if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
            clearSelectedHospital();
            navigate(`/${rolePrefix}/hospitals`);
        } else {
            navigate(`/${rolePrefix}/dashboard`);
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
                        background: '#22c55e',
                        boxShadow: '0 0 16px rgba(34, 197, 94, 0.4)',
                    }}
                >
                    <Plus size={20} color="white" strokeWidth={3} />
                </div>
                {!sidebarCollapsed && (
                    <div className="overflow-hidden">
                        <p className="font-bold text-sm text-gradient leading-tight tracking-wide">MediGuard</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>AI Platform</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden py-2">
                {navItems.map(({ to, label, end, adminOnly, userOnly, staffOnly, doctorOnly, requiresSelectedHospital, alwaysShowForUser }, idx) => {
                    const rolePrefix = user?.role?.toLowerCase() || 'user';

                    if (adminOnly && user?.role !== 'ADMIN') return null;
                    if (userOnly && (user?.role === 'ADMIN' || user?.role === 'STAFF')) return null;
                    if (doctorOnly && user?.role !== 'DOCTOR') return null;
                    if (requiresSelectedHospital && !selectedHospital && user?.role !== 'ADMIN' && user?.role !== 'STAFF') return null;

                    // Staff features (Admit/Discharge/QR Gen/Appointments) should be visible to Staff and Admins
                    // For Doctors, ONLY show Appointments
                    if (staffOnly) {
                        if (user?.role === 'DOCTOR' && label !== 'Appointments') return null;
                        if (user?.role !== 'STAFF' && user?.role !== 'ADMIN' && user?.role !== 'DOCTOR') return null;
                    } else if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
                        // For normal users or doctors
                        // Doctors should ONLY see Appointments (handled by staffOnly check above)
                        // If we are here, it's not a staffOnly item.
                        // For DOCTOR role, we don't want to show anything else.
                        if (user?.role === 'DOCTOR') return null;

                        // For normal users (not ADMIN, not STAFF, not DOCTOR)
                        // Show ONLY if alwaysShowForUser (hide analysis-related links even if selectedHospital exists)
                        if (!alwaysShowForUser) return null;
                    }

                    // Construct the final URL with role prefix
                    let finalTo = to;
                    if (to.startsWith('/')) {
                        // Special cases for admin-only pages that were already mapped in App.jsx
                        if (to === '/admin' && user?.role === 'ADMIN') {
                            finalTo = '/admin/admin';
                        } else if (to === '/staff' && user?.role === 'ADMIN') {
                            finalTo = '/admin/staff';
                        } else {
                            finalTo = `/${rolePrefix}${to}`;
                        }
                    }

                    return (
                        <NavLink
                            key={`${to}-${idx}`}
                            to={finalTo}
                            end={end}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                            }
                            title={sidebarCollapsed ? label : undefined}
                            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        >
                            <div className="flex items-center gap-3">
                                {!sidebarCollapsed ? <span>{label}</span> : <span className="text-xs font-bold">{label.charAt(0)}</span>}
                            </div>
                            {label === 'Alert Center' && !sidebarCollapsed && unreadAlertCount > 0 && (
                                <span
                                    className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
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

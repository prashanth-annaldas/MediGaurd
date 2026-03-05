import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Activity, Bell, TrendingUp,
    Brain, Settings, ChevronLeft, ChevronRight, ChevronDown,
    Shield, Plus, Users, MapPin, UserPlus, UserMinus, QrCode, CalendarDays, Stethoscope
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
    { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
    { to: '/appointments', icon: CalendarDays, label: 'Appointments', staffOnly: true },
    { to: '/admit', icon: UserPlus, label: 'Admit Patient', staffOnly: true },
    { to: '/discharge', icon: UserMinus, label: 'Discharge Patient', staffOnly: true },
    { to: '/qr-gen', icon: QrCode, label: 'QR Generator', staffOnly: true },
]

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, unreadAlertCount, user, token, selectedHospital, clearSelectedHospital } = useStore()
    const now = useClock()
    const navigate = useNavigate()
    const location = useLocation()

    const [appointmentsExpanded, setAppointmentsExpanded] = useState(true)
    const [hospitalDoctors, setHospitalDoctors] = useState([])

    // Fetch all doctors at this hospital when user is DOCTOR
    useEffect(() => {
        if (user?.role === 'DOCTOR' && token) {
            // Use user's hospital_name from DB, or fall back to selectedHospital
            const hospitalName = user.hospital_name || selectedHospital?.name || '';
            if (!hospitalName) return;
            const url = `/api/hospital/doctors${!user.hospital_name ? `?hospital_name=${encodeURIComponent(hospitalName)}` : ''}`;
            fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : [])
                .then(data => setHospitalDoctors(Array.isArray(data) ? data : []))
                .catch(() => setHospitalDoctors([]))
        }
    }, [user, token, selectedHospital])

    const handleLogoClick = () => {
        const rolePrefix = user?.role?.toLowerCase() || 'user';
        if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
            clearSelectedHospital();
            navigate(`/${rolePrefix}/hospitals`);
        } else {
            navigate(`/${rolePrefix}/dashboard`);
        }
    };

    const handleDoctorSelect = (doctorName) => {
        navigate(`/doctor/appointments?doctor=${encodeURIComponent(doctorName)}`)
    }

    // Check if the current route is /doctor/appointments
    const isOnAppointments = location.pathname.startsWith('/doctor/appointments')
    // Get currently selected doctor from URL
    const urlParams = new URLSearchParams(location.search)
    const selectedDoctor = urlParams.get('doctor') || ''

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
                {navItems.map(({ to, icon: Icon, label, end, adminOnly, userOnly, staffOnly, requiresSelectedHospital, alwaysShowForUser }) => {
                    const rolePrefix = user?.role?.toLowerCase() || 'user';

                    if (adminOnly && user?.role !== 'ADMIN') return null;
                    if (userOnly && (user?.role === 'ADMIN' || user?.role === 'STAFF')) return null;
                    if (requiresSelectedHospital && !selectedHospital && user?.role !== 'ADMIN' && user?.role !== 'STAFF') return null;

                    if (staffOnly) {
                        if (user?.role === 'DOCTOR' && label !== 'Appointments') return null;
                        if (user?.role !== 'STAFF' && user?.role !== 'ADMIN' && user?.role !== 'DOCTOR') return null;
                    } else if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
                        if (user?.role === 'DOCTOR') return null;
                        if (!alwaysShowForUser && !(requiresSelectedHospital && selectedHospital)) return null;
                    }

                    // Build final URL
                    let finalTo = to;
                    if (to.startsWith('/')) {
                        if (to === '/admin' && user?.role === 'ADMIN') {
                            finalTo = '/admin/admin';
                        } else if (to === '/staff' && user?.role === 'ADMIN') {
                            finalTo = '/admin/staff';
                        } else {
                            finalTo = `/${rolePrefix}${to}`;
                        }
                    }

                    // Special rendering for Appointments in DOCTOR role — show sub-menu
                    if (label === 'Appointments' && user?.role === 'DOCTOR') {
                        return (
                            <div key={to}>
                                {/* Main Appointments button */}
                                <button
                                    onClick={() => {
                                        setAppointmentsExpanded(prev => !prev)
                                        if (!isOnAppointments) navigate(finalTo)
                                    }}
                                    className={`sidebar-nav-item w-full ${isOnAppointments ? 'active' : ''}`}
                                    style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}
                                    title={sidebarCollapsed ? label : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className="flex-shrink-0" />
                                        {!sidebarCollapsed && <span>{label}</span>}
                                    </div>
                                    {!sidebarCollapsed && (
                                        <ChevronDown
                                            size={14}
                                            className="flex-shrink-0 transition-transform duration-200"
                                            style={{ transform: appointmentsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                        />
                                    )}
                                </button>

                                {/* Sub-menu: doctor names */}
                                {!sidebarCollapsed && appointmentsExpanded && (
                                    <div className="ml-3 mt-1 space-y-0.5 border-l-2 pl-3" style={{ borderColor: 'var(--border-color)' }}>
                                        {/* "All My Appointments" shortcut */}
                                        <button
                                            onClick={() => navigate('/doctor/appointments')}
                                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${!selectedDoctor ? 'font-semibold' : 'opacity-70 hover:opacity-100'}`}
                                            style={{
                                                color: !selectedDoctor ? 'var(--teal-strong, #2dd4bf)' : 'var(--text-muted)',
                                                background: !selectedDoctor ? 'rgba(45,212,191,0.08)' : 'transparent',
                                            }}
                                        >
                                            <Stethoscope size={12} />
                                            My Appointments
                                        </button>

                                        {/* One entry per doctor at the hospital */}
                                        {hospitalDoctors.map((doc, idx) => {
                                            const name = doc.name || doc
                                            const isSelected = selectedDoctor === name
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleDoctorSelect(name)}
                                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${isSelected ? 'font-semibold' : 'opacity-70 hover:opacity-100'}`}
                                                    style={{
                                                        color: isSelected ? 'var(--teal-strong, #2dd4bf)' : 'var(--text-muted)',
                                                        background: isSelected ? 'rgba(45,212,191,0.08)' : 'transparent',
                                                    }}
                                                >
                                                    <span
                                                        className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                                                        style={{ background: 'var(--teal-strong, #2dd4bf)', color: '#fff' }}
                                                    >
                                                        {(name[0] || '?').toUpperCase()}
                                                    </span>
                                                    <span className="truncate">{name}</span>
                                                </button>
                                            )
                                        })}

                                        {hospitalDoctors.length === 0 && (
                                            <p className="px-2 py-1 text-xs opacity-40" style={{ color: 'var(--text-muted)' }}>
                                                No doctors found
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <NavLink
                            key={to}
                            to={finalTo}
                            end={end}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                            }
                            title={sidebarCollapsed ? label : undefined}
                            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} className="flex-shrink-0" />
                                {!sidebarCollapsed && <span>{label}</span>}
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

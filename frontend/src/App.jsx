import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/dashboard/Dashboard'
import HospitalDashboard from './components/dashboard/HospitalDashboard'
import ResourcesPage from './components/dashboard/ResourcesPage'
import AlertCenter from './components/alerts/AlertCenter'
import ForecastDashboard from './components/forecast/ForecastDashboard'
import TrendAnalytics from './components/trends/TrendAnalytics'
import GeminiChat from './components/gemini/GeminiChat'
import AdminPanel from './components/admin/AdminPanel'
import StaffDataPage from './components/admin/StaffDataPage'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import StressIndexView from './components/public/StressIndexView'
import HospitalSearch from './components/public/HospitalSearch'
import AdmitPatient from './components/staff/AdmitPatient'
import DischargePatient from './components/staff/DischargePatient'
import QRGenerator from './components/staff/QRGenerator'
import useStore from './store/useStore'

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = useStore(state => state.user);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />; // Fallback 
    }
    return children;
};

const HospitalRequiredRoute = ({ children }) => {
    const user = useStore(state => state.user);
    const selectedHospital = useStore(state => state.selectedHospital);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role !== 'ADMIN' && user.role !== 'STAFF' && !selectedHospital) {
        return <Navigate to="/hospitals" replace />;
    }
    return children;
};

// Root redirect based on role
const RootRedirect = () => {
    const user = useStore(state => state.user);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'ADMIN' || user.role === 'STAFF') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/hospitals" replace />;
}

// Role-aware dashboard router
const SmartDashboard = () => {
    // Both ADMIN/STAFF and USER should see the comprehensive real-time Dashboard 
    // instead of the history-only HospitalDashboard.
    return <Dashboard />;
};

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public/stress-index" element={<StressIndexView />} />

            <Route path="/" element={<RootRedirect />} />

            {/* Dashboards */}
            <Route path="/dashboard" element={<HospitalRequiredRoute><SmartDashboard /></HospitalRequiredRoute>} />

            {/* Admin Only */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['ADMIN']}><StaffDataPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></ProtectedRoute>} />

            {/* Other routes */}
            <Route path="/resources" element={<HospitalRequiredRoute><ResourcesPage /></HospitalRequiredRoute>} />
            <Route path="/alerts" element={<HospitalRequiredRoute><AlertCenter /></HospitalRequiredRoute>} />
            <Route path="/forecast" element={<HospitalRequiredRoute><ForecastDashboard /></HospitalRequiredRoute>} />
            <Route path="/trends" element={<HospitalRequiredRoute><TrendAnalytics /></HospitalRequiredRoute>} />
            <Route path="/gemini" element={<ProtectedRoute><GeminiChat /></ProtectedRoute>} />
            <Route path="/hospitals" element={<ProtectedRoute><HospitalSearch /></ProtectedRoute>} />

            {/* Staff/Admin QR Features */}
            <Route path="/admit" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><AdmitPatient /></ProtectedRoute>} />
            <Route path="/discharge" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><DischargePatient /></ProtectedRoute>} />
            <Route path="/qr-gen" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><QRGenerator /></ProtectedRoute>} />
        </Routes>
    )
}

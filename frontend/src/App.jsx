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
import Appointments from './components/staff/Appointments'
import DoctorAppointments from './components/doctor/DoctorAppointments'
import PatientRegistration from './components/staff/PatientRegistration'
import DoctorPrescription from './components/doctor/DoctorPrescription'
import UserAppointments from './components/user/UserAppointments'
import UserPrescriptionView from './components/user/UserPrescriptionView'
import DiseasePrediction from './components/user/DiseasePrediction'
import BedManagement from './components/staff/BedManagement'
import BedDetail from './components/public/BedDetail'
import Landing from './components/public/Landing'
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

// Root redirect based on role (kept for Legacy Fallback usage)
const RootRedirect = () => {
    const user = useStore(state => state.user);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/appointments" replace />;
    return <Navigate to="/user/hospitals" replace />;
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
            <Route path="/bed/:qrCode" element={<BedDetail />} />

            <Route path="/" element={<Landing />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><HospitalRequiredRoute><SmartDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['ADMIN']}><StaffDataPage /></ProtectedRoute>} />
            <Route path="/admin/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/resources" element={<ProtectedRoute allowedRoles={['ADMIN']}><HospitalRequiredRoute><ResourcesPage /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['ADMIN']}><HospitalRequiredRoute><AlertCenter /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/admin/forecast" element={<ProtectedRoute allowedRoles={['ADMIN']}><HospitalRequiredRoute><ForecastDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/admin/trends" element={<ProtectedRoute allowedRoles={['ADMIN']}><HospitalRequiredRoute><TrendAnalytics /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/admin/gemini" element={<ProtectedRoute allowedRoles={['ADMIN']}><GeminiChat /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['ADMIN']}><Appointments /></ProtectedRoute>} />
            <Route path="/admin/beds" element={<ProtectedRoute allowedRoles={['ADMIN']}><BedManagement /></ProtectedRoute>} />

            {/* Staff Routes */}
            <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['STAFF']}><HospitalRequiredRoute><SmartDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/staff/resources" element={<ProtectedRoute allowedRoles={['STAFF']}><HospitalRequiredRoute><ResourcesPage /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/staff/alerts" element={<ProtectedRoute allowedRoles={['STAFF']}><HospitalRequiredRoute><AlertCenter /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/staff/forecast" element={<ProtectedRoute allowedRoles={['STAFF']}><HospitalRequiredRoute><ForecastDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/staff/trends" element={<ProtectedRoute allowedRoles={['STAFF']}><HospitalRequiredRoute><TrendAnalytics /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/staff/gemini" element={<ProtectedRoute allowedRoles={['STAFF']}><GeminiChat /></ProtectedRoute>} />
            <Route path="/staff/appointments" element={<ProtectedRoute allowedRoles={['STAFF']}><Appointments /></ProtectedRoute>} />
            <Route path="/staff/beds" element={<ProtectedRoute allowedRoles={['STAFF']}><BedManagement /></ProtectedRoute>} />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['DOCTOR']}><HospitalRequiredRoute><SmartDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorAppointments /></ProtectedRoute>} />
            <Route path="/doctor/resources" element={<ProtectedRoute allowedRoles={['DOCTOR']}><HospitalRequiredRoute><ResourcesPage /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/doctor/alerts" element={<ProtectedRoute allowedRoles={['DOCTOR']}><HospitalRequiredRoute><AlertCenter /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/doctor/forecast" element={<ProtectedRoute allowedRoles={['DOCTOR']}><HospitalRequiredRoute><ForecastDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/doctor/trends" element={<ProtectedRoute allowedRoles={['DOCTOR']}><HospitalRequiredRoute><TrendAnalytics /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/doctor/gemini" element={<ProtectedRoute allowedRoles={['DOCTOR']}><GeminiChat /></ProtectedRoute>} />
            <Route path="/doctor/prescription/:appointmentId" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorPrescription /></ProtectedRoute>} />

            {/* User Routes */}
            <Route path="/user/hospitals" element={<ProtectedRoute allowedRoles={['USER']}><HospitalSearch /></ProtectedRoute>} />
            <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HospitalRequiredRoute><SmartDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/user/resources" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HospitalRequiredRoute><ResourcesPage /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/user/alerts" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HospitalRequiredRoute><AlertCenter /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/user/forecast" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HospitalRequiredRoute><ForecastDashboard /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/user/trends" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HospitalRequiredRoute><TrendAnalytics /></HospitalRequiredRoute></ProtectedRoute>} />
            <Route path="/user/gemini" element={<ProtectedRoute allowedRoles={['USER']}><GeminiChat /></ProtectedRoute>} />
            <Route path="/user/patients" element={<ProtectedRoute allowedRoles={['USER']}><PatientRegistration /></ProtectedRoute>} />
            <Route path="/user/appointments" element={<ProtectedRoute allowedRoles={['USER']}><UserAppointments /></ProtectedRoute>} />
            <Route path="/user/predict" element={<ProtectedRoute allowedRoles={['USER']}><DiseasePrediction /></ProtectedRoute>} />
            <Route path="/user/prescription/:appointmentId" element={<ProtectedRoute allowedRoles={['USER']}><UserPrescriptionView /></ProtectedRoute>} />

            {/* Legacy Fallback Redirects to new role-prefixed routes */}
            <Route path="/hospitals" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
            <Route path="/dashboard" element={<HospitalRequiredRoute><RootRedirect /></HospitalRequiredRoute>} />
        </Routes>
    )
}

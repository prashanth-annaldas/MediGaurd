import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, Activity, Stethoscope } from 'lucide-react';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = useStore(state => state.token);
    const user = useStore(state => state.user);

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch appointments');
            const data = await res.json();

            // Sort by date and time (newest first)
            data.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
            setAppointments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime12h = (time24) => {
        if (!time24 || time24 === "null") return "TBD";
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Group appointments by doctor
    const groupedAppointments = appointments.reduce((acc, appt) => {
        const doctor = appt.doctor_name || 'Unassigned Doctor';
        if (!acc[doctor]) acc[doctor] = [];
        acc[doctor].push(appt);
        return acc;
    }, {});

    return (
        <Layout title="Appointments">
            <div className="max-w-7xl mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hospital Appointments</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage patient bookings for {user?.hospital_name || 'your hospital'}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        {error}
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-400 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Appointments Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">There are currently no patient bookings for this hospital.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedAppointments).map(([doctorName, doctorAppts]) => (
                            <div key={doctorName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Stethoscope className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{doctorName}</h3>
                                            <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {doctorAppts.length} {doctorAppts.length === 1 ? 'Appointment' : 'Appointments'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-0">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {doctorAppts.map((appt) => (
                                                <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                                <User className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{appt.patient_name || 'Anonymous User'}</div>
                                                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                                    <Phone className="w-3 h-3" />
                                                                    {appt.patient_phone || 'No contact'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-900 font-medium">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {appt.date}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            {formatTime12h(appt.time)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            {appt.specialization || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                appt.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

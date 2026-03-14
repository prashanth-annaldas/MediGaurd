import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, X, Calendar, Clock, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import useStore from '../../store/useStore';

export default function AppointmentModal({ hospital, onClose }) {
    const [step, setStep] = useState(1); // 1: Input, 2: Confirm, 3: Success
    const [message, setMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const token = useStore(state => state.token);

    const API = import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com';

    const formatTime12h = (time24) => {
        if (!time24 || time24 === "null") return "Not specified";
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    const handleExtract = async () => {
        if (!message.trim()) return;
        setIsExtracting(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/appointments/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (!res.ok) throw new Error('Failed to parse message');
            const data = await res.json();

            // Override with manually selected doctor if present
            if (selectedDoctor) {
                const docObj = hospital.doctors?.find(d => d.name === selectedDoctor);
                if (docObj) {
                    data.doctor_name = docObj.name;
                    data.specialization = docObj.specialty;
                }
            }

            setExtractedData(data);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleBook = async () => {
        setBooking(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hospital_id: hospital.id,
                    hospital_name: hospital.name,
                    specialization: extractedData.specialization,
                    doctor_name: extractedData.doctor_name,
                    date: extractedData.date,
                    time: extractedData.time,
                    raw_message: message
                })
            });
            if (!res.ok) throw new Error('Booking failed');
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100">
                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Book Appointment</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="px-6 pb-8">
                    <p className="text-xs text-gray-500 mb-6 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {hospital.name}
                    </p>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                    Select a Doctor (Optional)
                                </label>
                                <select
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">Any available doctor (or use Voice/Text below)</option>
                                    {hospital.doctors?.map((doc, idx) => (
                                        <option key={idx} value={doc.name}>
                                            {doc.name} - {doc.specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative group">
                                <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur-sm transition duration-500 ${isListening ? 'opacity-40 animate-pulse' : 'group-hover:opacity-30'}`}></div>
                                <div className="relative bg-white border border-gray-200 rounded-2xl p-4 min-h-[120px] shadow-sm">
                                    <textarea
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder:text-gray-400 text-sm resize-none"
                                        placeholder="e.g. I need to see a cardiologist tomorrow at 3pm"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex justify-between items-end mt-2">
                                        <button
                                            onClick={() => setIsListening(!isListening)}
                                            className={`p-3 rounded-full transition-all duration-300 ${isListening ? 'bg-red-50 text-red-500 scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                        >
                                            <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
                                        </button>
                                        <button
                                            onClick={handleExtract}
                                            disabled={!message.trim() || isExtracting}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
                                        >
                                            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            {isExtracting ? 'AI Analysis...' : 'Process'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Voice assistance active. Record or type your request.</span>
                            </div>
                        </div>
                    )}

                    {step === 2 && extractedData && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50 flex-shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400 mb-1">Doctor & Specialization</p>
                                        <select
                                            className="w-full bg-transparent text-gray-900 font-semibold text-sm border-b border-blue-200 focus:border-blue-500 outline-none pb-1 cursor-pointer truncate"
                                            value={extractedData.doctor_name || ''}
                                            onChange={(e) => {
                                                const selectedDocName = e.target.value;
                                                const selectedDoc = hospital.doctors?.find(d => d.name === selectedDocName);
                                                setExtractedData({
                                                    ...extractedData,
                                                    doctor_name: selectedDocName,
                                                    specialization: selectedDoc ? selectedDoc.specialty : extractedData.specialization
                                                });

                                                // Sync back to step 1 state
                                                setSelectedDoctor(selectedDocName);
                                            }}
                                        >
                                            <option value="">
                                                {extractedData.specialization ? `Any Doctor (${extractedData.specialization})` : 'Choose a Doctor...'}
                                            </option>
                                            {hospital.doctors?.map((doc, idx) => (
                                                <option key={idx} value={doc.name}>
                                                    {doc.name} ({doc.specialty})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400">Date</p>
                                            <p className="text-gray-900 font-semibold text-sm">{extractedData.date || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400">Time</p>
                                            <p className="text-gray-900 font-semibold text-sm">{formatTime12h(extractedData.time)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {extractedData.missing_fields.length > 0 && (
                                <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-100 flex gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>Please note: {extractedData.missing_fields.join(', ')} were not clearly identified. You can confirm or go back to modify.</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Modify
                                </button>
                                <button
                                    onClick={handleBook}
                                    disabled={booking}
                                    className="flex-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm Appointment
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">Appointment Booked!</h4>
                            <p className="text-sm text-gray-500 px-4">
                                Your request for {extractedData.specialization} on {extractedData.date} at {formatTime12h(extractedData.time)} has been sent to {hospital.name}.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full mt-6 py-3 bg-gray-900 text-white font-bold rounded-2xl text-sm hover:bg-black transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

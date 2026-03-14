import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, AlertCircle, Clock } from 'lucide-react';
import useStore from '../../store/useStore';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ScheduleManager() {
    const { token, selectedHospital } = useStore();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fetch hospital doctors to populate dropdown
    useEffect(() => {
        if (!selectedHospital) return;
        const fetchHospital = async () => {
            try {
                const res = await fetch(`/api/hospitals/${selectedHospital.id}`);
                const data = await res.json();
                if (data.doctors) {
                    const docs = typeof data.doctors === 'string' ? JSON.parse(data.doctors) : data.doctors;
                    setDoctors(docs);
                    if (docs.length > 0) setSelectedDoctor(docs[0].name);
                }
            } catch (err) {
                console.error("Failed to load hospital doctors", err);
            }
        };
        fetchHospital();
    }, [selectedHospital]);

    // Fetch schedules for the selected doctor
    useEffect(() => {
        if (!selectedHospital || !selectedDoctor) return;
        
        const fetchSchedules = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/doctors/schedules/${selectedHospital.name}`);
                const allSchedules = await res.json();
                
                // Filter for current doctor
                const docSchedules = allSchedules.filter(s => s.doctor_name === selectedDoctor);
                
                // Construct a full week schedule
                const fullWeek = DAYS_OF_WEEK.map(day => {
                    const existing = docSchedules.find(s => s.day_of_week === day);
                    return existing || {
                        day_of_week: day,
                        start_time: '09:00',
                        end_time: '17:00',
                        slot_duration: 15,
                        is_off_day: 0
                    };
                });
                
                setSchedules(fullWeek);
            } catch (err) {
                setMessage({ text: 'Failed to load schedules', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchSchedules();
    }, [selectedHospital, selectedDoctor]);

    const handleScheduleChange = (index, field, value) => {
        const newSchedules = [...schedules];
        newSchedules[index][field] = value;
        setSchedules(newSchedules);
    };

    const saveDaySchedule = async (schedule) => {
        const payload = {
            doctor_name: selectedDoctor,
            day_of_week: schedule.day_of_week,
            start_time: schedule.is_off_day ? null : schedule.start_time,
            end_time: schedule.is_off_day ? null : schedule.end_time,
            slot_duration: parseInt(schedule.slot_duration),
            is_off_day: schedule.is_off_day ? 1 : 0
        };

        const res = await fetch('/api/doctors/schedules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error(`Failed to save ${schedule.day_of_week}`);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            for (const schedule of schedules) {
                await saveDaySchedule(schedule);
            }
            setMessage({ text: 'Doctor schedules saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (!selectedHospital) return <div className="p-6">Please select a hospital first.</div>;

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Doctor Schedules
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Configure appointment slots and working hours.</p>
                </div>
                {message.text && (
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select 
                    className="w-full md:w-1/2 rounded-xl border-gray-200 outline-none p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                    {doctors.map((d, idx) => (
                        <option key={idx} value={d.name}>{d.name} ({d.specialty})</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12 text-blue-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">
                        <div className="col-span-3">Day</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Start Time</div>
                        <div className="col-span-3">End Time</div>
                        <div className="col-span-1 border-l pl-4">Dur <span className='lowercase'>(min)</span></div>
                    </div>
                    
                    {schedules.map((schedule, index) => (
                        <div key={schedule.day_of_week} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border transition-colors ${schedule.is_off_day ? 'bg-gray-50 border-gray-100' : 'bg-white border-blue-50 shadow-sm'}`}>
                            <div className="col-span-3 font-semibold text-gray-800 flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${schedule.is_off_day ? 'text-gray-400' : 'text-blue-500'}`} />
                                {schedule.day_of_week}
                            </div>
                            
                            <div className="col-span-2">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!schedule.is_off_day}
                                        onChange={(e) => handleScheduleChange(index, 'is_off_day', e.target.checked ? 0 : 1)}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-xs font-medium text-gray-700">{!schedule.is_off_day ? 'Working' : 'Off'}</span>
                                </label>
                            </div>
                            
                            <div className="col-span-3">
                                <input 
                                    type="time" 
                                    disabled={schedule.is_off_day}
                                    value={schedule.start_time || ''}
                                    onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                                    className="w-full rounded-lg border-gray-200 p-2 text-sm disabled:opacity-50 disabled:bg-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                />
                            </div>
                            
                            <div className="col-span-3">
                                <input 
                                    type="time" 
                                    disabled={schedule.is_off_day}
                                    value={schedule.end_time || ''}
                                    onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                                    className="w-full rounded-lg border-gray-200 p-2 text-sm disabled:opacity-50 disabled:bg-gray-100 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                />
                            </div>

                            <div className="col-span-1 pl-4 border-l">
                                <input 
                                    type="number" 
                                    disabled={schedule.is_off_day}
                                    value={schedule.slot_duration}
                                    onChange={(e) => handleScheduleChange(index, 'slot_duration', e.target.value)}
                                    className="w-full rounded-lg border-gray-200 p-2 text-sm disabled:opacity-50 disabled:bg-gray-100 text-center focus:ring-blue-500 focus:border-blue-500 outline-none" 
                                />
                            </div>
                        </div>
                    ))}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Saving...' : 'Save All Schedules'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

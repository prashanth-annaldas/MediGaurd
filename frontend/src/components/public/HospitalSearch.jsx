import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Activity, Navigation, Phone, Clock, ThumbsUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';
import AppointmentModal from './AppointmentModal';
import { Calendar } from 'lucide-react';

const HospitalSearch = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const user = useStore(state => state.user);
    const setSelectedHospital = useStore(state => state.setSelectedHospital);
    const [expandedHospitals, setExpandedHospitals] = useState({});
    const [bookingHospital, setBookingHospital] = useState(null);
    const navigate = useNavigate();

    const toggleExpansion = (id) => {
        setExpandedHospitals(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getSortedDoctors = (doctors) => {
        if (!doctors) return [];
        return [...doctors].sort((a, b) => {
            const expA = parseInt(a.experience) || 0;
            const expB = parseInt(b.experience) || 0;
            return expB - expA;
        });
    };

    useEffect(() => {
        fetchHospitals();
    }, [searchQuery, sortBy]);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}/api/hospitals?search=${searchQuery}&sort_by=${sortBy}`;
            const response = await fetch(url);
            const data = await response.json();
            setHospitals(data);
        } catch (error) {
            console.error("Error fetching hospitals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDirections = (hospital) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
        window.open(url, '_blank');
    };

    const handleAnalysis = (hospital) => {
        setSelectedHospital(hospital);
        navigate('/dashboard');
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <Layout title="Hospital Search">
            <div className="max-w-6xl mx-auto py-6 px-4">

                {/* Header Title */}
                <h1 className="text-2xl font-semibold text-[#1e293b] mb-4">
                    {loading ? 'Searching Hospitals...' : `Hospitals in Hyderabad`}
                </h1>

                <div className="border-b border-gray-200 mb-6"></div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, city or specialty..."
                            className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800 placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="rating">Best Rated</option>
                            <option value="resources">Most Available Beds</option>
                        </select>
                    </div>
                </div>

                {/* Hospital List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {hospitals.map((hospital) => {
                            const words = hospital.name.split(' ');
                            const half = Math.ceil(words.length / 2);
                            const line1 = words.slice(0, half).join(' ');
                            const line2 = words.slice(half).join(' ');
                            const sinceYear = 1950 + (hospital.id * 7) % 60;

                            const seed = hospital.id * 12345;
                            const hType = (hospital.specialties && hospital.specialties.length > 5) ? "Multi-speciality Hospital" : "Super-speciality Hospital";
                            const centersCount = (seed % 10) + 1;
                            const fee = `₹${hospital.fee_min} - ₹${hospital.fee_max}`;

                            const allDoctors = getSortedDoctors(hospital.doctors);
                            const isExpanded = expandedHospitals[hospital.id];
                            const visibleDoctors = isExpanded ? allDoctors : allDoctors.slice(0, 3);

                            return (
                                <div key={hospital.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">

                                    {/* Left: Logo container */}
                                    <div className="flex-shrink-0 w-32 h-32 rounded-lg border border-gray-100 flex items-center justify-center p-2 bg-white">
                                        <div className="text-center">
                                            <div className="text-[#e85a22] font-black text-4xl mb-1 tracking-tighter leading-none">{getInitials(hospital.name)}</div>
                                            <div className="font-bold text-[#1a1a1a] text-[10px] uppercase tracking-wide leading-tight break-words max-w-full">{line1}</div>
                                            {line2 && <div className="font-bold text-[#1a1a1a] text-[10px] uppercase tracking-wide leading-tight break-words max-w-full">{line2}</div>}
                                            <div className="text-[8px] text-gray-500 mt-1 uppercase">Since {sinceYear}</div>
                                        </div>
                                    </div>

                                    {/* Middle: Details */}
                                    <div className="flex-1 flex flex-col justify-start overflow-hidden">
                                        <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">{hospital.name}</h2>

                                        <div className="flex items-center text-sm text-gray-600 mb-2">
                                            <span>{hType}</span>
                                            <span className="mx-2 text-gray-300">•</span>
                                            <MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                                            <span>{hospital.city} and +{centersCount} centers</span>
                                        </div>

                                        <div className="text-sm font-semibold text-gray-800 mb-2">
                                            {fee} <span className="text-gray-500 font-normal">Consultation Fees</span>
                                        </div>

                                        <div className="flex items-center text-sm mb-4">
                                            <span className="font-semibold text-gray-800">{hospital.specialties ? hospital.specialties.length : 0} Specialities</span>
                                            <span className="mx-2 text-gray-300">•</span>
                                            <span className="font-semibold text-gray-800">{hospital.total_doctors} Doctors</span>
                                            <span className={`mx-4 text-xs font-medium flex items-center px-2 py-0.5 rounded-full border ${hospital.open_24x7 === 1 ? 'text-green-600 bg-green-50 border-green-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                                                <Clock className="w-3 h-3 mr-1" /> {hospital.open_24x7 === 1 ? 'Open 24x7' : 'Open 8am-10pm'}
                                            </span>
                                        </div>

                                        {/* Doctor Cards Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                            {visibleDoctors.map((doc, idx) => (
                                                <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm flex flex-col gap-2 min-h-[110px]">
                                                    <div className="flex gap-3">
                                                        <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-sm font-semibold text-gray-800 leading-tight truncate">{doc.name}</span>
                                                            <span className="text-[11px] text-gray-600 leading-tight mt-0.5 truncate">{doc.specialty}</span>
                                                            <span className="text-[11px] text-gray-500 mt-1">{doc.experience}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center mt-auto pt-2 text-[11px] text-gray-600">
                                                        <ThumbsUp className="w-3.5 h-3.5 text-green-500 mr-1 fill-green-500" />
                                                        {doc.stories}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Expansion Arrow below the grid */}
                                        {allDoctors.length > 3 && (
                                            <div className="flex justify-start mb-2">
                                                <button
                                                    onClick={() => toggleExpansion(hospital.id)}
                                                    className={`bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Action & Rating */}
                                    <div className="flex-shrink-0 w-full md:w-64 flex flex-col border-l border-gray-100 pl-6 md:mt-0 mt-4">
                                        <div className="flex items-center justify-end mb-8 space-x-2">
                                            <div className="flex items-center justify-center bg-[#22c55e] text-white px-2 py-1 rounded shadow-sm text-sm font-bold gap-1">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span>{hospital.rating}</span>
                                            </div>
                                            <div className="text-gray-500 text-sm whitespace-nowrap">
                                                ({hospital.rating_count} rated)
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 mt-auto">
                                            <button
                                                onClick={() => handleAnalysis(hospital)}
                                                className="w-full bg-[#1da1f2] hover:bg-[#1a90d9] text-white font-semibold py-2.5 px-4 rounded-md transition-colors text-sm"
                                            >
                                                Hospital analysis
                                            </button>
                                            <button
                                                onClick={() => setBookingHospital(hospital)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                                            >
                                                <Calendar className="w-4 h-4" /> Book Appointment
                                            </button>
                                            <button
                                                onClick={() => handleDirections(hospital)}
                                                className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold py-2.5 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                                            >
                                                Directions
                                            </button>
                                        </div>

                                        {/* Availability bar for context */}
                                        <div className="mt-4 border-t border-gray-100 pt-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">Bed Availability</span>
                                                <span className="font-semibold text-gray-700">{hospital.available_beds}/{hospital.total_beds}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${hospital.available_beds < (hospital.total_beds * 0.2) ? 'bg-red-500' : 'bg-green-500'}`}
                                                    style={{ width: `${(hospital.available_beds / hospital.total_beds) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && hospitals.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-400 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hospitals found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any hospitals matching your search criteria. Please try another keyword.</p>
                    </div>
                )}

                {bookingHospital && (
                    <AppointmentModal
                        hospital={bookingHospital}
                        onClose={() => setBookingHospital(null)}
                    />
                )}
            </div>
        </Layout>
    );
};

export default HospitalSearch;


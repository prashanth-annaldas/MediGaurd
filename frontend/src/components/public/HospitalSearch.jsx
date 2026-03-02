import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Activity, Navigation, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

const HospitalSearch = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const user = useStore(state => state.user);
    const setSelectedHospital = useStore(state => state.setSelectedHospital);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHospitals();
    }, [searchQuery, sortBy]);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const url = `http://localhost:8000/api/hospitals?search=${searchQuery}&sort_by=${sortBy}`;
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

    return (
        <Layout title="Hospital Search">
            <div className="max-w-7xl mx-auto py-2">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gradient mb-2">Find Hospitals</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Search and locate hospitals with real-time resource availability.</p>
                </header>

                {/* Search and Filters */}
                <div className="glass-card-static p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, city or specialty..."
                            className="w-full pl-10 pr-4 py-2 bg-transparent border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--teal-strong)] transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-sm rounded-lg focus:ring-[var(--teal-strong)] focus:border-[var(--teal-strong)] block w-full p-2.5 outline-none"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="rating">Best Rated</option>
                            <option value="resources">Most Available Beds</option>
                        </select>
                    </div>
                </div>

                {/* Hospital Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--teal-strong)]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hospitals.map((hospital) => (
                            <div key={hospital.id} className="glass-card overflow-hidden group">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--teal-strong)] transition-colors">{hospital.name}</h3>
                                            <div className="flex items-center text-[var(--text-secondary)] text-sm mt-1">
                                                <MapPin className="w-4 h-4 mr-1 text-[var(--text-muted)]" />
                                                {hospital.city}
                                            </div>
                                        </div>
                                        <div className="flex items-center bg-[var(--amber-glow)] text-amber-500 px-2 py-1 rounded-lg font-semibold text-sm border border-[var(--border-color)]">
                                            <Star className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" />
                                            {hospital.rating}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--text-secondary)] flex items-center">
                                                <Activity className="w-4 h-4 mr-1.5 text-[var(--teal-strong)]" />
                                                Available Beds
                                            </span>
                                            <span className="font-semibold text-[var(--text-primary)] ticker">{hospital.available_beds} / {hospital.total_beds}</span>
                                        </div>
                                        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-500 ${hospital.available_beds < (hospital.total_beds * 0.2) ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[var(--teal-strong)]'}`}
                                                style={{ width: `${(hospital.available_beds / hospital.total_beds) * 100}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {hospital.specialties.map((spec, i) => (
                                                <span key={i} className="text-[10px] uppercase tracking-wider font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <button
                                            onClick={() => handleDirections(hospital)}
                                            className="btn-ghost"
                                        >
                                            <Navigation className="w-4 h-4 mr-2" />
                                            Directions
                                        </button>
                                        <button
                                            onClick={() => handleAnalysis(hospital)}
                                            className="btn-primary"
                                        >
                                            <Activity className="w-4 h-4 mr-2" />
                                            Analysis
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && hospitals.length === 0 && (
                    <div className="text-center py-20 glass-card border-2 border-dashed">
                        <div className="bg-[var(--bg-secondary)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                            <Search className="text-[var(--text-muted)] w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No hospitals found</h3>
                        <p className="text-[var(--text-secondary)] max-w-xs mx-auto">We couldn't find any hospitals matching your search criteria. Please try another keyword.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default HospitalSearch;

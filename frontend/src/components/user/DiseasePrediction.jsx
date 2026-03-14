import React, { useState, useEffect } from 'react';
import { Activity, Search, AlertCircle, CheckCircle, Loader2, X, Plus } from 'lucide-react';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';

export default function DiseasePrediction() {
    const [allSymptoms, setAllSymptoms] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingSymptoms, setFetchingSymptoms] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useStore();

    useEffect(() => {
        fetchSymptoms();
    }, []);

    const fetchSymptoms = async () => {
        try {
            const res = await fetch('/api/symptoms');
            if (!res.ok) throw new Error('Failed to fetch symptom list');
            const data = await res.json();
            setAllSymptoms(data.symptoms.sort());
        } catch (err) {
            console.error(err);
            setError("Could not load symptoms list. Please try again later.");
        } finally {
            setFetchingSymptoms(false);
        }
    };

    const handlePredict = async (e) => {
        if (e) e.preventDefault();
        if (selectedSymptoms.length === 0) return;

        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ symptoms: selectedSymptoms })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Prediction failed');
            }

            const data = await res.json();
            setPrediction(data.prediction);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSymptom = (symptom) => {
        if (selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
        } else {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
        setSearchQuery('');
        setPrediction(null);
    };

    const filteredSymptoms = allSymptoms.filter(s => 
        s.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !selectedSymptoms.includes(s)
    ).slice(0, 10);

    return (
        <Layout title="AI Disease Prediction">
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">AI-Powered Disease Prediction</h1>
                    <p className="text-[var(--text-muted)] text-sm">
                        Select your symptoms from the list below and our machine learning model will analyze them.
                    </p>
                </div>

                <div className="glass-card p-8 shadow-2xl">
                    <div className="space-y-6">
                        {/* Selected Symptoms Area */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                                Your Selected Symptoms ({selectedSymptoms.length})
                            </label>
                            <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-navy-900/30 rounded-2xl border border-navy-700/50">
                                {selectedSymptoms.length === 0 ? (
                                    <p className="text-gray-600 text-sm italic py-1">No symptoms selected yet. Use the search below to add symptoms.</p>
                                ) : (
                                    selectedSymptoms.map(s => (
                                        <span 
                                            key={s} 
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg text-sm font-medium animate-in zoom-in-95 duration-200"
                                        >
                                            {s}
                                            <X 
                                                size={14} 
                                                className="cursor-pointer hover:text-white transition-colors" 
                                                onClick={() => toggleSymptom(s)}
                                            />
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Search and Suggestions */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Search Symptoms
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Type to search (e.g. fever, cough...)"
                                    className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all placeholder:text-gray-600"
                                    disabled={fetchingSymptoms}
                                />
                                {fetchingSymptoms && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500 animate-spin" />
                                )}
                            </div>

                            {/* Dropdown Suggestions */}
                            {searchQuery && filteredSymptoms.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredSymptoms.map(s => (
                                        <div 
                                            key={s}
                                            onClick={() => toggleSymptom(s)}
                                            className="px-6 py-3 hover:bg-teal-500/10 cursor-pointer text-[var(--text-primary)] flex justify-between items-center transition-colors group"
                                        >
                                            <span>{s}</span>
                                            <Plus size={16} className="text-gray-600 group-hover:text-teal-400 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchQuery && filteredSymptoms.length === 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-navy-900 border border-navy-700 rounded-2xl p-4 text-[var(--text-muted)] text-sm shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    No matching symptoms found in our medical database.
                                </div>
                            )}
                        </div>

                        {/* Common Quick Suggestions */}
                        {!searchQuery && selectedSymptoms.length < 5 && (
                            <div className="animate-in fade-in duration-500">
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Popular Symptoms</p>
                                <div className="flex flex-wrap gap-2">
                                    {['fever', 'cough', 'headache', 'fatigue', 'chest pain', 'shortness of breath'].map(s => (
                                        !selectedSymptoms.includes(s) && (
                                            <button
                                                key={s}
                                                onClick={() => toggleSymptom(s)}
                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-[var(--text-secondary)] transition-all hover:border-teal-500/30"
                                            >
                                                + {s}
                                            </button>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePredict}
                            disabled={loading || selectedSymptoms.length === 0}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] disabled:opacity-50 flex items-center justify-center gap-2 text-lg mt-8"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />}
                            {loading ? 'Analyzing Symptoms...' : 'Analyze & Predict'}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {prediction && (
                        <div className="mt-8 p-8 bg-teal-500/10 border border-teal-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-4 text-teal-400">
                                <CheckCircle className="w-8 h-8" />
                                <h2 className="text-2xl font-bold">Prediction Result</h2>
                            </div>
                            <div className="bg-navy-900/50 p-6 rounded-xl border border-teal-500/20">
                                <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest mb-1">Most Likely Condition</p>
                                <p className="text-4xl font-black text-white">{prediction}</p>
                            </div>
                            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-500 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>
                                    <strong>Disclaimer:</strong> This is an AI prediction for educational purposes and is not a medical diagnosis. Please consult a qualified doctor for professional medical advice.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

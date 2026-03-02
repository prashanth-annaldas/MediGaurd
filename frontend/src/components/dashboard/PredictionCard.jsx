import React, { useEffect, useState } from 'react'
import { Brain, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import useStore from '../../store/useStore'

export default function PredictionCard() {
    const { predictionData, fetchPrediction, resources } = useStore()
    const [loading, setLoading] = useState(false)

    const handlePredict = async () => {
        setLoading(true)
        // Gather stats from current resources if available, or send defaults which backend can handle
        // Using sample mapping based on what we have in resources
        const beds = resources.find(r => r.id === 'beds') || { capacity: 500, utilization: 70 }
        const icu = resources.find(r => r.id === 'icu_beds') || { capacity: 120, utilization: 80 }
        const vents = resources.find(r => r.id === 'ventilators') || { capacity: 80, utilization: 60 }

        const payload = {
            Total_Beds: beds.capacity,
            Available_Beds: beds.capacity * (1 - beds.utilization / 100),
            ICU_Total: icu.capacity,
            ICU_Available: icu.capacity * (1 - icu.utilization / 100),
            Ventilators_Total: vents.capacity,
            Ventilators_Available: vents.capacity * (1 - vents.utilization / 100),
            Staff_On_Duty: 150, // rough estimate
            Daily_Admissions: 120,
            Emergency_Admissions: 45,
            Scheduled_Admissions: 75,
            Bed_Occupancy_Rate: beds.utilization,
            ICU_Occupancy_Rate: icu.utilization,
            Ventilator_Utilization_Rate: vents.utilization
        }

        await fetchPrediction(payload)
        setLoading(false)
    }

    // Auto-predict on mount
    useEffect(() => {
        if (!predictionData && resources.length > 0) {
            handlePredict()
        }
    }, [resources.length])

    return (
        <div className="glass-card-static p-5 flex flex-col h-full w-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 0 12px rgba(139,92,246,0.4)' }}>
                    <Activity size={16} color="white" />
                </div>
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ML Predictive Analytics</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Random Forest Model Assessment</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
                {predictionData ? (
                    <div className="p-4 rounded-xl text-center flex flex-col items-center" style={{
                        background: predictionData.shortage_predicted ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        border: `1px solid ${predictionData.shortage_predicted ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`
                    }}>
                        {predictionData.shortage_predicted ? (
                            <AlertTriangle size={32} color="#ef4444" className="mb-2 animate-pulse" />
                        ) : (
                            <CheckCircle size={32} color="#22c55e" className="mb-2" />
                        )}
                        <p className="font-bold text-lg" style={{ color: predictionData.shortage_predicted ? '#ef4444' : '#22c55e' }}>
                            {predictionData.shortage_predicted ? 'Shortage Highly Likely' : 'Capacity Stable'}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                            Probability: <span className="font-mono">{(predictionData.shortage_probability * 100).toFixed(1)}%</span>
                        </p>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Awaiting model analysis...</p>
                    </div>
                )}
            </div>

            <button
                onClick={handlePredict}
                disabled={loading}
                className="btn-primary mt-4 w-full justify-center text-xs"
                style={{ background: 'rgba(139,92,246,0.8)', borderColor: '#8b5cf6' }}>
                <Brain size={13} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Analyzing...' : 'Run Prediction Model'}
            </button>
        </div>
    )
}

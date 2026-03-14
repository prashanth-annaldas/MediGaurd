import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, BedDouble, User, Phone, Heart, AlertCircle, LogIn, LogOut } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'

export default function BedDetail() {
    const { qrCode } = useParams()
    const [bed, setBed] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [toggling, setToggling] = useState(false)
    const [actionMsg, setActionMsg] = useState(null)

    const fetchBed = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/beds/qr/${qrCode}`)
            if (!res.ok) throw new Error('Bed not found')
            const data = await res.json()
            setBed(data)
            setError(null)
        } catch (e) {
            setError(e.message)
        }
        setLoading(false)
    }, [qrCode])

    useEffect(() => { fetchBed() }, [fetchBed])

    const handleToggle = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            setActionMsg('⚠️ Please log in as staff to perform this action.')
            return
        }
        setToggling(true)
        setActionMsg(null)
        try {
            const res = await fetch(`${API}/api/beds/${bed.id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({}),
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || 'Action failed')
            }
            const result = await res.json()
            setActionMsg(`✅ ${result.message}`)
            await fetchBed() // refresh bed data
        } catch (e) {
            setActionMsg(`❌ ${e.message}`)
        }
        setToggling(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary, #0f172a)' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: '#14b8a6' }} />
            </div>
        )
    }

    if (error || !bed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: 'var(--bg-primary, #0f172a)' }}>
                <AlertCircle size={48} style={{ color: '#ef4444' }} />
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary, white)' }}>Bed Not Found</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted, #94a3b8)' }}>{error || 'Invalid QR code'}</p>
                <Link to="/login" className="text-sm underline" style={{ color: '#14b8a6' }}>Go to Login</Link>
            </div>
        )
    }

    const patient = bed.patient_details

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary, #0f172a)' }}>
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{
                            background: bed.is_occupied ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                            border: `2px solid ${bed.is_occupied ? '#ef4444' : '#22c55e'}`,
                        }}
                    >
                        <BedDouble size={28} style={{ color: bed.is_occupied ? '#ef4444' : '#22c55e' }} />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary, white)' }}>{bed.bed_number}</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                        {bed.hospital_name} · {bed.bed_type.toUpperCase()}
                    </p>
                    <span
                        className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold"
                        style={{
                            background: bed.is_occupied ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                            color: bed.is_occupied ? '#ef4444' : '#22c55e',
                        }}
                    >
                        {bed.is_occupied ? '● Occupied' : '● Vacant'}
                    </span>
                </div>

                {/* Patient Info */}
                {bed.is_occupied && patient ? (
                    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary, white)' }}>
                            Patient Information
                        </h2>
                        <div className="space-y-3">
                            {[
                                { icon: User, label: 'Name', value: patient.full_name },
                                { icon: User, label: 'Age / Gender', value: `${patient.age || '—'} / ${patient.gender || '—'}` },
                                { icon: Phone, label: 'Phone', value: patient.phone || '—' },
                                { icon: Heart, label: 'Blood Group', value: patient.blood_group || '—' },
                                { icon: Phone, label: 'Emergency Contact', value: patient.emergency_contact || '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                                    <Icon size={14} style={{ color: 'var(--text-muted, #94a3b8)' }} />
                                    <span className="text-xs" style={{ color: 'var(--text-muted, #94a3b8)', minWidth: 100 }}>{label}</span>
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary, white)' }}>{value}</span>
                                </div>
                            ))}
                            {patient.medical_history && (
                                <div className="pt-2">
                                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted, #94a3b8)' }}>Medical History</p>
                                    <p className="text-sm p-3 rounded-lg" style={{ background: 'var(--bg-card, #0f172a)', color: 'var(--text-primary, white)' }}>
                                        {patient.medical_history}
                                    </p>
                                </div>
                            )}
                        </div>
                        {bed.admitted_at && (
                            <p className="text-xs pt-2" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                                Admitted: {new Date(bed.admitted_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                ) : bed.is_occupied ? (
                    <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                            This bed is occupied but no patient details are linked.
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                            Patient: {bed.patient_name || 'Unknown'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-secondary, #1e293b)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                            This bed is currently available
                        </p>
                    </div>
                )}

                {/* Admit / Discharge Button */}
                <div className="text-center space-y-3">
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 32px',
                            borderRadius: 12,
                            border: 'none',
                            cursor: toggling ? 'wait' : 'pointer',
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#fff',
                            background: bed.is_occupied
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                            boxShadow: bed.is_occupied
                                ? '0 4px 14px rgba(239,68,68,0.35)'
                                : '0 4px 14px rgba(34,197,94,0.35)',
                            opacity: toggling ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {toggling ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : bed.is_occupied ? (
                            <LogOut size={18} />
                        ) : (
                            <LogIn size={18} />
                        )}
                        {toggling
                            ? 'Processing…'
                            : bed.is_occupied
                                ? 'Discharge Patient'
                                : 'Admit Patient'}
                    </button>

                    {actionMsg && (
                        <p className="text-sm" style={{
                            color: actionMsg.startsWith('✅') ? '#22c55e'
                                : actionMsg.startsWith('❌') ? '#ef4444'
                                    : '#f59e0b'
                        }}>
                            {actionMsg}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

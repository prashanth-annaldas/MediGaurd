import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Plus, QrCode, User, X } from 'lucide-react'
import Layout from '../layout/Layout'
import useStore from '../../store/useStore'
import QRCode from 'react-qr-code'
import QRScanner from '../ui/QRScanner'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'

const TYPE_COLORS = {
    general: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', label: 'General' },
    icu: { bg: 'rgba(234,179,8,0.12)', border: '#eab308', label: 'ICU' },
    ventilator: { bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6', label: 'Ventilator' },
}

function BedCard({ bed, token, onRefresh, patients }) {
    const [showQR, setShowQR] = useState(false)
    const [toggling, setToggling] = useState(false)
    const [showAssign, setShowAssign] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState('')
    const typeStyle = TYPE_COLORS[bed.bed_type] || TYPE_COLORS.general

    const handleToggle = async () => {
        setToggling(true)
        try {
            await fetch(`${API}/api/beds/${bed.id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({}),
            })
            onRefresh()
        } catch (e) {
            console.error(e)
        }
        setToggling(false)
    }

    const handleAssign = async () => {
        if (!selectedPatient) return
        const patient = patients.find(p => p.full_name === selectedPatient)
        try {
            await fetch(`${API}/api/beds/${bed.id}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ patient_name: selectedPatient, patient_id: patient?.id || null }),
            })
            setShowAssign(false)
            setSelectedPatient('')
            onRefresh()
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div
            className="relative rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
            style={{
                background: 'var(--bg-secondary)',
                border: `1px solid ${bed.is_occupied ? '#ef4444' : '#22c55e'}`,
                boxShadow: bed.is_occupied
                    ? '0 0 12px rgba(239,68,68,0.15)'
                    : '0 0 12px rgba(34,197,94,0.10)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {bed.bed_number}
                    </span>
                    <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: typeStyle.bg, color: typeStyle.border, border: `1px solid ${typeStyle.border}40` }}
                    >
                        {typeStyle.label}
                    </span>
                </div>
                <button
                    onClick={() => setShowQR(!showQR)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Show QR Code"
                >
                    <QrCode size={14} />
                </button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: bed.is_occupied ? '#ef4444' : '#22c55e' }}
                />
                <span className="text-xs font-medium" style={{ color: bed.is_occupied ? '#ef4444' : '#22c55e' }}>
                    {bed.is_occupied ? 'Occupied' : 'Vacant'}
                </span>
            </div>

            {/* Patient info */}
            {!!bed.is_occupied && bed.patient_name && (
                <div className="mb-3 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-2">
                        <User size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {bed.patient_name}
                        </span>
                    </div>
                    {bed.admitted_at && (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            Admitted: {new Date(bed.admitted_at).toLocaleString()}
                        </p>
                    )}
                </div>
            )}

            {/* QR Code popup */}
            {showQR && (
                <div className="mb-3 p-3 rounded-lg flex flex-col items-center gap-2" style={{ background: 'white' }}>
                    <QRCode value={`${window.location.origin}/bed/${bed.qr_code}`} size={120} />
                    <p className="text-[10px] text-gray-500 text-center break-all">{bed.qr_code}</p>
                </div>
            )}

            {/* Assign patient */}
            {showAssign && !bed.is_occupied && (
                <div className="mb-3 p-2 rounded-lg space-y-2" style={{ background: 'var(--bg-card)' }}>
                    <select
                        value={selectedPatient}
                        onChange={e => setSelectedPatient(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                        <option value="">Select patient...</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.full_name}>{p.full_name}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAssign}
                            disabled={!selectedPatient}
                            className="flex-1 text-xs py-1 rounded-lg font-medium transition-colors"
                            style={{
                                background: selectedPatient ? '#22c55e' : 'var(--bg-secondary)',
                                color: selectedPatient ? 'white' : 'var(--text-muted)',
                                cursor: selectedPatient ? 'pointer' : 'not-allowed',
                            }}
                        >
                            Assign
                        </button>
                        <button
                            onClick={() => setShowAssign(false)}
                            className="text-xs py-1 px-3 rounded-lg"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className="flex-1 text-xs py-2 rounded-lg font-semibold transition-all"
                    style={{
                        background: bed.is_occupied
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        color: bed.is_occupied ? '#22c55e' : '#ef4444',
                        border: `1px solid ${bed.is_occupied ? '#22c55e' : '#ef4444'}30`,
                        cursor: 'pointer',
                    }}
                >
                    {toggling ? '...' : bed.is_occupied ? 'Discharge' : 'Mark Occupied'}
                </button>
                {!bed.is_occupied && (
                    <button
                        onClick={() => setShowAssign(!showAssign)}
                        className="text-xs py-2 px-3 rounded-lg font-medium transition-all"
                        style={{
                            background: 'rgba(59,130,246,0.12)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59,130,246,0.3)',
                            cursor: 'pointer',
                        }}
                    >
                        Assign
                    </button>
                )}
            </div>
        </div>
    )
}

export default function BedManagement() {
    const { token, addToast } = useStore()
    const [beds, setBeds] = useState([])
    const [patients, setPatients] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [filter, setFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showScanner, setShowScanner] = useState(false)
    const navigate = useNavigate()

    const handleScanSuccess = (decodedText) => {
        const bedMatch = decodedText.match(/\/bed\/(.+)$/)
        if (bedMatch) {
            navigate(`/bed/${bedMatch[1]}`)
        } else {
            addToast({ type: 'error', title: 'Invalid QR', message: 'This is not a valid bed QR code.' })
        }
        setShowScanner(false)
    }

    const fetchBeds = useCallback(async () => {
        setError(null)
        try {
            const res = await fetch(`${API}/api/beds`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setBeds(data)
            } else {
                const errData = await res.json().catch(() => ({}))
                console.error('Beds API error:', res.status, errData)
                setError(errData.detail || `Failed to load beds (${res.status})`)
            }
        } catch (e) {
            console.error('Failed to fetch beds', e)
            setError('Cannot connect to the server. Make sure the backend is running.')
        } finally {
            setLoading(false)
        }
    }, [token])

    const fetchPatients = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/patients`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setPatients(Array.isArray(data) ? data : data.patients || [])
            }
        } catch (e) {
            console.error('Failed to fetch patients', e)
        }
    }, [token])

    useEffect(() => {
        fetchBeds()
        fetchPatients()
    }, [fetchBeds, fetchPatients])

    const handleSeed = async () => {
        setSeeding(true)
        try {
            const res = await fetch(`${API}/api/beds/seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (res.ok) {
                addToast({ type: 'success', title: 'Beds Seeded', message: data.message })
                fetchBeds()
            } else {
                addToast({ type: 'error', title: 'Seed Failed', message: data.detail || 'Error' })
            }
        } catch (e) {
            addToast({ type: 'error', title: 'Error', message: e.message })
        }
        setSeeding(false)
    }

    const filtered = beds.filter(b => {
        if (filter !== 'all' && b.bed_type !== filter) return false
        if (statusFilter === 'occupied' && !b.is_occupied) return false
        if (statusFilter === 'vacant' && b.is_occupied) return false
        return true
    })

    const totalBeds = beds.length
    const occupiedBeds = beds.filter(b => b.is_occupied).length
    const vacantBeds = totalBeds - occupiedBeds

    return (
        <Layout title="Bed Management">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Bed Management
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Manage individual beds, assign patients, and scan QR codes
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowScanner(!showScanner)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                            <QrCode size={13} /> Scan QR
                        </button>
                        <button
                            onClick={fetchBeds}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                        {beds.length === 0 && (
                            <button
                                onClick={handleSeed}
                                disabled={seeding}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                    background: 'linear-gradient(135deg,#14b8a6,#0891b2)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    opacity: seeding ? 0.6 : 1,
                                }}
                            >
                                {seeding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                {seeding ? 'Seeding...' : 'Generate Beds'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Built-in Scanner */}
                {showScanner && (
                    <div className="rounded-xl overflow-hidden glass-card p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                            <h3 className="font-bold text-[var(--text-primary)]">Scan Bed QR Code</h3>
                            <button onClick={() => setShowScanner(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <QRScanner onScanSuccess={handleScanSuccess} />
                    </div>
                )}

                {/* Stats — only show when beds exist */}
                {beds.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalBeds}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Resources</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{occupiedBeds}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Occupied</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{vacantBeds}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Available</p>
                        </div>
                    </div>
                )}

                {/* Status Filter */}
                {beds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'occupied', 'vacant'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                                style={{
                                    background: statusFilter === s ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                    border: `1px solid ${statusFilter === s ? (s === 'occupied' ? '#ef4444' : s === 'vacant' ? '#22c55e' : 'var(--border-hover)') : 'var(--border-color)'}`,
                                    color: statusFilter === s ? (s === 'occupied' ? '#ef4444' : s === 'vacant' ? '#22c55e' : 'var(--text-primary)') : 'var(--text-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Bed Sections grouped by type */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--teal-strong)' }} />
                    </div>
                ) : error ? (
                    <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <p className="text-lg font-semibold mb-2" style={{ color: '#ef4444' }}>Failed to load beds</p>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
                        <button onClick={fetchBeds} className="px-4 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            Try Again
                        </button>
                    </div>
                ) : beds.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No beds created yet</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Click "Generate Beds" to auto-create beds from your hospital capacity.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {[
                            { type: 'general', title: 'General Beds', color: '#22c55e' },
                            { type: 'icu', title: 'ICU Beds', color: '#eab308' },
                            { type: 'ventilator', title: 'Ventilator Beds', color: '#8b5cf6' },
                        ].map(({ type, title, color }) => {
                            const sectionBeds = filtered.filter(b => b.bed_type === type)
                            if (sectionBeds.length === 0) return null
                            const sectionOccupied = sectionBeds.filter(b => b.is_occupied).length
                            return (
                                <div key={type}>
                                    <div className="flex items-center gap-3 mb-4 pl-3" style={{ borderLeft: `3px solid ${color}` }}>
                                        <div>
                                            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {sectionOccupied} occupied · {sectionBeds.length - sectionOccupied} available · {sectionBeds.length} total
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {sectionBeds.map(bed => (
                                            <BedCard key={bed.id} bed={bed} token={token} onRefresh={fetchBeds} patients={patients} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}

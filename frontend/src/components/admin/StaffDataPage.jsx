import React, { useState, useEffect } from 'react'
import { Users, Trash2, Plus, Loader2, AlertCircle, Save } from 'lucide-react'
import Layout from '../layout/Layout'
import useStore from '../../store/useStore'

export default function StaffDataPage() {
    const { user, token } = useStore()
    const [staffList, setStaffList] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ name: '', profession: '', qualifications: '' })

    const fetchStaff = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/staff', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch staff data')
            const data = await res.json()
            setStaffList(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchStaff()
    }, [token])

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return
        try {
            setActionLoading(true)
            const res = await fetch(`/api/admin/staff/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error('Failed to delete staff member')
            setStaffList(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            alert(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setActionLoading(true)
            const res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('Failed to add staff member')
            const newStaff = await res.json()
            setStaffList(prev => [...prev, newStaff])
            setFormData({ name: '', profession: '', qualifications: '' })
            setShowForm(false)
        } catch (err) {
            alert(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <Layout title="Staff Data">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gradient mb-1">Hospital Staff Directory</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage personnel records and administrative clearances</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                >
                    <Plus size={16} /> Add Staff
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-alert-critical/10 border border-alert-critical/20 rounded-xl flex items-start gap-3 text-alert-critical text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Failed to load staff records</p>
                        <p className="opacity-80">{error}</p>
                    </div>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 bg-[var(--bg-secondary)] border border-navy-700 p-5 rounded-2xl shadow-xl animate-fade-in">
                    <h3 className="font-semibold text-teal-400 mb-4 flex items-center gap-2">
                        <Users size={16} /> New Staff Member Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1 block mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                placeholder="Dr. John Doe"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1 block mb-1">Profession</label>
                            <input
                                type="text"
                                required
                                value={formData.profession}
                                onChange={e => setFormData({ ...formData, profession: e.target.value })}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                placeholder="e.g. Cardiologist"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--text-muted)] ml-1 block mb-1">Qualifications</label>
                            <input
                                type="text"
                                required
                                value={formData.qualifications}
                                onChange={e => setFormData({ ...formData, qualifications: e.target.value })}
                                className="w-full bg-[var(--bg-card)]/50 border border-navy-700 text-[var(--text-primary)] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                placeholder="e.g. MD, FACC"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors text-[var(--text-muted)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Profile
                        </button>
                    </div>
                </form>
            )}

            <div className="glass-card-static overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center text-teal-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : staffList.length === 0 ? (
                    <div className="p-12 text-center text-[var(--text-muted)]">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No staff records found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(45,212,191,0.1)' }}>
                                <th className="px-5 py-4 text-left font-semibold text-[var(--text-muted)]">Name</th>
                                <th className="px-5 py-4 text-left font-semibold text-[var(--text-muted)]">Profession</th>
                                <th className="px-5 py-4 text-left font-semibold text-[var(--text-muted)]">Qualifications</th>
                                <th className="px-5 py-4 text-right font-semibold text-[var(--text-muted)] w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map((staff, i) => (
                                <tr
                                    key={staff.id}
                                    style={{ borderBottom: i < staffList.length - 1 ? '1px solid rgba(45,212,191,0.06)' : 'none' }}
                                    className="transition-colors hover:bg-white/5"
                                >
                                    <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold shrink-0">
                                                {staff.name.charAt(0)}
                                            </div>
                                            {staff.name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-[var(--text-secondary)]">{staff.profession}</td>
                                    <td className="px-5 py-4">
                                        <span className="px-2 py-1 rounded bg-navy-800 border border-navy-700 text-xs text-[var(--text-muted)]">
                                            {staff.qualifications}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(staff.id)}
                                            disabled={actionLoading}
                                            className="p-2 text-alert-critical/70 hover:text-alert-critical hover:bg-alert-critical/10 rounded-lg transition-colors disabled:opacity-50"
                                            title="Remove Staff Record"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    )
}

import React, { useState } from 'react';
import QRScanner from '../ui/QRScanner';
import Layout from '../layout/Layout';
import useStore from '../../store/useStore';
import { UserMinus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DischargePatient() {
    const [status, setStatus] = useState('idle'); // 'idle', 'scanning', 'processing', 'success', 'error'
    const [message, setMessage] = useState('');
    const { token, refreshData } = useStore();

    const handleScanSuccess = async (decodedText) => {
        if (status === 'processing') return;

        setStatus('processing');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/hospitals/discharge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qr_data: decodedText })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage(data.message);
                await refreshData();
            } else {
                setStatus('error');
                setMessage(data.detail || 'Failed to discharge patient');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error during discharge');
        }
    };

    return (
        <Layout title="Patient Discharge">
            <div className="max-w-2xl mx-auto py-8">
                <div className="glass-card p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-teal-500/10 rounded-2xl text-teal-400">
                            <UserMinus size={48} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Scan Discharge QR</h1>
                    <p className="text-[var(--text-muted)]">Scan the patient's logout QR code to record their discharge and update bed occupancy.</p>

                    {status === 'idle' || status === 'scanning' ? (
                        <div className="mt-8">
                            <QRScanner onScanSuccess={handleScanSuccess} />
                        </div>
                    ) : (
                        <div className={`mt-8 p-6 rounded-2xl border ${status === 'success' ? 'bg-teal-500/10 border-teal-500/30' :
                            status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                'bg-navy-800 border-navy-700'
                            }`}>
                            {status === 'processing' && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                                    <p className="text-[var(--text-primary)]">Processing discharge...</p>
                                </div>
                            )}
                            {status === 'success' && (
                                <div className="flex flex-col items-center gap-4">
                                    <CheckCircle className="w-8 h-8 text-teal-400" />
                                    <p className="text-teal-400 font-bold">{message}</p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="btn-primary mt-2"
                                    >
                                        Scan Next
                                    </button>
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="flex flex-col items-center gap-4">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                    <p className="text-red-400 font-bold">{message}</p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="btn-secondary mt-2"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../layout/Layout';
import { Download, Printer, Copy, Check } from 'lucide-react';

export default function QRGenerator() {
    const [patientId, setPatientId] = useState('P-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(patientId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Layout title="Patient QR Generator">
            <div className="max-w-4xl mx-auto py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Generator Controls */}
                    <div className="glass-card p-8 space-y-6">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Generator Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Patient ID / QR Data</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}
                                        className="w-full rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        style={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderColor: 'var(--border-color)',
                                            borderWidth: '1px'
                                        }}
                                        placeholder="Enter patient ID..."
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-teal-400 transition-colors"
                                    >
                                        {copied ? <Check size={18} className="text-teal-400" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button
                                    onClick={() => setPatientId('P-' + Math.random().toString(36).substr(2, 9).toUpperCase())}
                                    className="w-full btn-secondary py-3"
                                >
                                    Generate New ID
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    <Printer size={18} />
                                    Print QR Code
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                            <p className="text-xs text-teal-400/80 leading-relaxed">
                                <strong>Tip:</strong> Use these QR codes for testing. The <strong>Admit</strong> scanner accepts any code,
                                and the <strong>Discharge</strong> scanner accepts the same code to release the bed.
                            </p>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="glass-card p-8 flex flex-col items-center justify-center space-y-6 text-center bg-white print:bg-white print:p-0 print:shadow-none">
                        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 print:border-none print:shadow-none">
                            <QRCodeSVG
                                value={patientId}
                                size={220}
                                level="H"
                                includeMargin={true}
                                className="print:w-64 print:h-64"
                            />
                        </div>
                        <div className="space-y-2 print:mt-4">
                            <p className="text-2xl font-bold text-gray-900">{patientId}</p>
                            <p className="text-sm text-gray-500">Scan for Admission / Discharge</p>
                            <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest text-teal-600 border-2 border-teal-600 px-4 py-1 rounded-full">
                                MedGuard Verified
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
                    .print\\:bg-white { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        height: 100%;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        background: white !important;
                    }
                }
            `}} />
        </Layout>
    );
}

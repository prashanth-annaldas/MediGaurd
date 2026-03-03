import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess, onScanError, fps = 10, qrbox = 250 }) {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: fps,
                qrbox: qrbox,
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
            },
            /* verbose= */ false
        );

        const internalOnScanError = (error) => {
            // Suppress common 'not found' noisy logs
            if (error?.includes("No MultiFormat Readers") || error?.includes("NotFoundException")) {
                return;
            }
            if (onScanError) onScanError(error);
        };

        scanner.render(onScanSuccess, internalOnScanError);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []);

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-navy-700 bg-[var(--bg-secondary)] shadow-2xl">
            <div id="reader" className="w-full"></div>
            <div className="p-4 bg-navy-900/50 text-center">
                <p className="text-xs text-[var(--text-muted)]">Align QR code within the frame to scan</p>
            </div>
        </div>
    );
}

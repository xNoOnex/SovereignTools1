import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Using SVG for infinite sharpness

export function SovereignQR({ onNavigate }) {
    const [qrType, setQrType] = useState('text');
    const [qrData, setQrData] = useState('');

    const generatePayload = () => {
        switch (qrType) {
            case 'wifi':
                return `WIFI:T:WPA;S:${qrData.ssid};P:${qrData.password};;`;
            case 'crypto':
                return `${qrData.coin}:${qrData.address}`;
            default:
                return qrData;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-5 pb-24 font-sans select-none overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                        <span className="text-cyan-500">❖</span> Pro Generator
                    </h1>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">High-Fidelity Optical Payloads</p>
                </div>
                <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all">
                    Exit
                </button>
            </div>

            {/* Input Controls */}
            <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <select 
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500"
                    onChange={(e) => setQrType(e.target.value)}
                >
                    <option value="text">Raw Text / URL</option>
                    <option value="wifi">WiFi Network</option>
                    <option value="crypto">Crypto Address</option>
                </select>

                <textarea
                    placeholder="Enter payload data..."
                    className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                    onChange={(e) => setQrData(e.target.value)}
                />
            </div>

            {/* Sharp SVG Render Area */}
            {qrData && (
                <div className="mt-8 flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-2xl border border-emerald-900/50">
                    <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <QRCodeSVG 
                            value={generatePayload()} 
                            size={256} 
                            level={"H"} // High error correction for screen scanning
                            includeMargin={true}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 mt-4 tracking-widest uppercase animate-pulse">
                        Payload Ready for Scan
                    </span>
                </div>
            )}
        </div>
    );
}

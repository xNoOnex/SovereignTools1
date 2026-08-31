import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function SovereignQR({ onNavigate }) {
    const [qrType, setQrType] = useState('text');
    const [qrData, setQrData] = useState({ text: '', ssid: '', pass: '', phone: '', msg: '', email: '', lat: '', lng: '', name: '' });

    const updateData = (field, value) => setQrData(prev => ({ ...prev, [field]: value }));

    const generatePayload = () => {
        switch (qrType) {
            case 'wifi': return `WIFI:T:WPA;S:${qrData.ssid};P:${qrData.pass};;`;
            case 'sms': return `SMSTO:${qrData.phone}:${qrData.msg}`;
            case 'geo': return `geo:${qrData.lat},${qrData.lng}`;
            case 'contact': return `MECARD:N:${qrData.name};TEL:${qrData.phone};EMAIL:${qrData.email};;`;
            case 'phone': return `tel:${qrData.phone}`;
            case 'email': return `mailto:${qrData.email}`;
            default: return qrData.text;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-5 pb-24 font-sans select-none overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-wide flex items-center gap-2"><span className="text-cyan-500">❖</span> Pro Generator</h1>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">High-Fidelity Optical Payloads</p>
                </div>
                <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all">Exit</button>
            </div>

            <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500" onChange={(e) => setQrType(e.target.value)}>
                    <option value="text">Raw Text / URL</option>
                    <option value="wifi">WiFi Network</option>
                    <option value="sms">SMS Message</option>
                    <option value="contact">Contact Card</option>
                    <option value="geo">GPS Coordinates</option>
                    <option value="phone">Phone Number</option>
                    <option value="email">Email Address</option>
                </select>

                {qrType === 'text' && <textarea placeholder="Enter payload..." className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs" onChange={(e) => updateData('text', e.target.value)} />}
                {qrType === 'wifi' && <><input placeholder="SSID (Network Name)" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('ssid', e.target.value)} /><input placeholder="Password" type="password" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('pass', e.target.value)} /></>}
                {qrType === 'sms' && <><input placeholder="Phone Number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('phone', e.target.value)} /><textarea placeholder="Message" className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('msg', e.target.value)} /></>}
                {qrType === 'geo' && <div className="flex gap-2"><input placeholder="Latitude" className="w-1/2 bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('lat', e.target.value)} /><input placeholder="Longitude" className="w-1/2 bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('lng', e.target.value)} /></div>}
                {qrType === 'contact' && <><input placeholder="Full Name" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('name', e.target.value)} /><input placeholder="Phone" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('phone', e.target.value)} /><input placeholder="Email" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData('email', e.target.value)} /></>}
                {(qrType === 'phone' || qrType === 'email') && <input placeholder={qrType === 'phone' ? "Phone Number" : "Email Address"} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" onChange={(e) => updateData(qrType, e.target.value)} />}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-2xl border border-emerald-900/50">
                <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <QRCodeSVG value={generatePayload()} size={256} level={"H"} includeMargin={true} />
                </div>
                <span className="text-[10px] font-mono text-emerald-500 mt-4 tracking-widest uppercase animate-pulse">Payload Ready for Scan</span>
            </div>
        </div>
    );
}

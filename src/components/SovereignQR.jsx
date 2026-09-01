import React, { useState, useEffect } from 'react';
import bwipjs from 'bwip-js';
import { Html5Qrcode } from 'html5-qrcode';

export function SovereignQR({ onNavigate, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState(onScanSuccess ? 'scan' : 'generate');
  
  const [qrType, setQrType] = useState('qrcode');
  const [qrData, setQrData] = useState({ text: '', ssid: '', pass: '', phone: '', msg: '', email: '', lat: '', lng: '', name: '' });
  const [scanError, setScanError] = useState('');

  const updateData = (field, value) => setQrData(prev => ({ ...prev, [field]: value }));

  const generatePayload = () => {
    if (qrType === 'wifi') return `WIFI:T:WPA;S:${qrData.ssid};P:${qrData.pass};;`;
    if (qrType === 'sms') return `SMSTO:${qrData.phone}:${qrData.msg}`;
    if (qrType === 'geo') return `geo:${qrData.lat},${qrData.lng}`;
    if (qrType === 'contact') return `MECARD:N:${qrData.name};TEL:${qrData.phone};EMAIL:${qrData.email};;`;
    if (qrType === 'phone') return `tel:${qrData.phone}`;
    if (qrType === 'email') return `mailto:${qrData.email}`;
    return qrData.text;
  };

  // Universal Rendering Engine
  useEffect(() => {
    if (activeTab === 'generate') {
      const payload = generatePayload();
      if (!payload.trim()) return;

      try {
        let bcid = 'qrcode'; // Default
        if (qrType === 'code128') bcid = 'code128';
        if (qrType === 'datamatrix') bcid = 'datamatrix';
        if (qrType === 'pdf417') bcid = 'pdf417';

        bwipjs.toCanvas('sovereign-canvas', {
          bcid: bcid,
          text: payload,
          scale: 3,
          height: bcid === 'code128' ? 15 : 30,
          includetext: bcid === 'code128', // Only show text under 1D barcodes
          textxalign: 'center',
          backgroundcolor: 'ffffff', // White background required for optical contrast
          padding: 5
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }
  }, [qrData, qrType, activeTab]);

  // Tactical Scanner Engine
  useEffect(() => {
    let html5QrCode;
    if (activeTab === 'scan') {
      html5QrCode = new Html5Qrcode("sovereign-reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (onScanSuccess) {
            html5QrCode.stop();
            onScanSuccess(decodedText);
          } else {
            setQrData(prev => ({ ...prev, text: decodedText }));
            setQrType('qrcode');
            setActiveTab('generate');
            html5QrCode.stop();
          }
        },
        (errorMessage) => {}
      ).catch(() => setScanError("Camera access denied or hardware unavailable."));
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.log(e));
      }
    };
  }, [activeTab, onScanSuccess]);

  return (
    <div className="min-h-screen bg-black text-white p-5 pb-24 font-sans select-none overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <span className="text-cyan-500">👁️</span> Optical Transceiver
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Multi-Format Payload Engine</p>
        </div>
        {!onScanSuccess && (
          <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all">
            Exit
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('generate')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-cyan-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>Generate</button>
        <button onClick={() => setActiveTab('scan')} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'scan' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}>Scan</button>
      </div>

      {activeTab === 'generate' && (
        <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800 animate-fadeIn">
          
          <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 uppercase tracking-wider" onChange={(e) => setQrType(e.target.value)} value={qrType}>
            <optgroup label="2D Matrices">
              <option value="qrcode">QR Code (Standard)</option>
              <option value="datamatrix">Data Matrix (Industrial)</option>
              <option value="pdf417">PDF417 (ID & Transit)</option>
            </optgroup>
            <optgroup label="1D Barcodes">
              <option value="code128">CODE128 (Standard Alphanumeric)</option>
            </optgroup>
            <optgroup label="Formatted Payloads (QR)">
              <option value="wifi">WiFi Network</option>
              <option value="sms">SMS Message</option>
              <option value="contact">Contact Card</option>
              <option value="geo">GPS Coordinates</option>
            </optgroup>
          </select>

          {['qrcode', 'datamatrix', 'pdf417', 'code128'].includes(qrType) && (
            <textarea placeholder="Enter payload string..." className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-cyan-500" value={qrData.text} onChange={(e) => updateData('text', e.target.value)} />
          )}
          
          {/* ... (WiFi, SMS, Geo, and Contact inputs remain the same as previous) ... */}

          <div className="mt-8 flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-2xl border border-emerald-900/50">
            <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-hidden flex justify-center w-full">
              <canvas id="sovereign-canvas" className="max-w-full h-auto"></canvas>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 mt-4 tracking-widest uppercase animate-pulse">Optical Canvas Rendered</span>
          </div>
        </div>
      )}

      {activeTab === 'scan' && (
        <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800 animate-fadeIn flex flex-col items-center">
          <p className="text-amber-500 font-mono text-[10px] tracking-widest uppercase text-center w-full mb-2">Initialize Optical Sensor</p>
          <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/50 relative">
            <div id="sovereign-reader" className="w-full h-full bg-black"></div>
            {scanError && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-500 text-xs font-bold text-center p-4">{scanError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

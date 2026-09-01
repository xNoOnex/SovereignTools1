import React, { useState, useEffect } from 'react';
import bwipjs from 'bwip-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Filesystem, Directory } from '@capacitor/filesystem';
import CryptoJS from 'crypto-js';

export function SovereignQR({ onNavigate, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState(onScanSuccess ? 'scan' : 'generate');
  
  const [qrType, setQrType] = useState('qrcode');
  const [qrData, setQrData] = useState({ text: '', ssid: '', pass: '', phone: '', msg: '', email: '', lat: '', lng: '', name: '' });
  const [scanError, setScanError] = useState('');
  
  const [lineColor, setLineColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [ecLevel, setEcLevel] = useState('H'); 
  const [payloadTitle, setPayloadTitle] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'generate') {
      const payload = generatePayload();
      if (!payload.trim()) return;

      try {
        let bcid = qrType; 
        if (['wifi', 'sms', 'contact', 'geo', 'phone', 'email'].includes(qrType)) {
          bcid = 'qrcode';
        }

        const is1D = ['code128', 'code39', 'code93', 'ean13', 'ean8', 'upca', 'upce', 'interleaved2of5'].includes(bcid);
        const safeLineColor = lineColor.replace('#', '');
        const safeBgColor = bgColor.replace('#', '');

        bwipjs.toCanvas('sovereign-canvas', {
          bcid: bcid,
          text: payload,
          scale: 3,
          height: is1D ? 15 : 30,
          includetext: is1D, 
          textxalign: 'center',
          barcolor: safeLineColor,
          backgroundcolor: safeBgColor,
          padding: 5,
          eclevel: ecLevel 
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }
  }, [qrData, qrType, activeTab, lineColor, bgColor, ecLevel]);

  const handleSaveToVault = async () => {
    const masterKey = window.__SOVEREIGN_KEY__;
    if (!masterKey) return alert("Vault locked. Cannot encrypt payload.");
    
    const canvas = document.getElementById('sovereign-canvas');
    if (!canvas) return alert("No payload rendered to save.");

    setIsEncrypting(true);

    setTimeout(async () => {
      try {
        const base64Data = canvas.toDataURL('image/png');
        const encryptedData = CryptoJS.AES.encrypt(base64Data, masterKey).toString();
        const safeTitle = payloadTitle.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'payload';
        const fileName = `stealth_qr_${safeTitle}_${Date.now()}.aes`;
        
        await Filesystem.writeFile({
          path: fileName,
          data: encryptedData,
          directory: Directory.Data
        });
        
        alert("✅ Optical Payload secured in Vault.");
        setPayloadTitle('');
      } catch (e) {
        console.error(e);
        alert("Failed to encrypt and save payload.");
      } finally {
        setIsEncrypting(false);
      }
    }, 50);
  };

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
      ).catch(() => setScanError("Camera access denied."));
    }
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(()=>{}); };
  }, [activeTab, onScanSuccess]);

  return (
    <div className="min-h-screen bg-black text-white p-5 pb-24 font-sans select-none overflow-y-auto">
      {isEncrypting && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center">
           <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
           <h2 className="text-emerald-500 font-black tracking-[0.2em] uppercase text-lg animate-pulse">Encrypting Matrix</h2>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
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
          <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 uppercase tracking-wider" onChange={(e) => setQrType(e.target.value)} value={qrType}>
            <optgroup label="2D Matrices">
              <option value="qrcode">QR Code (Standard)</option>
              <option value="microqrcode">Micro QR Code</option>
              <option value="datamatrix">Data Matrix (Industrial)</option>
              <option value="pdf417">PDF417 (ID & Transit)</option>
              <option value="azteccode">Aztec Code (Transport)</option>
            </optgroup>
            <optgroup label="1D Barcodes (Alphanumeric)">
              <option value="code128">CODE 128 (Standard)</option>
              <option value="code39">CODE 39 (Legacy)</option>
              <option value="code93">CODE 93 (Compact)</option>
            </optgroup>
            <optgroup label="1D Barcodes (Retail)">
              <option value="ean13">EAN-13 (Global Retail)</option>
              <option value="ean8">EAN-8 (Compact Retail)</option>
              <option value="upca">UPC-A (US Retail)</option>
              <option value="upce">UPC-E (Compact US)</option>
              <option value="interleaved2of5">ITF (Interleaved 2 of 5)</option>
            </optgroup>
            <optgroup label="Formatted Payloads (QR)">
              <option value="wifi">WiFi Network</option>
              <option value="sms">SMS Message</option>
              <option value="contact">Contact Card</option>
              <option value="geo">GPS Coordinates</option>
            </optgroup>
          </select>

          {['qrcode', 'microqrcode', 'datamatrix', 'pdf417', 'azteccode', 'code128', 'code39', 'code93'].includes(qrType) && (
            <textarea placeholder="Enter payload string..." className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-cyan-500" value={qrData.text} onChange={(e) => updateData('text', e.target.value)} />
          )}

          {['ean13', 'ean8', 'upca', 'upce', 'interleaved2of5'].includes(qrType) && (
            <input type="number" placeholder="Enter numeric payload..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-cyan-500" value={qrData.text} onChange={(e) => updateData('text', e.target.value)} />
          )}
          
          {qrType === 'wifi' && (
            <div className="space-y-2">
              <input placeholder="SSID (Network Name)" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.ssid} onChange={(e) => updateData('ssid', e.target.value)} />
              <input placeholder="Password" type="password" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.pass} onChange={(e) => updateData('pass', e.target.value)} />
            </div>
          )}
          
          {qrType === 'sms' && (
            <div className="space-y-2">
              <input placeholder="Phone Number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.phone} onChange={(e) => updateData('phone', e.target.value)} />
              <textarea placeholder="Message" className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.msg} onChange={(e) => updateData('msg', e.target.value)} />
            </div>
          )}
          
          {qrType === 'geo' && (
            <div className="flex gap-2">
              <input placeholder="Latitude" className="w-1/2 bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.lat} onChange={(e) => updateData('lat', e.target.value)} />
              <input placeholder="Longitude" className="w-1/2 bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.lng} onChange={(e) => updateData('lng', e.target.value)} />
            </div>
          )}
          
          {qrType === 'contact' && (
            <div className="space-y-2">
              <input placeholder="Full Name" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.name} onChange={(e) => updateData('name', e.target.value)} />
              <input placeholder="Phone Number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.phone} onChange={(e) => updateData('phone', e.target.value)} />
              <input placeholder="Email Address" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500" value={qrData.email} onChange={(e) => updateData('email', e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Line Color</label>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-lg">
                <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                <span className="text-xs font-mono text-zinc-400 uppercase">{lineColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Background</label>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 p-2 rounded-lg">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                <span className="text-xs font-mono text-zinc-400 uppercase">{bgColor}</span>
              </div>
            </div>
          </div>

          {(qrType === 'qrcode' || qrType === 'microqrcode') && (
            <div className="space-y-1 pt-2">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Error Correction</label>
              <select className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500" value={ecLevel} onChange={(e) => setEcLevel(e.target.value)}>
                <option value="L">Low (7% Recovery)</option>
                <option value="M">Medium (15% Recovery)</option>
                <option value="Q">Quarter (25% Recovery)</option>
                <option value="H">High (30% - Best for Mesh/Screens)</option>
              </select>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-2xl border border-emerald-900/50">
            <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-hidden flex justify-center w-full" style={{ backgroundColor: bgColor }}>
              <canvas id="sovereign-canvas" className="max-w-full h-auto"></canvas>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 mt-4 tracking-widest uppercase animate-pulse">Optical Canvas Rendered</span>
            
            <div className="w-full mt-6 space-y-3">
              <input 
                type="text" 
                placeholder="Title (e.g. Storage Barcode)" 
                value={payloadTitle} 
                onChange={(e) => setPayloadTitle(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-center" 
              />
              <button 
                onClick={handleSaveToVault}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow-lg"
              >
                💾 Save to Vault
              </button>
            </div>
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

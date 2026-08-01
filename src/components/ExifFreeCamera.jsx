import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  
  // Camera Controls
  const [mode, setMode] = useState('photo');
  const [filter, setFilter] = useState('none');
  const [facingMode, setFacingMode] = useState('environment');
  const [zoom, setZoom] = useState(1.0);
  const [exposure, setExposure] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // QR State
  const [scannedResult, setScannedResult] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const startCamera = async () => {
    setError('');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const constraintSets = [
      { video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: mode === 'video' },
      { video: { facingMode: facingMode }, audio: false },
      { video: true, audio: false }
    ];

    let mediaStream = null;
    let lastErr = null;

    for (const constraints of constraintSets) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } else {
      setError(lastErr ? lastErr.message : 'Camera hardware access denied');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, mode]);

  // Pure JavaScript jsQR Scanner Loop
  useEffect(() => {
    let scanInterval;
    if (mode === 'qr' && stream) {
      scanInterval = setInterval(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, 300, 300);

          const imageData = ctx.getImageData(0, 0, 300, 300);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            setScannedResult(code.data);
            setStatusMsg('🔍 QR Code Successfully Scanned!');
          }
        }
      }, 300);
    }

    return () => clearInterval(scanInterval);
  }, [mode, stream]);

  const getFilterStyle = () => {
    switch (filter) {
      case 'bw': return 'grayscale(100%) contrast(120%)';
      case 'sepia': return 'sepia(90%) hue-rotate(-30deg) saturate(140%)';
      case 'matrix': return 'hue-rotate(90deg) contrast(180%) brightness(90%)';
      case 'vivid': return 'saturate(200%) contrast(110%)';
      case 'thermal': return 'invert(100%) hue-rotate(180deg) contrast(150%)';
      default: return 'none';
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    const activeFilter = getFilterStyle();
    if (activeFilter !== 'none') {
      ctx.filter = activeFilter;
    }

    if (mode === 'pro' && exposure !== 0) {
      ctx.filter += ` brightness(${100 + exposure * 25}%)`;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const cleanImageData = canvas.toDataURL('image/jpeg', 0.95);
    const filename = `Sovereign_${Date.now()}.jpg`;

    if (window.AndroidNative && window.AndroidNative.saveToGallery) {
      window.AndroidNative.saveToGallery(cleanImageData, filename, 'image/jpeg');
    } else {
      const link = document.createElement('a');
      link.href = cleanImageData;
      link.download = filename;
      link.click();
    }

    setStatusMsg('📸 Photo Captured & EXIF Scrubbed');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const copyQrResult = () => {
    navigator.clipboard.writeText(scannedResult);
    setStatusMsg('📋 QR Data Copied to Clipboard!');
    setTimeout(() => setStatusMsg(''), 2000);
  };

  return (
    <div className={`select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-black flex flex-col justify-between p-3' : 'p-3 space-y-3 max-w-2xl mx-auto pb-28'}`}>
      
      <div className="border-b border-zinc-800 pb-2 flex justify-between items-center bg-zinc-900/90 p-2.5 rounded-xl backdrop-blur-md">
        <div className="flex items-center space-x-2">
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 font-bold text-xs rounded-lg flex items-center gap-1"
            >
              ❌ Exit Fullscreen
            </button>
          )}
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              📷 EXIF-Free Pro Camera
            </h2>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">🛡️ ZERO EXIF GPS</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {!isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-2.5 py-1.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-lg"
            >
              🔲 Fullscreen
            </button>
          )}
          <button
            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs rounded-lg"
          >
            🔄 Flip
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      <div className={`relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center ${isFullscreen ? 'flex-1 my-2' : 'aspect-[3/4]'}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            filter: getFilterStyle()
          }}
        />

        {showGrid && mode !== 'qr' && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 border border-white/10">
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div className="" />
          </div>
        )}

        {mode === 'qr' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-56 h-56 border-2 border-cyan-400 rounded-3xl bg-cyan-500/10 flex items-center justify-center animate-pulse relative">
              <span className="text-[10px] font-mono text-cyan-300 font-bold bg-black/80 px-2 py-1 rounded-lg">
                ALIGN QR CODE HERE
              </span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-zinc-800 flex space-x-1 text-[10px] font-bold">
          {[1.0, 2.0, 3.0].map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-1 rounded-lg ${zoom === z ? 'bg-cyan-500 text-black' : 'text-zinc-400'}`}
            >
              {z.toFixed(1)}x
            </button>
          ))}
        </div>

        {mode !== 'qr' && (
          <div className="absolute bottom-4 inset-x-3 flex justify-center items-center z-20">
            <button
              onClick={takePhoto}
              className="w-16 h-16 rounded-full border-4 border-white bg-cyan-500 hover:bg-cyan-400 active:scale-90 transition-all flex items-center justify-center shadow-2xl shadow-cyan-500/40"
            >
              <div className="w-11 h-11 rounded-full border-2 border-black/40 bg-white/20" />
            </button>
          </div>
        )}
      </div>

      {mode === 'qr' && scannedResult && (
        <div className="bg-zinc-900 border border-cyan-500/50 p-3.5 rounded-2xl space-y-2.5">
          <div className="text-xs font-bold text-cyan-400 flex justify-between items-center">
            <span>🔍 Scanned Code Result</span>
            <button onClick={() => setScannedResult('')} className="text-zinc-500 text-xs">✕ Clear</button>
          </div>
          <div className="bg-black p-2.5 rounded-xl border border-zinc-800 text-xs font-mono text-white break-all">
            {scannedResult}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={copyQrResult}
              className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl"
            >
              📋 Copy Text
            </button>
            {scannedResult.startsWith('http') && (
              <a
                href={scannedResult}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl text-center"
              >
                🌐 Open URL
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Privacy Filters</span>
        <div className="flex space-x-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
          {[
            { id: 'none', label: '✨ Normal' },
            { id: 'bw', label: '🖤 B&W Noir' },
            { id: 'sepia', label: '📜 Sepia' },
            { id: 'matrix', label: '🟢 Matrix' },
            { id: 'vivid', label: '🌈 Vivid' },
            { id: 'thermal', label: '🔥 Thermal' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                filter === f.id ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold text-center">
        <button
          onClick={() => setMode('photo')}
          className={`py-2.5 rounded-xl transition-all ${mode === 'photo' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
        >
          📷 Photo
        </button>
        <button
          onClick={() => setMode('video')}
          className={`py-2.5 rounded-xl transition-all ${mode === 'video' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
        >
          🎥 Video
        </button>
        <button
          onClick={() => setMode('qr')}
          className={`py-2.5 rounded-xl transition-all ${mode === 'qr' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
        >
          🔍 QR Scan
        </button>
        <button
          onClick={() => setMode('pro')}
          className={`py-2.5 rounded-xl transition-all ${mode === 'pro' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
        >
          🎛️ Pro
        </button>
      </div>

      {!isFullscreen && (
        <ToolFooter
          title="EXIF-Free Privacy Camera & QR Reader"
          details="Captures raw video frames directly to HTML5 canvas, applying live privacy filters and stripping GPS coordinates."
          disclaimer="Saved images are stored in DCIM/SovereignTools with zero tracking footprints."
        />
      )}
    </div>
  );
}

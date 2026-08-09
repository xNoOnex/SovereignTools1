import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export function ExifFreeCamera({ onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  
  const [mode, setMode] = useState('photo'); // 'photo' | 'video' | 'qr' | 'pro'
  const [filter, setFilter] = useState('none');
  const [facingMode, setFacingMode] = useState('environment');
  const [zoom, setZoom] = useState(1.0);
  const [exposure, setExposure] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  
  const [scannedResult, setScannedResult] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

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

  // jsQR Scanner Loop
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
            setStatusMsg('🔍 QR Code Scanned!');
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

  const handleShutter = () => {
    if (mode === 'video') {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
      return;
    }
    takePhoto();
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    const activeFilter = getFilterStyle();
    if (activeFilter !== 'none') ctx.filter = activeFilter;
    if (mode === 'pro' && exposure !== 0) ctx.filter += ` brightness(${100 + exposure * 25}%)`;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const cleanImageData = canvas.toDataURL('image/jpeg', 0.95);
    const filename = `Sovereign_${Date.now()}.jpg`;

    if (window.AndroidNative && window.AndroidNative.saveToGallery) {
      window.AndroidNative.saveToGallery(cleanImageData, filename, 'image/jpeg');
    }

    setStatusMsg('📸 Photo Captured & EXIF Scrubbed');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const startVideoRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Video = reader.result;
          const filename = `Sovereign_Video_${Date.now()}.mp4`;

          if (window.AndroidNative && window.AndroidNative.saveToGallery) {
            window.AndroidNative.saveToGallery(base64Video, filename, 'video/mp4');
          }
        };

        setStatusMsg('🎥 Video Recording Saved to Gallery');
        setTimeout(() => setStatusMsg(''), 2500);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      alert("Video recorder error: " + e.message);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  
            {/* SCAN TOAST NOTIFICATION */}
            {scanToast && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[11px] font-black px-4 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] z-50 tracking-widest animate-bounce">
                    ✓ {scanToast}
                </div>
            )}

            {/* DIRECT COMMS INJECTION POPUP */}
            {scannedData && (
                <div className="absolute bottom-24 left-4 right-4 bg-zinc-950/90 border border-emerald-500/60 p-4 rounded-2xl backdrop-blur-md z-50 flex flex-col gap-3 shadow-[0_0_25px_rgba(0,0,0,0.8)]">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase flex items-center gap-2">
                            <span>📡</span> SDP HANDSHAKE DETECTED
                        </span>
                        <button onClick={() => setScannedData(null)} className="text-zinc-500 hover:text-white text-xs font-bold">✕</button>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono truncate bg-black/60 p-2 rounded-lg border border-zinc-800">
                        {scannedData}
                    </p>
                    <button 
                        onClick={() => {
                            if (typeof onNavigate === 'function') onNavigate('comm');
                            else if (typeof navigateTo === 'function') navigateTo('comm');
                            else alert("Payload stored! Navigate to Encrypted Comms to auto-fill.");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[11px] py-3 rounded-xl tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95">
                        🔗 INJECT INTO ENCRYPTED COMMS
                    </button>
                </div>
            )}

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden">
      
      {/* 100% FULLSCREEN VIEWFINDER */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
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
            <div className="w-64 h-64 border-2 border-cyan-400 rounded-3xl bg-cyan-500/10 flex items-center justify-center animate-pulse">
              <span className="text-xs font-mono text-cyan-300 font-bold bg-black/80 px-3 py-1.5 rounded-xl">
                ALIGN QR CODE HERE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING TOP OVERLAY BAR */}
      <div 
        className="relative z-30 px-4 pt-3 flex justify-between items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <button
          onClick={onClose}
          className="px-3.5 py-2 bg-black/70 backdrop-blur-md border border-zinc-700 hover:border-red-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-1.5"
        >
          <span>❌</span>
          <span>Exit / Gallery</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="px-3 py-2 bg-black/70 backdrop-blur-md border border-zinc-700 text-white font-bold text-xs rounded-2xl shadow-xl"
          >
            🔄 Flip
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 bg-black/70 backdrop-blur-md border text-xs font-bold rounded-2xl shadow-xl ${
              showGrid ? 'border-cyan-400 text-cyan-300' : 'border-zinc-700 text-zinc-400'
            }`}
          >
            🌐 Grid
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="relative z-30 mx-auto bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-4 rounded-2xl text-center shadow-2xl backdrop-blur-md max-w-xs">
          {statusMsg}
        </div>
      )}

      {/* FLOATING BOTTOM OVERLAY BAR */}
      <div 
        className="relative z-30 px-4 pb-4 space-y-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-8"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        {/* Quick Zoom Bar */}
        <div className="flex justify-center items-center space-x-2">
          {[1.0, 2.0, 3.0].map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md border ${
                zoom === z ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black/60 text-zinc-300 border-zinc-700'
              }`}
            >
              {z.toFixed(1)}x
            </button>
          ))}
        </div>

        {/* Filter Selection Carousel */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-[10px] font-bold justify-center">
          {[
            { id: 'none', label: '✨ Normal' },
            { id: 'bw', label: '🖤 B&W' },
            { id: 'sepia', label: '📜 Sepia' },
            { id: 'matrix', label: '🟢 Matrix' },
            { id: 'vivid', label: '🌈 Vivid' },
            { id: 'thermal', label: '🔥 Thermal' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap backdrop-blur-md transition-all ${
                filter === f.id ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/70 border-zinc-800 text-zinc-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Shutter Button & Mode Tabs */}
        <div className="flex items-center justify-between pt-1">
          <div className="grid grid-cols-4 gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold text-center flex-1 mr-4">
            <button
              onClick={() => setMode('photo')}
              className={`py-2 rounded-xl transition-all ${mode === 'photo' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
            >
              📷 Photo
            </button>
            <button
              onClick={() => setMode('video')}
              className={`py-2 rounded-xl transition-all ${mode === 'video' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
            >
              🎥 Video
            </button>
            <button
              onClick={() => setMode('qr')}
              className={`py-2 rounded-xl transition-all ${mode === 'qr' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
            >
              🔍 QR
            </button>
            <button
              onClick={() => setMode('pro')}
              className={`py-2 rounded-xl transition-all ${mode === 'pro' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-400'}`}
            >
              🎛️ Pro
            </button>
          </div>

          {mode !== 'qr' && (
            <button
              onClick={handleShutter}
              className={`w-16 h-16 rounded-full border-4 transition-all flex items-center justify-center shadow-2xl ${
                isRecording ? 'border-red-400 bg-red-600 animate-pulse scale-110' : 'border-white bg-cyan-500 hover:bg-cyan-400 active:scale-90'
              }`}
            >
              <div className={`rounded-full border-2 border-black/40 ${isRecording ? 'w-6 h-6 bg-white rounded-sm' : 'w-11 h-11 bg-white/20'}`} />
            </button>
          )}
        </div>

        {/* Scanned QR Output Overlay */}
        {mode === 'qr' && scannedResult && (
          <div className="bg-black/90 border border-cyan-500/50 p-3 rounded-2xl space-y-2 text-xs backdrop-blur-md">
            <div className="text-cyan-400 font-bold flex justify-between">
              <span>🔍 Scanned Result</span>
              <button onClick={() => setScannedResult('')} className="text-zinc-500">✕ Clear</button>
            </div>
            <div className="font-mono text-white break-all bg-zinc-900 p-2 rounded-xl border border-zinc-800">
              {scannedResult}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(scannedResult); setStatusMsg('📋 Copied!'); }}
              className="w-full py-2 bg-cyan-500 text-black font-bold rounded-xl"
            >
              📋 Copy Result
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

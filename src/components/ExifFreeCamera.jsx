import React, { useState, useRef, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo');
  const [facingMode, setFacingMode] = useState('environment');
  
  const [aspectRatio, setAspectRatio] = useState('full');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [torchOn, setTorchOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [lastMedia, setLastMedia] = useState(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Single safe stream initialization to prevent hardware driver deadlocks
  const startCameraStream = async () => {
    setIsInitializing(true);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const existing = videoRef.current.srcObject;
        existing.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: { facingMode: facingMode },
        audio: cameraMode === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setStatusText('⚠️ Camera permission or hardware access failed');
      setTimeout(() => setStatusText(''), 3000);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      startCameraStream();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, cameraMode]);

  useEffect(() => {
    let timer = null;
    if (isRecording) {
      timer = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (e) {
      setStatusText('Flashlight unavailable on this lens');
      setTimeout(() => setStatusText(''), 2000);
    }
  };

  const executeCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    
    let w = video.videoWidth || 1280;
    let h = video.videoHeight || 720;

    if (aspectRatio === '1:1') {
      const dim = Math.min(w, h);
      canvas.width = dim; canvas.height = dim;
    } else {
      canvas.width = w; canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 150);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setLastMedia({ type: 'image', url });

      const a = document.createElement('a');
      a.href = url;
      a.download = `SOVEREIGN_CLEAN_${Date.now()}.png`;
      a.click();

      setStatusText('✅ Clean Photo Saved (0 EXIF Metadata)');
      setTimeout(() => setStatusText(''), 2500);
    }, 'image/png');
  };

  const handleShutterTap = () => {
    if (cameraMode === 'video') { toggleRecording(); return; }
    if (cameraMode === 'burst') {
      for (let i = 0; i < 3; i++) setTimeout(() => executeCapture(), i * 300);
      return;
    }

    if (timerSec > 0) {
      setTimerCountdown(timerSec);
      let count = timerSec;
      const interval = setInterval(() => {
        count -= 1;
        setTimerCountdown(count);
        if (count <= 0) { clearInterval(interval); executeCapture(); }
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      const stream = videoRef.current?.srcObject;
      if (!stream) return;

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setLastMedia({ type: 'video', url });

        const a = document.createElement('a');
        a.href = url;
        a.download = `SOVEREIGN_VIDEO_${Date.now()}.webm`;
        a.click();

        setStatusText('✅ Video Saved');
        setTimeout(() => setStatusText(''), 2500);
      };

      recorder.start();
      setIsRecording(true);
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center select-none">
        <div className="w-20 h-20 mb-4 rounded-2xl bg-zinc-900 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/10">
          📷
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Pro Privacy Camera</h2>
        <p className="text-xs text-zinc-400 mb-6 max-w-xs">
          EXIF-free hardware camera suite with clean frame isolation, exposure controls, and burst capture.
        </p>
        <button
          onClick={startCameraStream}
          disabled={isInitializing}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          {isInitializing ? 'Initializing Hardware...' : 'Open Camera Viewfinder'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 bg-black flex flex-col justify-between select-none overflow-hidden">
      {shutterFlash && <div className="absolute inset-0 bg-white z-50 transition-opacity duration-100" />}

      {statusText && (
        <div className="absolute top-16 inset-x-4 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold py-2 px-4 rounded-xl text-center backdrop-blur-md shadow-lg">
          {statusText}
        </div>
      )}

      {/* FULL-SCREEN BACKGROUND VIEWFINDER */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="w-full h-full object-cover"
          style={{ transform: `scale(${zoomLevel})`, filter: `brightness(${brightness}%)` }}
        />

        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-cyan-500/20">
            {[...Array(9)].map((_, i) => <div key={i} className="border border-white/15" />)}
          </div>
        )}

        {timerCountdown > 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-7xl font-black text-cyan-400 font-mono animate-ping">
            {timerCountdown}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* TOP FLOATING CONTROLS */}
      <div className="relative z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTorch}
            className={`p-2 rounded-full border text-xs font-bold ${
              torchOn ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-zinc-300 border-zinc-700 backdrop-blur-md'
            }`}
          >
            {torchOn ? '⚡ Flash On' : '⚡ Flash Off'}
          </button>

          <select
            value={timerSec}
            onChange={(e) => setTimerSec(Number(e.target.value))}
            className="bg-black/60 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-full px-2 py-1.5 backdrop-blur-md focus:outline-none"
          >
            <option value={0}>⏱️ Off</option>
            <option value={3}>⏱️ 3s</option>
            <option value={5}>⏱️ 5s</option>
            <option value={10}>⏱️ 10s</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-full border text-xs font-bold ${
              showGrid ? 'bg-cyan-500/30 text-cyan-400 border-cyan-500' : 'bg-black/60 text-zinc-300 border-zinc-700 backdrop-blur-md'
            }`}
          >
            🌐 Grid
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 bg-black/60 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-full backdrop-blur-md"
          >
            ℹ️ Specs
          </button>
        </div>
      </div>

      {/* DETAILS DRAWER */}
      {showDetails && (
        <div className="relative z-30 mx-4 bg-zinc-950/90 border border-zinc-800 p-4 rounded-xl backdrop-blur-md max-h-[50vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
            <span className="font-bold text-xs text-white">📷 Full-Screen Camera Specs</span>
            <button onClick={() => setShowDetails(false)} className="text-xs text-zinc-400 font-bold">✕ Close</button>
          </div>
          <ToolFooter
            title="EXIF-Free Full-Screen Camera"
            details="Captures raw unlinked image streams directly off the hardware sensor onto an isolated HTML5 canvas to scrub GPS coordinates, camera model fingerprints, and timestamp logs."
            disclaimer="Camera frames are saved locally in app memory. Double-check photo backgrounds for physical location markers before sharing."
          />
        </div>
      )}

      {/* BOTTOM OVERLAY SHUTTER DOCK */}
      <div className="relative z-20 px-6 pb-20 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-3">
        <div className="flex items-center space-x-3 text-xs text-zinc-300 font-mono">
          <span className="w-12">🔍 {zoomLevel.toFixed(1)}x</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-zinc-800/80 rounded-lg h-1.5 cursor-pointer"
          />
        </div>

        {cameraMode === 'pro' && (
          <div className="flex items-center space-x-3 text-xs text-zinc-300 font-mono">
            <span className="w-12">☀️ {brightness}%</span>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-amber-400 bg-zinc-800/80 rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        )}

        <div className="flex justify-center space-x-6 text-xs font-bold tracking-wider uppercase text-zinc-400">
          {['photo', 'video', 'pro', 'burst'].map((mode) => (
            <button
              key={mode}
              onClick={() => { setCameraMode(mode); setIsRecording(false); }}
              className={`transition-all pb-1 ${
                cameraMode === mode ? 'text-cyan-400 border-b-2 border-cyan-400 scale-105' : 'hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-hidden flex items-center justify-center">
            {lastMedia ? (
              lastMedia.type === 'image' ? (
                <img src={lastMedia.url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-red-500 font-bold">🎥</span>
              )
            ) : (
              <span className="text-[10px] text-zinc-600 font-mono">Vault</span>
            )}
          </div>

          <button
            onClick={handleShutterTap}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center active:scale-90 transition-all ${
              cameraMode === 'video' ? 'border-red-500' : 'border-white'
            }`}
          >
            <div className={`transition-all duration-200 ${
              cameraMode === 'video'
                ? isRecording ? 'w-8 h-8 rounded-sm bg-red-600' : 'w-16 h-16 rounded-full bg-red-600'
                : 'w-16 h-16 rounded-full bg-white'
            }`} />
          </button>

          <button
            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="w-12 h-12 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-lg text-white active:scale-90 transition-transform"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
}

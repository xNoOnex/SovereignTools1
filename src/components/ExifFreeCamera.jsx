import React, { useState, useRef, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Hardware & Controls State
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo', 'video', 'pro', 'burst'
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  
  // Camera Settings
  const [aspectRatio, setAspectRatio] = useState('4:3'); // '4:3', '16:9', '1:1', 'full'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [torchOn, setTorchOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(0);
  
  // Recording & Media State
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [lastMedia, setLastMedia] = useState(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Request Access
  const requestCameraAccess = async () => {
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      alert("Camera permission denied.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Start Video Stream
  useEffect(() => {
    if (!hasPermission) return;
    let activeStream = null;

    async function startStream() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: cameraMode === 'video'
        });

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          await videoRef.current.play();
        }

        // Apply native track zoom if supported by device
        const track = activeStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.zoom) {
          track.applyConstraints({ advanced: [{ zoom: zoomLevel }] }).catch(() => {});
        }
      } catch (err) {
        console.error("Camera stream error:", err);
      }
    }

    startStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasPermission, facingMode, cameraMode]);

  // Video Recording Timer
  useEffect(() => {
    let timer = null;
    if (isRecording) {
      timer = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (e) {
      setStatusText('Flashlight not available on this lens');
      setTimeout(() => setStatusText(''), 2000);
    }
  };

  // Execute Photo Capture with EXIF Scrubbing
  const executeCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    
    // Set aspect ratio crop box
    let w = video.videoWidth || 1920;
    let h = video.videoHeight || 1080;

    if (aspectRatio === '1:1') {
      const dim = Math.min(w, h);
      canvas.width = dim;
      canvas.height = dim;
    } else {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    
    // Apply pro brightness filter to canvas frame
    ctx.filter = `brightness(${brightness}%)`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Visual Shutter Flash Feedback
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 150);

    // Export raw clean image blob (strips EXIF metadata)
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

  // Trigger Capture with Timer Support
  const handleShutterTap = () => {
    if (cameraMode === 'video') {
      toggleRecording();
      return;
    }

    if (cameraMode === 'burst') {
      // Capture 3 rapid photos
      for (let i = 0; i < 3; i++) {
        setTimeout(() => executeCapture(), i * 300);
      }
      return;
    }

    if (timerSec > 0) {
      setTimerCountdown(timerSec);
      let count = timerSec;
      const interval = setInterval(() => {
        count -= 1;
        setTimerCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          executeCapture();
        }
      }, 1000);
    } else {
      executeCapture();
    }
  };

  // Video Recording Logic
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center select-none">
        <div className="w-20 h-20 mb-4 rounded-2xl bg-zinc-900 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/10">
          📷
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Pro Privacy Camera</h2>
        <p className="text-xs text-zinc-400 mb-6 max-w-xs">
          Full phone camera suite with zoom, exposure controls, burst mode, and automatic EXIF metadata stripping.
        </p>
        <button
          onClick={requestCameraAccess}
          disabled={isInitializing}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          {isInitializing ? 'Launching Camera...' : 'Open Pro Camera'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[88vh] bg-black flex flex-col justify-between select-none overflow-hidden">

      {/* Shutter Flash Overlay */}
      {shutterFlash && <div className="absolute inset-0 bg-white z-50 transition-opacity duration-100" />}

      {/* Status Alert Toast */}
      {statusText && (
        <div className="absolute top-16 inset-x-4 z-40 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold py-2 px-4 rounded-xl text-center backdrop-blur-md shadow-lg">
          {statusText}
        </div>
      )}

      {/* 1. TOP CONTROLS BAR */}
      <div className="relative z-30 flex justify-between items-center p-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        {/* Left Actions: Flash & Timer */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTorch}
            className={`p-2 rounded-full border text-xs font-bold transition-all ${
              torchOn ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900/80 text-zinc-300 border-zinc-800'
            }`}
          >
            {torchOn ? '⚡ Flash On' : '⚡ Flash Off'}
          </button>

          <select
            value={timerSec}
            onChange={(e) => setTimerSec(Number(e.target.value))}
            className="bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-full px-2 py-1.5 focus:outline-none"
          >
            <option value={0}>⏱️ Timer Off</option>
            <option value={3}>⏱️ 3s Timer</option>
            <option value={5}>⏱️ 5s Timer</option>
            <option value={10}>⏱️ 10s Timer</option>
          </select>
        </div>

        {/* Right Actions: Aspect Ratio & Grid */}
        <div className="flex items-center space-x-2">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-full px-2 py-1.5 focus:outline-none"
          >
            <option value="4:3">4:3</option>
            <option value="16:9">16:9</option>
            <option value="1:1">1:1 Square</option>
          </select>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-full border text-xs font-bold transition-all ${
              showGrid ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-zinc-900/80 text-zinc-300 border-zinc-800'
            }`}
          >
            🌐 Grid
          </button>
        </div>
      </div>

      {/* 2. MAIN VIEWFINDER */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden my-auto">
        <div 
          className={`relative w-full transition-all duration-300 overflow-hidden flex items-center justify-center ${
            aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : 'h-full'
          }`}
          style={{ filter: `brightness(${brightness}%)` }}
        >
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
            style={{ transform: `scale(${zoomLevel})` }}
          />

          {/* Grid Lines Overlay */}
          {showGrid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-cyan-500/20">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/15" />
              ))}
            </div>
          )}

          {/* Timer Countdown Badge */}
          {timerCountdown > 0 && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-6xl font-black text-cyan-400 font-mono animate-ping">
              {timerCountdown}
            </div>
          )}

          {/* Video Recording Badge */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-2 font-mono font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span>{Math.floor(recordTime / 60)}:{('0' + (recordTime % 60)).slice(-2)}</span>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* 3. PRO CONTROLS & SLIDERS */}
      <div className="relative z-30 px-6 py-2 bg-gradient-to-t from-black via-black/80 to-transparent space-y-3">
        {/* Zoom Slider */}
        <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono">
          <span className="w-12">🔍 {zoomLevel.toFixed(1)}x</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
          />
        </div>

        {/* Pro Mode Brightness Slider */}
        {cameraMode === 'pro' && (
          <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono">
            <span className="w-12">☀️ {brightness}%</span>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-amber-400 bg-zinc-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        )}

        {/* Mode Selector Strip */}
        <div className="flex justify-center space-x-6 text-xs font-bold tracking-wider uppercase text-zinc-400 pt-1">
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

        {/* Shutter Bar */}
        <div className="flex justify-between items-center pt-2">
          {/* Gallery Preview Thumbnail */}
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
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

          {/* Main Shutter Button */}
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

          {/* Lens Flip Button */}
          <button
            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg text-white active:scale-90 transition-transform"
          >
            🔄
          </button>
        </div>
      </div>

    </div>
  );
}

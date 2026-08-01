import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  
  const [mode, setMode] = useState('photo');
  const [aspectRatio, setAspectRatio] = useState('full');
  const [facingMode, setFacingMode] = useState('environment');
  const [zoom, setZoom] = useState(1.0);
  const [exposure, setExposure] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

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

  const handleShutter = () => {
    if (timer > 0) {
      setCountdown(timer);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            executeCapture();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const executeCapture = () => {
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
    if (mode === 'pro' && exposure !== 0) {
      ctx.filter = `brightness(${100 + exposure * 25}%)`;
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

  const startVideoRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    
    let options = {};
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      options = { mimeType: 'video/mp4' };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mime = options.mimeType || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Video = reader.result;
          const ext = mime.includes('mp4') ? 'mp4' : 'webm';
          const filename = `Sovereign_Video_${Date.now()}.${ext}`;

          if (window.AndroidNative && window.AndroidNative.saveToGallery) {
            window.AndroidNative.saveToGallery(base64Video, filename, mime);
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
          }
        };

        setStatusMsg('🎥 Video Recording Saved');
        setTimeout(() => setStatusMsg(''), 2500);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      alert("Video recording error: " + e.message);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getAspectStyle = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-[9/16]';
      case '4:3': return 'aspect-[3/4]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-[9/16]';
    }
  };

  return (
    <div className="p-3 space-y-3 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-2 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📷 EXIF-Free Pro Camera
          </h2>
          <p className="text-[10px] text-zinc-400">Raw frame canvas capture with GPS & metadata scrubbing</p>
        </div>
        <span className="text-[9px] font-mono bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold px-2 py-0.5 rounded-lg">
          🛡️ SCRUB ACTIVE
        </span>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      {error ? (
        <div className="bg-red-950/90 border border-red-500/50 p-6 rounded-2xl text-center space-y-3">
          <div className="text-red-400 font-bold text-sm">⚠️ Camera Hardware Blocked</div>
          <p className="text-xs text-zinc-300">
            Android media stream error: <br/>
            <span className="font-mono text-[10px] text-red-300">{error}</span>
          </p>
          <button
            onClick={startCamera}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            🔄 Grant Permission & Retry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl ${getAspectStyle()} flex items-center justify-center`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                filter: mode === 'pro' && exposure !== 0 ? `brightness(${100 + exposure * 25}%)` : 'none'
              }}
            />

            {showGrid && (
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

            {countdown > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-30">
                <span className="text-6xl font-black text-cyan-400 animate-ping">{countdown}</span>
              </div>
            )}

            <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20">
              <button
                onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                className="px-2.5 py-1.5 bg-black/70 backdrop-blur-md border border-zinc-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1"
              >
                🔄 Flip
              </button>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 rounded-xl border text-[10px] font-bold ${showGrid ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300' : 'bg-black/70 border-zinc-700 text-zinc-400'}`}
                >
                  🌐 Grid
                </button>
                <button
                  onClick={() => setTimer(prev => prev === 0 ? 3 : prev === 3 ? 10 : 0)}
                  className={`p-1.5 rounded-xl border text-[10px] font-bold ${timer > 0 ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300' : 'bg-black/70 border-zinc-700 text-zinc-400'}`}
                >
                  ⏱️ {timer > 0 ? `${timer}s` : 'Off'}
                </button>
              </div>
            </div>

            <div className="absolute top-12 left-3 z-20 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-zinc-800 flex space-x-1 text-[9px] font-bold">
              {['full', '16:9', '4:3', '1:1'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2 py-0.5 rounded-lg ${aspectRatio === ratio ? 'bg-cyan-500 text-black' : 'text-zinc-400'}`}
                >
                  {ratio.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="absolute bottom-16 inset-x-4 z-20 bg-black/75 backdrop-blur-md p-2.5 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-[10px] text-cyan-400 font-bold w-12">🔍 {zoom.toFixed(1)}x</span>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {mode === 'pro' && (
                <div className="flex items-center space-x-3 pt-1 border-t border-zinc-800">
                  <span className="text-[10px] text-emerald-400 font-bold w-12">☀️ {exposure > 0 ? `+${exposure}` : exposure}</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={exposure}
                    onChange={(e) => setExposure(parseInt(e.target.value))}
                    className="flex-1 accent-emerald-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="absolute bottom-3 inset-x-3 flex justify-center items-center z-20">
              <button
                onClick={handleShutter}
                className={`w-14 h-14 rounded-full border-4 transition-all flex items-center justify-center shadow-xl ${
                  isRecording
                    ? 'border-red-400 bg-red-600 animate-pulse scale-110'
                    : 'border-white bg-cyan-500 hover:bg-cyan-400 active:scale-90'
                }`}
              >
                <div className={`rounded-full border-2 border-black/40 ${isRecording ? 'w-5 h-5 bg-white rounded-sm' : 'w-10 h-10 bg-white/20'}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold text-center">
            <button
              onClick={() => setMode('photo')}
              className={`py-2 rounded-lg transition-all ${mode === 'photo' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'}`}
            >
              📷 Photo
            </button>
            <button
              onClick={() => setMode('video')}
              className={`py-2 rounded-lg transition-all ${mode === 'video' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'}`}
            >
              🎥 Video
            </button>
            <button
              onClick={() => setMode('pro')}
              className={`py-2 rounded-lg transition-all ${mode === 'pro' ? 'bg-cyan-500 text-black shadow' : 'text-zinc-400'}`}
            >
              🎛️ Pro
            </button>
          </div>
        </div>
      )}

      <ToolFooter
        title="EXIF-Free Metadata Sanitizer"
        details="Captures raw video frames directly into HTML5 canvas, saving directly to DCIM/SovereignTools gallery."
        disclaimer="Exported images are saved locally to phone storage with zero tracking footprints."
      />
    </div>
  );
}

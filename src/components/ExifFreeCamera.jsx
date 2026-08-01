import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [mode, setMode] = useState('photo'); // 'photo', 'video', 'pro', 'burst'
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState(null);

  const startCamera = async () => {
    setError('');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Try primary rear camera with audio, then fall back to video-only if audio permissions fail
    const constraintSets = [
      { video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true },
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
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Canvas export strips all EXIF metadata (GPS, timestamp, phone model)
    const cleanImageData = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedMedia(cleanImageData);

    // Trigger direct download/save link
    const link = document.createElement('a');
    link.href = cleanImageData;
    link.download = `Sovereign_Photo_${Date.now()}.jpg`;
    link.click();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📷 EXIF-Free Pro Camera
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Captures raw video frames to canvas, stripping all GPS and hardware device metadata.
        </p>
      </div>

      {error ? (
        <div className="bg-red-950/90 border border-red-500/50 p-6 rounded-2xl text-center space-y-3">
          <div className="text-red-400 font-bold text-sm">⚠️ Camera Access Needed</div>
          <p className="text-xs text-zinc-300">
            Android blocked camera permissions or media stream failed: <br/>
            <span className="font-mono text-[10px] text-red-300">{error}</span>
          </p>
          <button
            onClick={startCamera}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            🔄 Grant Permission & Enable Camera
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl aspect-[3/4] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: `scale(${zoom})` }}
          />

          {/* Top Camera Controls Overlay */}
          <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20">
            <button
              onClick={toggleCamera}
              className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-zinc-700 text-white font-bold text-xs rounded-xl"
            >
              🔄 Flip
            </button>
            <span className="text-[10px] font-mono bg-emerald-500/80 text-black font-bold px-2.5 py-1 rounded-lg">
              🛡️ EXIF SCRUBBED
            </span>
          </div>

          {/* Zoom Slider Overlay */}
          <div className="absolute bottom-20 inset-x-6 z-20 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-zinc-800 flex items-center space-x-3">
            <span className="text-[10px] text-zinc-400 font-bold">🔍 {zoom.toFixed(1)}x</span>
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

          {/* Bottom Shutter Overlay */}
          <div className="absolute bottom-3 inset-x-3 flex justify-center items-center z-20">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-400 active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-red-500/30"
            >
              <div className="w-12 h-12 rounded-full border-2 border-black/40" />
            </button>
          </div>
        </div>
      )}

      <ToolFooter
        title="EXIF-Free Metadata Sanitizer"
        details="Captures video frames directly into an isolated HTML5 canvas context, stripping EXIF headers, GPS coordinates, timestamps, and camera serial numbers."
        disclaimer="Exported images are saved locally to device storage with zero tracking footprints."
      />
    </div>
  );
}

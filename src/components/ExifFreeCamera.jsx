import React, { useState, useRef, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [mode, setMode] = useState('photo'); // 'photo' or 'video'
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [lastMedia, setLastMedia] = useState(null);

  // Request hardware permission
  const requestCameraAccess = async () => {
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Camera permission denied.");
    } finally {
      setIsInitializing(false);
    }
  };

  // Start video stream whenever facingMode changes or permission granted
  useEffect(() => {
    if (!hasPermission) return;
    let activeStream = null;

    async function startStream() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: mode === 'video'
        });
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error starting camera stream:", err);
      }
    }

    startStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasPermission, facingMode, mode]);

  // Video recording timer
  useEffect(() => {
    let timer = null;
    if (isRecording) {
      timer = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Take EXIF-Free Snapshot
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Export raw clean image blob (strips metadata natively)
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setLastMedia({ type: 'image', url });

      // Trigger automatic direct file download
      const a = document.createElement('a');
      a.href = url;
      a.download = `sovereign_photo_${Date.now()}.png`;
      a.click();
    }, 'image/png');
  };

  // Toggle Video Recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop Recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start Recording
      const stream = videoRef.current?.srcObject;
      if (!stream) return;

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setLastMedia({ type: 'video', url });

        const a = document.createElement('a');
        a.href = url;
        a.download = `sovereign_video_${Date.now()}.webm`;
        a.click();
      };

      recorder.start();
      setIsRecording(true);
    }
  };

  // Flip Camera Front / Back
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="text-5xl mb-4">📷</div>
        <h2 className="text-xl font-bold text-white mb-2">Camera & Video Engine</h2>
        <p className="text-sm text-zinc-400 mb-6">Full-screen off-grid media capture with automatic EXIF metadata stripping.</p>
        <button
          onClick={requestCameraAccess}
          disabled={isInitializing}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg"
        >
          {isInitializing ? 'Opening Camera...' : 'Enable Full-Screen Camera'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[85vh] bg-black rounded-2xl overflow-hidden flex flex-col justify-between select-none">
      
      {/* 1. Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
        {/* Recording Timer Indicator */}
        {isRecording ? (
          <div className="flex items-center space-x-2 bg-red-600/90 text-white text-xs px-3 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span className="font-mono font-bold">
              {Math.floor(recordTime / 60)}:{('0' + (recordTime % 60)).slice(-2)}
            </span>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 font-mono">
            {mode === 'photo' ? '📷 EXIF-STRIP PHOTO' : '🎥 SECURE VIDEO'}
          </div>
        )}

        {/* Top Right Action Icons */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleFacingMode}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full text-lg border border-zinc-700"
            title="Flip Camera"
          >
            🔄
          </button>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full text-sm font-bold border border-zinc-700"
            title="Module Info"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* 2. Full Screen Camera Viewfinder */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="w-full h-full object-cover"
        />

        {/* Info / Disclaimer Drawer */}
        {showInfo && (
          <div className="absolute inset-0 z-30 bg-black/95 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-lg font-bold text-white">Camera Security Specs</h3>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="text-zinc-400 hover:text-white font-bold"
                >
                  ✕ Close
                </button>
              </div>
              <p className="text-xs text-zinc-300">
                This module captures direct raw frames onto an unlinked canvas before encoding them. GPS tags, timestamp footprints, and phone hardware IDs are scrubbed automatically upon save.
              </p>
            </div>
            <ToolFooter
              title="EXIF-Free Camera & Video"
              details="Captures photos and webm video recordings directly to local device storage without embedding device metadata."
              disclaimer="Never share captured media if background physical landmarks could reveal sensitive location details."
            />
          </div>
        )}
      </div>

      {/* 3. Bottom Camera Controls & Shutter */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-4">
        
        {/* Mode Switcher */}
        <div className="flex bg-zinc-900/80 p-1 rounded-full border border-zinc-800 text-xs font-bold">
          <button
            onClick={() => { setMode('photo'); setIsRecording(false); }}
            className={`px-4 py-1.5 rounded-full transition-all ${
              mode === 'photo' ? 'bg-zinc-100 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            PHOTO
          </button>
          <button
            onClick={() => { setMode('video'); }}
            className={`px-4 py-1.5 rounded-full transition-all ${
              mode === 'video' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            VIDEO
          </button>
        </div>

        {/* Main Shutter Row */}
        <div className="w-full flex justify-around items-center pt-2">
          
          {/* Gallery Preview / Thumbnail */}
          <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
            {lastMedia ? (
              lastMedia.type === 'image' ? (
                <img src={lastMedia.url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-red-500 font-bold">🎥</span>
              )
            ) : (
              <span className="text-xs text-zinc-600">Empty</span>
            )}
          </div>

          {/* Big Native Shutter Button */}
          {mode === 'photo' ? (
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
          ) : (
            <button
              onClick={toggleRecording}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <div
                className={`transition-all duration-200 ${
                  isRecording
                    ? 'w-8 h-8 rounded-sm bg-red-600'
                    : 'w-16 h-16 rounded-full bg-red-600'
                }`}
              ></div>
            </button>
          )}

          {/* Quick Flip Placeholder for alignment */}
          <button
            onClick={toggleFacingMode}
            className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-lg text-white"
          >
            🔄
          </button>
        </div>

      </div>

    </div>
  );
}

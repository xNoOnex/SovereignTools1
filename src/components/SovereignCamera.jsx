import React, { useRef, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function SovereignCamera({ onNavigate }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [facingMode, setFacingMode] = useState('environment');
  const [showGrid, setShowGrid] = useState(true);
  const [mode, setMode] = useState('Photo'); // 'Photo' | 'Video' | 'QR' | 'Pro'
  const [streamActive, setStreamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  // Recording Timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordSeconds(prev => prev + 1), 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startStream = async () => {
    setStreamActive(false);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: mode === 'Video'
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: mode === 'Video' });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStreamActive(true);
        };
      }
    } catch (e) {
      setStatusMsg('❌ Camera initialization failed. Check permissions.');
    }
  };

  useEffect(() => {
    startStream();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, mode]);

  // PHOTO CAPTURE VIA CANVAS
  const takePhoto = async () => {
    if (!videoRef.current || !streamActive) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const base64Data = dataUrl.split(',')[1];
      const fileName = `SOV_IMG_${Date.now()}.jpg`;

      try {
        await Filesystem.writeFile({
          path: `Pictures/${fileName}`,
          data: base64Data,
          directory: Directory.ExternalStorage,
          recursive: true
        });
      } catch (e) {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.ExternalStorage
        });
      }

      setStatusMsg(`📷 Photo Saved: ${fileName}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Failed to capture photo.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  // VIDEO RECORDING VIA MEDIARECORDER
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (!videoRef.current || !videoRef.current.srcObject) return;
      recordedChunksRef.current = [];

      try {
        const stream = videoRef.current.srcObject;
        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const fileName = `SOV_VID_${Date.now()}.mp4`;
            try {
              await Filesystem.writeFile({
                path: `Movies/${fileName}`,
                data: base64Data,
                directory: Directory.ExternalStorage,
                recursive: true
              });
            } catch (e) {
              await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.ExternalStorage
              });
            }
            setStatusMsg(`🎥 Video Saved: ${fileName}`);
            setTimeout(() => setStatusMsg(''), 3000);
          };
        };

        mediaRecorder.start(1000);
        setIsRecording(true);
        setStatusMsg('🔴 Recording Video...');
      } catch (err) {
        setStatusMsg('❌ Video recording failed to start.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    }
  };

  const handleShutterClick = () => {
    if (mode === 'Video') {
      toggleRecording();
    } else {
      takePhoto();
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col justify-between z-40 font-sans overflow-hidden">
      
      {/* VIEWFINDER */}
      <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover" 
        />

        {!streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs">
            Initializing EXIF-Free Viewfinder Feed...
          </div>
        )}

        {statusMsg && (
          <div className="absolute top-16 left-4 right-4 z-30 bg-black/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2.5 px-3 rounded-2xl text-center shadow-2xl animate-fadeIn">
            {statusMsg}
          </div>
        )}

        {isRecording && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-600/90 text-white font-mono text-xs font-bold py-1.5 px-4 rounded-full border border-red-400 shadow-2xl flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span>REC {formatTimer(recordSeconds)}</span>
          </div>
        )}

        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/10">
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-b border-white/15"></div>
            <div className="border-r border-white/15"></div>
            <div className="border-r border-white/15"></div>
            <div></div>
          </div>
        )}

        {/* TOP CONTROLS */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button onClick={() => onNavigate && onNavigate('gallery')} className="bg-black/70 border border-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            ❌ Exit / Gallery
          </button>
          <div className="flex gap-2">
            <button onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')} className="bg-black/70 border border-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🔄 Flip
            </button>
            <button onClick={() => setShowGrid(!showGrid)} className="bg-black/70 border border-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🌐 Grid
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SHUTTER & MODE TRAY */}
      <div className="bg-black border-t border-zinc-900 p-4 space-y-4 shrink-0 pb-8">
        <div className="flex justify-around items-center max-w-xs mx-auto">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 flex gap-1">
            {['Photo', 'Video', 'QR', 'Pro'].map(m => (
              <button 
                key={m} 
                onClick={() => setMode(m)} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === m ? 'theme-accent-bg text-black shadow' : 'text-zinc-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* ACTIVE SHUTTER BUTTON */}
          <button 
            onClick={handleShutterClick}
            className={`w-16 h-16 rounded-full p-1 border-4 border-black shadow-2xl flex items-center justify-center active:scale-90 transition-transform ${
              mode === 'Video' 
                ? isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-500' 
                : 'theme-accent-bg'
            }`}
          >
            <div className={`w-full h-full rounded-full border-2 ${mode === 'Video' ? 'border-white/50' : 'border-black/40'}`}></div>
          </button>

        </div>
      </div>

    </div>
  );
}

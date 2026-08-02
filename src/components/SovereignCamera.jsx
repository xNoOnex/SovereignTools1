import React, { useState, useRef, useEffect } from 'react';

export function SovereignCamera({ onNavigate }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [mode, setMode] = useState('Photo'); // 'Photo' | 'Video' | 'QR'
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [errorMsg, setErrorMsg] = useState('');
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  const canvasRef = useRef(null);

  const startCamera = async (currentFacingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: mode === 'Video'
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Camera access error: ' + err.message);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [facingMode, mode]);

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const newImage = {
      name: `SOV_IMG_${Date.now()}.jpg`,
      path: `SOV_IMG_${Date.now()}.jpg`,
      src: dataUrl,
      ext: 'jpg'
    };

    const existing = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
    localStorage.setItem('sovereign_custom_gallery', JSON.stringify([newImage, ...existing]));
    
    videoRef.current.style.opacity = 0;
    setTimeout(() => { videoRef.current.style.opacity = 1; }, 100);
  };

  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9,opus' });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); 
      setIsRecording(true);
    } catch (e) {
      setErrorMsg('Recording failed: ' + e.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Delay to allow final chunks to flush before building the blob
      setTimeout(() => {
        setRecordedChunks(currentChunks => {
            if(currentChunks.length === 0) return currentChunks;
            const blob = new Blob(currentChunks, { type: 'video/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                const newVideo = {
                  name: `SOV_VID_${Date.now()}.webm`,
                  path: `SOV_VID_${Date.now()}.webm`,
                  src: base64data,
                  ext: 'webm'
                };
                const existing = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
                localStorage.setItem('sovereign_custom_gallery', JSON.stringify([newVideo, ...existing]));
            };
            return []; // reset chunks
        });
      }, 500);
    }
  };

  // QR UI Logic
  useEffect(() => {
    let animationFrameId;
    const scanQRCode = () => {
      if (mode === 'QR' && videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
      if (mode === 'QR') {
          animationFrameId = requestAnimationFrame(scanQRCode);
      }
    };
    if (mode === 'QR') { scanQRCode(); }
    return () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); };
  }, [mode, stream]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans select-none">
      
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => onNavigate('home')} className="bg-zinc-900/80 backdrop-blur border border-zinc-700 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
          <span className="text-red-400">✖</span> Exit
        </button>

        <div className="flex gap-2">
          <button onClick={flipCamera} className="bg-zinc-900/80 backdrop-blur border border-zinc-700 text-white px-3 py-2 rounded-full text-xs font-bold">
            🔄 Flip
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="absolute top-20 left-4 right-4 bg-red-950/80 border border-red-900 text-red-200 p-3 rounded-2xl text-xs font-bold text-center z-20">
          {errorMsg}
        </div>
      )}

      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        {!stream && !errorMsg && <div className="text-zinc-600 font-mono text-xs animate-pulse">Initializing Hardware...</div>}
        
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={mode !== 'Video'}
          className="min-w-full min-h-full object-cover transition-opacity duration-100"
        />

        {mode === 'QR' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-emerald-400/50 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-3xl"></div>
              <div className="absolute inset-0 bg-emerald-400/10 animate-pulse"></div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-12 px-6 flex flex-col items-center gap-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        
        <div className="flex gap-4 bg-zinc-900/80 backdrop-blur px-2 py-1.5 rounded-full border border-zinc-800">
          {['Photo', 'Video', 'QR'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === m ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400'}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="h-20 flex items-center justify-center w-full">
          {mode === 'Photo' && (
            <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-transparent flex items-center justify-center active:scale-95 transition-transform">
              <div className="w-14 h-14 rounded-full theme-accent-bg"></div>
            </button>
          )}

          {mode === 'Video' && (
            <button onClick={isRecording ? stopRecording : startRecording} className="w-16 h-16 rounded-full border-4 border-white bg-transparent flex items-center justify-center active:scale-95 transition-transform">
              <div className={`rounded-full transition-all duration-300 ${isRecording ? 'w-8 h-8 bg-red-500 rounded-lg' : 'w-14 h-14 bg-red-500'}`}></div>
            </button>
          )}

          {mode === 'QR' && (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-4 py-2 rounded-xl">
              Point at code to decode
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

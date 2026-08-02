import React, { useRef, useState, useEffect } from 'react';

export function SovereignCamera({ onNavigate }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [facingMode, setFacingMode] = useState('environment');
  const [showGrid, setShowGrid] = useState(true);
  const [mode, setMode] = useState('Photo');
  const [streamActive, setStreamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

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
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      setStatusMsg('❌ Camera access error.');
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

  // BULLETPROOF LOCAL STORAGE PHOTO SAVE FOR GALLERY
  const takePhoto = async () => {
    if (!videoRef.current || !streamActive) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const fileName = `SOV_IMG_${Date.now()}.jpg`;

      // Save directly to localStorage vault so it appears instantly in Secure Gallery
      const existing = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
      const newMedia = {
        name: fileName,
        path: `Pictures/${fileName}`,
        src: dataUrl,
        ext: 'jpg'
      };
      localStorage.setItem('sovereign_custom_gallery', JSON.stringify([newMedia, ...existing]));

      setStatusMsg(`📷 Photo Saved to Secure Gallery!`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Failed to capture photo.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

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
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64Video = reader.result;
            const fileName = `SOV_VID_${Date.now()}.mp4`;

            const existing = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
            const newMedia = {
              name: fileName,
              path: `Movies/${fileName}`,
              src: base64Video,
              ext: 'mp4'
            };
            localStorage.setItem('sovereign_custom_gallery', JSON.stringify([newMedia, ...existing]));

            setStatusMsg(`🎥 Video Saved to Secure Gallery!`);
            setTimeout(() => setStatusMsg(''), 3000);
          };
        };

        mediaRecorder.start(1000);
        setIsRecording(true);
        setStatusMsg('🔴 Recording Video...');
      } catch (err) {
        setStatusMsg('❌ Video recording failed.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    }
  };

  const handleShutterClick = () => {
    if (mode === 'Video') toggleRecording();
    else takePhoto();
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col justify-between z-40 font-sans overflow-hidden">
      
      <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {!streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs">
            Initializing Viewfinder Feed...
          </div>
        )}

        {statusMsg && (
          <div className="absolute top-16 left-4 right-4 z-30 theme-accent-badge py-2.5 px-3 rounded-2xl text-center shadow-2xl font-bold text-xs">
            {statusMsg}
          </div>
        )}

        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/10">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border-r border-b border-white/10"></div>)}
          </div>
        )}

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

      <div className="bg-black border-t border-zinc-900 p-4 space-y-4 shrink-0 pb-8">
        <div className="flex justify-around items-center max-w-xs mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 flex gap-1">
            {['Photo', 'Video', 'QR', 'Pro'].map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${mode === m ? 'theme-accent-bg text-black shadow' : 'text-zinc-400'}`}>
                {m}
              </button>
            ))}
          </div>

          <button onClick={handleShutterClick} className={`w-16 h-16 rounded-full p-1 border-4 border-black shadow-2xl flex items-center justify-center active:scale-90 transition-transform ${mode === 'Video' ? (isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-500') : 'theme-accent-bg'}`}>
            <div className="w-full h-full rounded-full border-2 border-black/40"></div>
          </button>
        </div>
      </div>

    </div>
  );
}

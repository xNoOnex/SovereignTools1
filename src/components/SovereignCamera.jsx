import React, { useRef, useState, useEffect } from 'react';

export function SovereignCamera({ onNavigate }) {
  const videoRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [showGrid, setShowGrid] = useState(true);
  const [mode, setMode] = useState('Photo');
  const [streamActive, setStreamActive] = useState(false);

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
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStreamActive(true);
        };
      }
    } catch (e) {
      console.log("Camera stream error:", e);
    }
  };

  useEffect(() => {
    startStream();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col justify-between z-40 font-sans overflow-hidden">
      <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
        {/* MANDATORY MUTED & PLAYSINLINE FOR ANDROID CHROMIUM AUTOPLAY */}
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
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${mode === m ? 'bg-cyan-500 text-black' : 'text-zinc-400'}`}>
                {m}
              </button>
            ))}
          </div>
          <button className="w-16 h-16 rounded-full bg-cyan-500 p-1 border-4 border-black shadow-lg flex items-center justify-center active:scale-90 transition-transform">
            <div className="w-full h-full rounded-full border-2 border-black/40"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

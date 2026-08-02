import React, { useRef, useState, useEffect } from 'react';

export function SovereignCamera({ onNavigate }) {
  const videoRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState('1.0x');
  const [filter, setFilter] = useState('none');
  const [mode, setMode] = useState('Photo');
  const [streamActive, setStreamActive] = useState(false);

  const filters = [
    { id: 'none', label: 'Normal', icon: '📷' },
    { id: 'grayscale(100%)', label: 'B&W', icon: '🖤' },
    { id: 'sepia(100%)', label: 'Sepia', icon: '📜' },
    { id: 'hue-rotate(90deg) contrast(150%)', label: 'Matrix', icon: '🟢' },
    { id: 'saturate(200%)', label: 'Vivid', icon: '🌈' },
    { id: 'contrast(125%) brightness(110%)', label: 'Warm', icon: '🔥' }
  ];

  const startStream = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (e) {
      console.log("Camera access error:", e);
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

  const toggleFlip = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col justify-between z-40 select-none font-sans overflow-hidden">
      {/* VIEWFINDER CONTAINER */}
      <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ filter }}
          className="w-full h-full object-cover"
        />

        {!streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs">
            Initializing EXIF-Free Viewfinder...
          </div>
        )}

        {/* RULE OF THIRDS GRID OVERLAY */}
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

        {/* TOP OVERLAY CONTROLS */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            onClick={() => onNavigate && onNavigate('gallery')}
            className="bg-black/60 backdrop-blur-md border border-zinc-700/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg"
          >
            ❌ Exit / Gallery
          </button>
          <div className="flex gap-2">
            <button
              onClick={toggleFlip}
              className="bg-black/60 backdrop-blur-md border border-zinc-700/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg"
            >
              🔄 Flip
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`backdrop-blur-md border text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg transition-all ${
                showGrid 
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50' 
                  : 'bg-black/60 text-white border-zinc-700/80'
              }`}
            >
              🌐 Grid
            </button>
          </div>
        </div>

        {/* BOTTOM VIEWFINDER CONTROLS (ZOOM & FILTERS) */}
        <div className="absolute bottom-4 left-0 right-0 px-4 space-y-3 z-10">
          {/* ZOOM SELECTOR */}
          <div className="flex justify-center gap-2">
            {['1.0x', '2.0x', '3.0x'].map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition-all ${
                  zoom === z 
                    ? 'bg-cyan-500 text-black border-cyan-400 scale-105' 
                    : 'bg-black/60 text-zinc-300 border-zinc-700/80'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* FILTER CAROUSEL */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md shrink-0 flex items-center gap-1 transition-all ${
                  filter === f.id
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 scale-105'
                    : 'bg-black/60 border-zinc-800 text-zinc-400'
                }`}
              >
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SHUTTER & MODE DECK */}
      <div className="bg-black border-t border-zinc-900 p-4 space-y-4 shrink-0 pb-8">
        <div className="flex justify-around items-center max-w-xs mx-auto">
          {/* MODE SELECTOR */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 flex items-center gap-1">
            {['Photo', 'Video', 'QR', 'Pro'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === m 
                    ? 'bg-cyan-500 text-black shadow' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'Photo' && '📷 '}
                {m === 'Video' && '📹 '}
                {m === 'QR' && '🔍 '}
                {m === 'Pro' && '⚃ '}
                {m}
              </button>
            ))}
          </div>

          {/* SHUTTER BUTTON */}
          <button className="w-16 h-16 rounded-full bg-cyan-500 p-1 border-4 border-black shadow-lg shadow-cyan-500/30 flex items-center justify-center active:scale-90 transition-transform">
            <div className="w-full h-full rounded-full border-2 border-black/40"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

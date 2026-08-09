import React, { useState, useEffect, useRef } from 'react';

export default function SovereignCamera({ onNavigate, navigateTo }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    const [mode, setMode] = useState('QR'); // 'Photo', 'Video', 'QR'
    const [torch, setTorch] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [scannedResult, setScannedResult] = useState(null);
    const [copyToast, setCopyToast] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');

    // Start Camera Stream
    useEffect(() => {
        let stream = null;
        async function startCamera() {
            try {
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(t => t.stop());
                }
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: mode === 'Video'
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.log("Camera access error: " + err.message);
            }
        }
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, mode]);

    // Hardware Torch Control
    const toggleTorch = async () => {
        try {
            if (videoRef.current && videoRef.current.srcObject) {
                const track = videoRef.current.srcObject.getVideoTracks()[0];
                const caps = track.getCapabilities ? track.getCapabilities() : {};
                if (caps.torch) {
                    await track.applyConstraints({ advanced: [{ torch: !torch }] });
                    setTorch(!torch);
                } else {
                    alert("Hardware torch/flash not supported on this lens.");
                }
            }
        } catch (e) {
            alert("Torch error: " + e.message);
        }
    };

    // Hardware Zoom Control
    const applyZoom = async (level) => {
        setZoom(level);
        try {
            if (videoRef.current && videoRef.current.srcObject) {
                const track = videoRef.current.srcObject.getVideoTracks()[0];
                const caps = track.getCapabilities ? track.getCapabilities() : {};
                if (caps.zoom) {
                    await track.applyConstraints({ advanced: [{ zoom: level }] });
                }
            }
        } catch (e) {}
    };

    // Continuous QR Frame Processing
    useEffect(() => {
        let interval = null;
        if (mode === 'QR') {
            interval = setInterval(() => {
                if (!videoRef.current || !canvasRef.current) return;
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Use Android Webview Native BarcodeDetector if available
                    if ('BarcodeDetector' in window) {
                        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                        detector.detect(canvas).then(barcodes => {
                            if (barcodes.length > 0) {
                                handleDecodedPayload(barcodes[0].rawValue);
                            }
                        }).catch(() => {});
                    }
                }
            }, 400);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [mode]);

    const handleDecodedPayload = (data) => {
        if (!data || data === scannedResult) return;
        setScannedResult(data);

        // Auto-copy to Clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(data);
            }
        } catch (e) {}

        // Store for Comms Auto-Fill
        localStorage.setItem('sovereign_pending_sdp', data);

        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 3000);
    };

    const handleInjectComms = () => {
        const nav = onNavigate || navigateTo;
        if (typeof nav === 'function') {
            nav('comm');
        } else {
            alert("SDP Payload copied to clipboard and stored in memory! Open Encrypted Comms to auto-fill.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col justify-between z-50 select-none">
            {/* HIDDEN SCANNER CANVAS */}
            <canvas ref={canvasRef} className="hidden" />

            {/* TOP CONTROL BAR */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <button 
                    onClick={() => {
                        const nav = onNavigate || navigateTo;
                        if (typeof nav === 'function') nav('home');
                    }}
                    className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95">
                    ✕ Exit
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={toggleTorch}
                        className={`border text-xs font-bold px-3 py-2 rounded-full backdrop-blur-md transition-all ${torch ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900/80 text-zinc-300 border-zinc-700'}`}>
                        {torch ? '⚡ Flash ON' : '⚡ Flash OFF'}
                    </button>

                    <button 
                        onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                        className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-3 py-2 rounded-full backdrop-blur-md active:scale-95">
                        🔄 Flip
                    </button>
                </div>
            </div>

            {/* MAIN CAMERA VIEWFINDER */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                />

                {/* QR TARGET RETICLE */}
                {mode === 'QR' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl relative shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                        </div>
                        <span className="mt-4 text-[10px] font-mono font-bold text-emerald-400 bg-black/70 px-3 py-1 rounded-full border border-emerald-800 tracking-widest uppercase">
                            Align QR Code Within Frame
                        </span>
                    </div>
                )}

                {/* TOAST NOTIFICATION */}
                {copyToast && (
                    <div className="absolute top-20 bg-emerald-500 text-black text-[11px] font-black px-5 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)] z-30 tracking-widest uppercase animate-bounce">
                        ✓ COPIED TO CLIPBOARD!
                    </div>
                )}

                {/* SCAN DETECTED ACTION CARD */}
                {scannedResult && (
                    <div className="absolute bottom-6 left-4 right-4 bg-zinc-950/90 border border-emerald-500/80 p-4 rounded-2xl backdrop-blur-md z-40 flex flex-col gap-3 shadow-[0_0_30px_rgba(0,0,0,0.9)] animate-fade-in">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-400 font-mono font-black tracking-widest uppercase flex items-center gap-2">
                                <span>📡</span> QR PAYLOAD DETECTED
                            </span>
                            <button onClick={() => setScannedResult(null)} className="text-zinc-500 hover:text-white text-xs font-bold">✕</button>
                        </div>
                        <p className="text-[10px] text-zinc-300 font-mono truncate bg-black/80 p-2 rounded-lg border border-zinc-800">
                            {scannedResult}
                        </p>
                        <button 
                            onClick={handleInjectComms}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] py-3 rounded-xl tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95">
                            🔗 INJECT INTO ENCRYPTED COMMS
                        </button>
                    </div>
                )}
            </div>

            {/* BOTTOM CONTROL PANEL */}
            <div className="bg-black/90 border-t border-zinc-800 p-6 flex flex-col items-center gap-4 z-20 backdrop-blur-md">
                {/* ZOOM CONTROLS */}
                <div className="flex gap-4 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800">
                    {[1, 2, 3].map(z => (
                        <button 
                            key={z} 
                            onClick={() => applyZoom(z)} 
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${zoom === z ? 'text-amber-400' : 'text-zinc-500'}`}>
                            {z}x
                        </button>
                    ))}
                </div>

                {/* MODE SELECTOR */}
                <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800 w-64 justify-between">
                    {['Photo', 'Video', 'QR'].map(m => (
                        <button 
                            key={m} 
                            onClick={() => { setMode(m); setScannedResult(null); }} 
                            className={`flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all ${mode === m ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}>
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

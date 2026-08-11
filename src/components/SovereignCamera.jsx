import React, { useState, useEffect, useRef } from 'react';
import jsQR from "jsqr";

export function SovereignCamera({ onNavigate, navigateTo }) {
    const navHandler = onNavigate || navigateTo;
    const videoRef = useRef(null);
    const [mode, setMode] = useState("Photo");
    const [torch, setTorch] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [scannedResult, setScannedResult] = useState(null);
    const [copyToast, setCopyToast] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");
    const [isRecording, setIsRecording] = useState(false);
    const [nvgMode, setNvgMode] = useState(false);
    const [nativeZoom, setNativeZoom] = useState(false);
    const [blackout, setBlackout] = useState(false); // Stealth screen dim
    
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const touchDistRef = useRef(null);

    // Initialize Camera with Audio Fallback
    useEffect(() => {
        let activeStream = null;
        const initCamera = async () => {
            const videoConstraints = { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } };
            try {
                // Try requesting audio + video first
                activeStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: mode === "Video"
                });
            } catch (err) {
                console.log("Audio+Video stream failed, falling back to Video-only: " + err.message);
                try {
                    // Fallback: request video only so the screen never goes black
                    activeStream = await navigator.mediaDevices.getUserMedia({
                        video: videoConstraints,
                        audio: false
                    });
                } catch (fallbackErr) {
                    console.log("Camera access error: " + fallbackErr.message);
                }
            }

            if (videoRef.current && activeStream) {
                videoRef.current.srcObject = activeStream;
                videoRef.current.play().catch(e => console.log("Play error:", e));
            }
        };
        initCamera();
        return () => activeStream && activeStream.getTracks().forEach(t => t.stop());
    }, [facingMode, mode]);

    // QR Scanner Loop
    useEffect(() => {
        let scanFrame;
        const scan = () => {
            if (mode !== "QR" || !videoRef.current || videoRef.current.readyState < 2) {
                if (mode === "QR") scanFrame = requestAnimationFrame(scan);
                return;
            }
            
            const video = videoRef.current;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            
            ctx.filter = "contrast(150%) brightness(120%)";
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
            
            if (code && code.data) {
                setScannedResult(code.data);
                try {
                    navigator.clipboard.writeText(code.data);
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 3000);
                } catch (e) {}
            }
            scanFrame = requestAnimationFrame(scan);
        };
        
        if (mode === "QR") scanFrame = requestAnimationFrame(scan);
        else setScannedResult(null);
        
        return () => cancelAnimationFrame(scanFrame);
    }, [mode]);

    const toggleTorch = async () => {
        try {
            const track = videoRef.current.srcObject.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ torch: !torch }] });
            setTorch(!torch);
        } catch (e) {
            alert("Torch hardware restricted or unsupported.");
        }
    };

    const applyZoom = async (level) => {
        let newZoom = Math.min(Math.max(1, level), 5);
        setZoom(newZoom);
        try {
            const track = videoRef.current.srcObject.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
            setNativeZoom(true);
        } catch (e) {
            setNativeZoom(false);
        }
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchDistRef.current = Math.sqrt(dx * dx + dy * dy);
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && touchDistRef.current) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scale = dist / touchDistRef.current;
            applyZoom(zoom * (scale > 1 ? 1.05 : 0.95));
            touchDistRef.current = dist;
        }
    };

    const handleAction = () => {
        if (mode === "Video") {
            if (isRecording) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            } else {
                chunksRef.current = [];
                mediaRecorderRef.current = new MediaRecorder(videoRef.current.srcObject, { mimeType: 'video/webm' });
                mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `stealth_vid_${Date.now()}.webm`;
                    a.click();
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            }
        } else if (mode === "Photo") {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (nvgMode) ctx.filter = "contrast(1.3) brightness(1.5) saturate(1.2)";
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const a = document.createElement('a');
            a.href = canvas.toDataURL("image/jpeg");
            a.download = `stealth_cap_${Date.now()}.jpg`;
            a.click();
        }
    };

    // If Blackout mode is active, display a pure black overlay that wakes on tap
    if (blackout) {
        return (
            <div 
                onClick={() => setBlackout(false)}
                className="fixed inset-0 bg-black z-[9999] flex items-center justify-center cursor-pointer select-none"
            >
                {/* Silent indicator only visible if you know where to look */}
                <div className="w-1 h-1 rounded-full bg-zinc-900"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black flex flex-col justify-between z-50 select-none">
            
            {/* Top Tactical Bar */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-20">
                <button onClick={() => navHandler('home')} className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg">X Exit</button>
                <div className="flex gap-2">
                    <button onClick={() => setBlackout(true)} className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg">🕶️ Dim</button>
                    <button onClick={() => setNvgMode(!nvgMode)} className={`border text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg ${nvgMode ? 'bg-emerald-500/80 border-emerald-400 text-black' : 'bg-zinc-900/80 border-zinc-700 text-white'}`}>🌙 NVG</button>
                    <button onClick={toggleTorch} className={`border text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg ${torch ? 'bg-yellow-500/80 border-yellow-400 text-black' : 'bg-zinc-900/80 border-zinc-700 text-white'}`}>⚡ Flash</button>
                    <button onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")} className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg">🔄 Flip</button>
                </div>
            </div>

            {/* Video Optical Viewport */}
            <div 
                className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => touchDistRef.current = null}
            >
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ 
                        transform: nativeZoom ? 'scale(1)' : `scale(${zoom})`,
                        filter: nvgMode ? 'contrast(1.3) brightness(1.5) saturate(1.2) drop-shadow(0 0 10px rgba(16,185,129,0.2))' : 'none',
                        transition: 'transform 0.1s ease-out, filter 0.3s'
                    }}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                />

                {mode === "QR" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        <div className="w-64 h-64 border-2 border-emerald-500/50 rounded-2xl relative shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-pulse">
                            <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></span>
                            <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></span>
                            <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></span>
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></span>
                        </div>
                        {copyToast && <div className="absolute top-20 bg-emerald-500 text-black font-black text-xs px-4 py-2 rounded-full uppercase tracking-widest shadow-lg animate-bounce">PAYLOAD SECURED</div>}
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-8 flex flex-col items-center gap-6 z-20">
                <div className="flex gap-4 bg-zinc-900/60 px-6 py-2 rounded-full backdrop-blur-md border border-zinc-800">
                    {[1, 2, 3].map(level => (
                        <button key={level} onClick={() => applyZoom(level)} className={`text-xs font-bold transition-all ${Math.round(zoom) === level ? 'text-emerald-400 scale-110' : 'text-zinc-500 hover:text-white'}`}>{level}x</button>
                    ))}
                </div>

                {mode !== "QR" ? (
                    <button onClick={handleAction} className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                        <div className={`w-12 h-12 rounded-full ${mode === "Video" ? (isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-500') : 'bg-white'}`}></div>
                    </button>
                ) : (
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-900/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 animate-ping"></div>
                    </div>
                )}

                <div className="flex gap-6 bg-zinc-900/80 px-6 py-2.5 rounded-full backdrop-blur-md border border-zinc-800 shadow-xl">
                    {["Photo", "Video", "QR"].map(m => (
                        <button key={m} onClick={() => { setMode(m); setIsRecording(false); }} className={`text-xs font-bold tracking-widest uppercase transition-all ${mode === m ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-zinc-500'}`}>{m}</button>
                    ))}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export function SovereignCamera({ onNavigate, navigateTo }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [mode, setMode] = useState('QR');
    const [torch, setTorch] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [scannedResult, setScannedResult] = useState(null);
    const [copyToast, setCopyToast] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const [isRecording, setIsRecording] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        let activeStream = null;
        async function initCamera() {
            try {
                activeStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: mode === 'Video'
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = activeStream;
                    await videoRef.current.play().catch(() => {});
                }
            } catch (err) {
                console.log("Camera error: " + err.message);
            }
        }
        initCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, mode]);

    const toggleTorch = async () => {
        try {
            const track = videoRef.current.srcObject.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ torch: !torch }] });
            setTorch(!torch);
        } catch (e) { alert("Torch not supported on this lens."); }
    };

    const applyZoom = async (level) => {
        setZoom(level);
        try {
            const track = videoRef.current.srcObject.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ zoom: level }] });
        } catch (e) {}
    };

    const handleRecord = () => {
        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            chunksRef.current = [];
            mediaRecorderRef.current = new MediaRecorder(videoRef.current.srcObject, { mimeType: 'video/webm' });
            mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stealth_video_${Date.now()}.webm`;
                a.click();
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };

    useEffect(() => {
        let interval = null;
        if (mode === 'QR') {
            interval = setInterval(() => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas || video.readyState < 2) return;
                
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                try {
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imgData.data, imgData.width, imgData.height);
                    if (code) {
                        setScannedResult(code.data);
                        try { navigator.clipboard.writeText(code.data); } catch(e){}
                        localStorage.setItem('sovereign_pending_sdp', code.data);
                        setCopyToast(true);
                        setTimeout(() => setCopyToast(false), 3000);
                    }
                } catch(e) {}
            }, 400);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [mode]);

    const navHandler = (target) => {
        const nav = onNavigate || navigateTo;
        if (nav) nav(target);
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col justify-between z-50 select-none">
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <button onClick={() => navHandler('home')} className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95">✕ Exit</button>
                <div className="flex gap-2">
                    <button onClick={toggleTorch} className={`border text-xs font-bold px-3 py-2 rounded-full backdrop-blur-md ${torch ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900/80 text-zinc-300 border-zinc-700'}`}>{torch ? '⚡ Flash ON' : '⚡ Flash OFF'}</button>
                    <button onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')} className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-3 py-2 rounded-full backdrop-blur-md active:scale-95">🔄 Flip</button>
                </div>
            </div>
            
            <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                
                {mode === 'QR' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl relative shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse"></div>
                        <span className="mt-4 text-[10px] font-mono font-bold text-emerald-400 bg-black/70 px-3 py-1 rounded-full border border-emerald-800 tracking-widest uppercase">Align QR Code</span>
                    </div>
                )}
                
                {copyToast && <div className="absolute top-20 bg-emerald-500 text-black text-[11px] font-black px-5 py-2 rounded-full z-30 uppercase animate-bounce">✓ COPIED!</div>}
                
                {scannedResult && (
                    <div className="absolute bottom-6 left-4 right-4 bg-zinc-950/90 border border-emerald-500/80 p-4 rounded-2xl z-40 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-400 font-mono font-black uppercase">📡 PAYLOAD DETECTED</span>
                            <button onClick={() => setScannedResult(null)} className="text-zinc-500 text-xs font-bold">✕</button>
                        </div>
                        <p className="text-[10px] text-zinc-300 font-mono truncate bg-black/80 p-2 rounded-lg">{scannedResult}</p>
                        <button onClick={() => navHandler('comm')} className="bg-emerald-500 text-black font-black text-[11px] py-3 rounded-xl uppercase active:scale-95">🔗 INJECT INTO COMMS</button>
                    </div>
                )}
            </div>

            <div className="bg-black/90 border-t border-zinc-800 p-6 flex flex-col items-center gap-4 z-20 backdrop-blur-md">
                {mode === 'Video' && (
                    <button onClick={handleRecord} className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${isRecording ? 'border-red-500 animate-pulse' : 'border-white'}`}>
                        <div className={`rounded-full ${isRecording ? 'w-6 h-6 bg-red-500 rounded-sm' : 'w-12 h-12 bg-red-500'}`} />
                    </button>
                )}
                
                {mode === 'Photo' && (
                    <button className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90">
                        <div className="w-12 h-12 bg-white rounded-full" />
                    </button>
                )}

                <div className="flex gap-4 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800">
                    {[1, 2, 3].map(z => <button key={z} onClick={() => applyZoom(z)} className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${zoom === z ? 'text-amber-400' : 'text-zinc-500'}`}>{z}x</button>)}
                </div>

                <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800 w-64 justify-between">
                    {['Photo', 'Video', 'QR'].map(m => <button key={m} onClick={() => { setMode(m); setScannedResult(null); setIsRecording(false); }} className={`flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all ${mode === m ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>{m}</button>)}
                </div>
            </div>
        </div>
    );
}

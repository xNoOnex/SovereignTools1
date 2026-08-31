import { Filesystem, Directory } from '@capacitor/filesystem';
import Tesseract from 'tesseract.js';
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export function SovereignCamera({ onNavigate, navigateTo }) {
    const navHandler = onNavigate || navigateTo;
    const videoRef = useRef(null);
    const [mode, setMode] = useState("Photo"); // Photo, Video, QR, OCR
    const [torch, setTorch] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [scannedResult, setScannedResult] = useState(null);
    const [copyToast, setCopyToast] = useState(false);
    const [facingMode, setFacingMode] = useState("environment");
    const [isRecording, setIsRecording] = useState(false);
    const [nvgMode, setNvgMode] = useState(false);
    const [nativeZoom, setNativeZoom] = useState(false);
    const [blackout, setBlackout] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    // Video Recording Payload State
    const [recordedBlob, setRecordedBlob] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const touchDistRef = useRef(null);
    const barcodeDetectorRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    // Hardware Barcode Detector Initialization
    useEffect(() => {
        if ("BarcodeDetector" in window) {
            try {
                barcodeDetectorRef.current = new window.BarcodeDetector({
                    formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix', 'itf', 'pdf417']
                });
            } catch (e) {
                console.log("BarcodeDetector init failed, falling back to jsQR");
            }
        }
    }, []);

    // Camera Stream Lifecycle
    useEffect(() => {
        let activeStream = null;
        const initCamera = async () => {
            const videoConstraints = {
                facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            };
            try {
                activeStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: mode === "Video"
                });
            } catch (err) {
                try {
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

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(t => t.stop());
            }
        };
    }, [facingMode, mode]);

    // Optimized QR Scanner Loop (Paced at ~120ms to prevent thermal throttling)
    useEffect(() => {
        let scanFrame;
        let isScanning = false;

        const scan = async () => {
            if (mode !== "QR" || !videoRef.current || videoRef.current.readyState < 2 || isScanning) {
                if (mode === "QR") scanFrame = requestAnimationFrame(scan);
                return;
            }

            const now = performance.now();
            if (now - lastScanTimeRef.current < 120) {
                scanFrame = requestAnimationFrame(scan);
                return;
            }
            lastScanTimeRef.current = now;

            isScanning = true;
            const video = videoRef.current;
            let detectedData = null;

            if (barcodeDetectorRef.current) {
                try {
                    const barcodes = await barcodeDetectorRef.current.detect(video);
                    if (barcodes && barcodes.length > 0) {
                        detectedData = barcodes[0].rawValue;
                    }
                } catch (e) {}
            }

            if (!detectedData) {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
                    if (code && code.data) {
                        detectedData = code.data;
                    }
                }
            }

            if (detectedData && detectedData !== scannedResult) {
                setScannedResult(detectedData);
                try {
                    navigator.clipboard.writeText(detectedData);
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 3000);
                } catch (e) {}
            }

            isScanning = false;
            if (mode === "QR") scanFrame = requestAnimationFrame(scan);
        };

        if (mode === "QR") {
            scanFrame = requestAnimationFrame(scan);
        } else {
            setScannedResult(null);
        }

        return () => cancelAnimationFrame(scanFrame);
    }, [mode, scannedResult]);

    // Hardware Controls
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
        const newZoom = Math.min(Math.max(1, level), 5);
        setZoom(newZoom);
        try {
            const track = videoRef.current.srcObject.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
            setNativeZoom(true);
        } catch (e) {
            setNativeZoom(false);
        }
    };

    // Pinch-to-Zoom Gesture Handlers
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

    // High-Power Pre-Processed OCR Engine
    const extractText = async () => {
        if (!videoRef.current) return;
        setIsExtracting(true);

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        // Render current video frame
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Canvas Pre-Processing: Grayscale + High Contrast Thresholding
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const v = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
            // Adaptive contrast stretch
            const threshold = v > 128 ? 255 : 0;
            d[i] = threshold;     // R
            d[i + 1] = threshold; // G
            d[i + 2] = threshold; // B
        }
        ctx.putImageData(imgData, 0, 0);

        try {
            const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
            if (text && text.trim()) {
                setScannedResult(text.trim());
                try {
                    navigator.clipboard.writeText(text.trim());
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 3000);
                } catch(e) {}
            } else {
                alert("No readable text detected in current frame.");
            }
        } catch (e) {
            console.error(e);
            alert("OCR Engine Error: " + e.message);
        } finally {
            setIsExtracting(false);
        }
    };

    // Capture & Recording Handlers
    const handleAction = () => {
        if (mode === "OCR") {
            extractText();
            return;
        }

        if (mode === "Video") {
            if (isRecording) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            } else {
                chunksRef.current = [];
                setRecordedBlob(null);
                mediaRecorderRef.current = new MediaRecorder(videoRef.current.srcObject, { mimeType: 'video/webm' });
                mediaRecorderRef.current.ondataavailable = e => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    setRecordedBlob(blob);
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

            const base64Data = canvas.toDataURL('image/jpeg');
            const fileName = `stealth_cap_${Date.now()}.jpg`;
            Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Data
            }).then(() => alert("📸 Photo secured in Vault.")).catch(e => console.error("Vault Error: ", e));
        }
    };

    const handleSaveVideo = async () => {
        if (!recordedBlob) return;
        const reader = new FileReader();
        reader.readAsDataURL(recordedBlob);
        reader.onloadend = async () => {
            const base64Data = reader.result;
            const fileName = `stealth_vid_${Date.now()}.webm`;
            await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Data
            });
            alert("🎥 Video secured in Vault.");
            setRecordedBlob(null);
        };
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col justify-between z-50 select-none">
            {/* STEALTH DIM OVERLAY */}
            {blackout && (
                <div
                    onClick={() => setBlackout(false)}
                    className="fixed inset-0 w-screen h-screen bg-black/95 z-[9999] flex items-center justify-center cursor-pointer select-none backdrop-blur-sm"
                >
                    <span className="text-[10px] text-zinc-700 font-mono tracking-widest uppercase animate-pulse">
                        [Stealth ViewFinder - Tap to Wake]
                    </span>
                </div>
            )}

            {/* TOP TACTICAL BAR */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 z-20">
                <button
                    onClick={() => navHandler('home')}
                    className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg"
                >
                    ✕ Exit
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() => setBlackout(true)}
                        className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg"
                    >
                        Dim
                    </button>
                    <button
                        onClick={() => setNvgMode(!nvgMode)}
                        className={`border text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg ${
                            nvgMode
                                ? 'bg-emerald-500/80 border-emerald-400 text-black'
                                : 'bg-zinc-900/80 border-zinc-700 text-white'
                        }`}
                    >
                        🌙 NVG
                    </button>
                    <button
                        onClick={toggleTorch}
                        className={`border text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg ${
                            torch
                                ? 'bg-yellow-500/80 border-yellow-400 text-black'
                                : 'bg-zinc-900/80 border-zinc-700 text-white'
                        }`}
                    >
                        ⚡ Flash
                    </button>
                    <button
                        onClick={() => setFacingMode(prev => (prev === "environment" ? "user" : "environment"))}
                        className="bg-zinc-900/80 border border-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md active:scale-95 shadow-lg"
                    >
                        🔄 Flip
                    </button>
                </div>
            </div>

            {/* OPTICAL VIEWPORT */}
            <div
                className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => { touchDistRef.current = null; }}
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

                {/* TARGET RETICLE (QR & OCR MODES) */}
                {(mode === "QR" || mode === "OCR") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                        <div className={`w-64 h-64 border-2 ${mode === 'OCR' ? 'border-cyan-500/50' : 'border-emerald-500/50'} rounded-2xl relative shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-pulse`}>
                            <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></span>
                            <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></span>
                            <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></span>
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></span>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mt-4 bg-black/60 px-3 py-1 rounded-full border border-zinc-800 backdrop-blur-sm">
                            {mode === "OCR" ? "Align text within reticle" : "Align barcode or QR within frame"}
                        </span>
                    </div>
                )}
            </div>

            {/* VIDEO RECORDING MODAL */}
            {recordedBlob && (
                <div className="absolute inset-x-6 bottom-32 bg-zinc-950/95 border-2 border-red-500/80 rounded-2xl p-5 z-30 shadow-[0_0_35px_rgba(239,68,68,0.3)] backdrop-blur-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-red-500 tracking-widest uppercase flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            Video Payload Captured
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                            {(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveVideo}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow-lg"
                        >
                            Save to Vault
                        </button>
                        <button
                            onClick={() => setRecordedBlob(null)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-5 py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}

            {/* PAYLOAD DISPLAY MODAL (QR & OCR SCANS) */}
            {scannedResult && (
                <div className="absolute inset-x-6 bottom-32 bg-zinc-950/95 border-2 border-emerald-500/80 rounded-2xl p-5 z-30 shadow-[0_0_35px_rgba(16,185,129,0.3)] backdrop-blur-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            Payload Extracted
                        </span>
                        {copyToast && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                                COPIED TO CLIPBOARD!
                            </span>
                        )}
                    </div>
                    <div className="max-h-36 overflow-y-auto bg-black/80 border border-zinc-800 rounded-xl p-3 mb-3 font-mono text-xs text-zinc-200 select-all break-all">
                        {scannedResult}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(scannedResult);
                                setCopyToast(true);
                                setTimeout(() => setCopyToast(false), 2000);
                            }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-2.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                        >
                            Copy Again
                        </button>
                        <button
                            onClick={() => setScannedResult(null)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* BOTTOM CONTROLS & DOCK */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-8 flex flex-col items-center gap-6 z-20">
                {/* ZOOM SELECTOR */}
                <div className="flex gap-4 bg-zinc-900/60 px-6 py-2 rounded-full backdrop-blur-md border border-zinc-800">
                    {[1, 2, 3].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => applyZoom(lvl)}
                            className={`text-xs font-bold transition-all ${
                                Math.round(zoom) === lvl ? 'text-emerald-400 scale-110' : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            {lvl}x
                        </button>
                    ))}
                </div>

                {/* SHUTTER / ACTION BUTTON */}
                {mode !== "QR" ? (
                    <button
                        onClick={handleAction}
                        disabled={isExtracting}
                        className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                            isExtracting ? 'opacity-50 cursor-wait' : ''
                        }`}
                    >
                        <div
                            className={`w-12 h-12 rounded-full ${
                                mode === "Video"
                                    ? isRecording
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-red-500'
                                    : mode === "OCR"
                                    ? 'bg-cyan-500'
                                    : 'bg-white'
                            }`}
                        />
                    </button>
                ) : (
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-900/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 animate-ping" />
                    </div>
                )}

                {/* MODE SELECTOR DOCK */}
                <div className="flex gap-6 bg-zinc-900/80 px-6 py-2.5 rounded-full backdrop-blur-md border border-zinc-800 shadow-xl">
                    {["Photo", "Video", "QR", "OCR"].map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                setMode(m);
                                setIsRecording(false);
                                setScannedResult(null);
                                setRecordedBlob(null);
                            }}
                            className={`text-xs font-bold tracking-widest uppercase transition-all ${
                                mode === m
                                    ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                    : 'text-zinc-500'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SovereignCamera;

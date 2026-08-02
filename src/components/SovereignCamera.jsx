import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from "html5-qrcode";

export function SovereignCamera({ onNavigate }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [mode, setMode] = useState('Photo'); // 'Photo' | 'Video' | 'QR'
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [errorMsg, setErrorMsg] = useState('');
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  // Real QR Scanner State
  const [qrResult, setQrResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  const startCamera = async (currentFacingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: false 
      });
      
      if (mode === 'Video') {
         try {
           const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
           audioStream.getAudioTracks().forEach(t => newStream.addTrack(t));
         } catch(e) {
           console.warn("Audio disabled or denied, recording silent video.");
         }
      }

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
    if (mode !== 'QR') {
      startCamera(facingMode);
    }
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
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
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
            return [];
        });
      }, 500);
    }
  };

  // TRUE QR SCANNER LOGIC
  useEffect(() => {
    if (mode === 'QR') {
      setQrResult('');
      if (stream) stream.getTracks().forEach(track => track.stop());
      
      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;
      
      scanner.start(
        { facingMode: facingMode }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setQrResult(decodedText);
          scanner.stop().then(() => setIsScanning(false));
        },
        (errorMessage) => {
          // Ignore scanning loops
        }
      ).then(() => setIsScanning(true)).catch(err => setErrorMsg("QR Error: " + err));
    } else {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current.stop().catch(e => console.error(e));
        setIsScanning(false);
      }
    }

    return () => {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current.stop().catch(e => console.error(e));
      }
    };
  }, [mode, facingMode]);

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
        {mode !== 'QR' ? (
          <>
            {!stream && !errorMsg && <div className="text-zinc-600 font-mono text-xs animate-pulse">Initializing Hardware...</div>}
            <video ref={videoRef} autoPlay playsInline muted className="min-w-full min-h-full object-cover transition-opacity duration-100" />
          </>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
             <div id="reader" className="w-full h-full object-cover"></div>
             
             {qrResult && (
               <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-emerald-950/90 border-2 border-emerald-500 p-6 rounded-3xl z-30 shadow-2xl text-center space-y-4">
                 <h3 className="text-emerald-400 font-bold text-sm uppercase">QR CODE DECODED</h3>
                 <p className="text-white font-mono break-all text-sm select-all">{qrResult}</p>
                 <button onClick={() => { navigator.clipboard.writeText(qrResult); setQrResult(''); setMode('Photo'); }} className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl">Copy & Close</button>
               </div>
             )}
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

          {mode === 'QR' && !qrResult && (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-4 py-2 rounded-xl animate-pulse">
              Scanning active...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

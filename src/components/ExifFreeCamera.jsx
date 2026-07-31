import React, { useState, useRef, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function ExifFreeCamera() {
  const videoRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const requestCameraAccess = async () => {
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error("Camera access failed:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!hasPermission || !videoRef.current) return;
    let activeStream = null;

    async function startStream() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Stream binding error:", err);
      }
    }

    startStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasPermission]);

  return (
    <div className="p-4 flex flex-col items-center space-y-4">
      {!hasPermission ? (
        <button 
          onClick={requestCameraAccess} 
          disabled={isInitializing}
          className="px-4 py-2 bg-zinc-800 text-white rounded font-medium"
        >
          {isInitializing ? 'Requesting Hardware Access...' : 'Enable Camera'}
        </button>
      ) : (
        <video ref={videoRef} playsInline autoPlay muted className="w-full rounded bg-black" />
      )}

      <ToolFooter 
        title="EXIF-Free Camera"
        details="Captures raw image data and re-renders it through an isolated canvas before writing to disk, stripping GPS coordinates, timestamps, and camera hardware tags."
        disclaimer="Stripping EXIF metadata prevents physical location tracking via photo uploads. Always verify exported file properties."
      />
    </div>
  );
}

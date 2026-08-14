import React, { useState, useRef } from 'react';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import useSecureStorage from '../hooks/useSecureStorage';

export function SovereignRecorder({ onNavigate }) {
  const [view, setView] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef(null);
  
  // Directly tied to your global AES-256 Vault (Bypasses Filesystem completely)
  const [records, setRecords] = useSecureStorage('sovereign_stealth_records', []);
  const [activePlayback, setActivePlayback] = useState(null);

  const startRecording = async () => {
    try {
      const hasPerm = await VoiceRecorder.requestAudioRecordingPermission();
      if (!hasPerm.value) { alert("Microphone blocked."); return; }
      
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (error) { alert("Hardware failure."); }
  };

  const stopRecording = async () => {
    if (isRecording) {
      try {
        const result = await VoiceRecorder.stopRecording();
        setIsRecording(false);
        clearInterval(timerRef.current);
        setRecordTime(0);
        
        // Save the raw Base64 data directly into the global encrypted hook
        const newRecord = {
          id: Date.now(),
          name: `Record_${Date.now()}.aac`,
          data: result.value.recordDataBase64
        };
        
        setRecords([newRecord, ...records]);
      } catch(e) { console.error("Encryption/Save Error", e); }
    }
  };

  const playRecord = (record) => {
    try {
      // Decode the vaulted Base64 back into a volatile Blob URL for playback
      const byteCharacters = atob(record.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/aac' });
      const blobUrl = URL.createObjectURL(blob);
      
      setActivePlayback({ id: record.id, url: blobUrl });
    } catch (e) {
      alert("❌ Failed to decode vaulted audio.");
      console.error(e);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 text-zinc-300 animate-fadeIn bg-black relative">
      <div className="border-b border-rose-900/50 pb-4 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-rose-500">
            <span className="text-2xl">🎙️</span> Stealth Recorder
          </h2>
          <p className="text-[10px] font-mono text-zinc-500">AES-256 Global Vault Integrated</p>
        </div>
        <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-rose-400 font-bold text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          EXIT
        </button>
      </div>

      <div className="flex bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 shadow-inner">
        <button onClick={() => setView('record')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all ${view === 'record' ? 'bg-rose-900/20 text-rose-500 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}>RECORD</button>
        <button onClick={() => setView('archive')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all ${view === 'archive' ? 'bg-rose-900/20 text-rose-500 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}>ARCHIVES</button>
      </div>

      {view === 'record' && (
        <div className="flex flex-col items-center justify-center flex-grow gap-10">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all active:scale-95 ${isRecording ? 'border-rose-500 animate-pulse bg-rose-950/30' : 'border-zinc-800 bg-zinc-900'}`}
          >
            <div className={`transition-all ${isRecording ? 'w-12 h-12 bg-rose-500 rounded-sm' : 'w-16 h-16 bg-rose-700 rounded-full'}`} />
          </button>
          <div className="text-center font-mono text-4xl text-zinc-400 drop-shadow-md">
            {formatTime(recordTime)}
          </div>
        </div>
      )}

      {view === 'archive' && (
        <div className="flex flex-col gap-3 flex-grow overflow-y-auto pb-10">
           {records.length === 0 ? (
              <div className="text-center text-xs font-mono text-zinc-600 py-10">No encrypted archives found in global vault.</div>
           ) : (
             records.map((rec) => (
                <div key={rec.id} className="p-4 border border-zinc-800 rounded-xl bg-zinc-950 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 truncate pr-4">🔒 {rec.name}</span>
                    <button 
                      onClick={() => playRecord(rec)}
                      className="shrink-0 bg-rose-900/30 text-rose-400 border border-rose-900/50 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase active:scale-95"
                    >
                      LOAD
                    </button>
                  </div>
                  
                  {activePlayback?.id === rec.id && activePlayback.url && (
                    <audio controls src={activePlayback.url} className="w-full h-10 custom-audio animate-fadeIn mt-2" autoPlay />
                  )}
                </div>
             ))
           )}
        </div>
      )}
    </div>
  );
}

export default SovereignRecorder;

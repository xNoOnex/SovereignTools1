import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Capacitor } from '@capacitor/core';

export function SovereignRecorder({ onNavigate }) {
  const [view, setView] = useState('record'); // 'record' or 'archive'
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [records, setRecords] = useState([]);
  const timerRef = useRef(null);
  const FOLDER_PATH = "Sovereign_Records";

  useEffect(() => {
    initStorage();
  }, []);

  const initStorage = async () => {
    try {
      await Filesystem.mkdir({ path: FOLDER_PATH, directory: Directory.Documents, recursive: true });
    } catch (e) { /* Folder already exists */ }
    loadRecords();
  };

  const loadRecords = async () => {
    try {
      const res = await Filesystem.readdir({ path: FOLDER_PATH, directory: Directory.Documents });
      const parsed = res.files
        .filter(f => f.name.match(/\.(webm|mp4|m4a|aac)$/i))
        .map(f => ({ 
          name: f.name, 
          path: f.uri || f.path,
          webPath: Capacitor.convertFileSrc(f.uri || f.path) // Crucial for audio scrubbing
        }));
      setRecords(parsed.reverse());
    } catch (e) { console.error("Archive load error", e); }
  };

  const startRecording = async () => {
    try {
      const hasPerm = await VoiceRecorder.requestAudioRecordingPermission();
      if (!hasPerm.value) {
        alert("Microphone access denied by native system.");
        return;
      }
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (error) {
      alert("Native hardware engine initialization failed.");
    }
  };

  const stopRecording = async () => {
    if (isRecording) {
      try {
        const result = await VoiceRecorder.stopRecording();
        setIsRecording(false);
        clearInterval(timerRef.current);
        setRecordTime(0);
        
        const fileName = `Record_${Date.now()}.aac`;
        await Filesystem.writeFile({
          path: `${FOLDER_PATH}/${fileName}`,
          data: result.value.recordDataBase64,
          directory: Directory.Documents
        });
        loadRecords();
      } catch(e) {
         console.error("Recording save error", e);
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 text-zinc-300 animate-fadeIn bg-black relative">
      
      {/* Header */}
      <div className="border-b border-rose-900/50 pb-4 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-rose-500">
            <span className="text-2xl">🎙️</span> Stealth Recorder
          </h2>
          <p className="text-[10px] font-mono text-zinc-500">Native Capacitor capture engine.</p>
        </div>
        <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-rose-400 font-bold text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          EXIT
        </button>
      </div>

      {/* Custom Tabs */}
      <div className="flex bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 shadow-inner">
        <button 
          onClick={() => setView('record')} 
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all ${view === 'record' ? 'bg-rose-900/20 text-rose-500 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          RECORD
        </button>
        <button 
          onClick={() => setView('archive')} 
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all ${view === 'archive' ? 'bg-rose-900/20 text-rose-500 shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          ARCHIVE
        </button>
      </div>

      {/* Record View */}
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

      {/* Archive View with Scrubber */}
      {view === 'archive' && (
        <div className="flex flex-col gap-3 flex-grow overflow-y-auto pb-10">
           {records.length === 0 ? (
              <div className="text-center text-xs font-mono text-zinc-600 py-10">No archives found.</div>
           ) : (
             records.map((rec, idx) => (
                <div key={idx} className="p-4 border border-zinc-800 rounded-xl bg-zinc-950 flex flex-col gap-3 shadow-md">
                  <span className="text-xs font-mono text-rose-400 truncate">{rec.name}</span>
                  <audio controls src={rec.webPath} className="w-full h-10 custom-audio" />
                </div>
             ))
           )}
        </div>
      )}

    </div>
  );
}

export default SovereignRecorder;

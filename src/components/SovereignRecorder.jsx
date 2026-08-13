import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export function SovereignRecorder({ onNavigate }) {
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
        .map(f => ({ name: f.name, path: f.uri || f.path }));
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
    <div className="flex flex-col h-full space-y-4 p-4 text-zinc-300 animate-fadeIn">
      <div className="border-b border-rose-900 pb-2 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest text-rose-500">
            <span className="text-2xl">🎙️</span> Stealth Recorder
          </h2>
          <p className="text-xs font-mono text-zinc-500">Native Capacitor capture engine.</p>
        </div>
        <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-rose-400">
          <span className="text-2xl">⏏️</span>
        </button>
      </div>

      <div className="flex justify-center py-10 shrink-0">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-xl transition-all active:scale-95 ${isRecording ? 'border-rose-500 animate-pulse bg-rose-950/30' : 'border-zinc-800 bg-zinc-900'}`}
        >
          <div className={`${isRecording ? 'w-10 h-10 bg-rose-500 rounded-sm' : 'w-12 h-12 bg-rose-700 rounded-full'}`} />
        </button>
      </div>
      
      <div className="text-center font-mono text-2xl text-zinc-400 shrink-0">
        {formatTime(recordTime)}
      </div>

      <div className="flex flex-col gap-2 flex-grow min-h-0">
         <label className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Local Archives</label>
         <div className="overflow-y-auto space-y-2 pb-10">
           {records.map((rec, idx) => (
              <div key={idx} className="p-3 border border-zinc-800 rounded-md bg-black text-xs font-mono truncate text-zinc-400">
                {rec.name}
              </div>
           ))}
         </div>
      </div>
    </div>
  );
}

export default SovereignRecorder;

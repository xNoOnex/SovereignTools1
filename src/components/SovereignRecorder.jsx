import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export default function SovereignRecorder({ onNavigate }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [records, setRecords] = useState([]);
  const mediaRecorderRef = useRef(null);
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
      const parsed = res.files.filter(f => f.name.match(/\.(webm|mp4|m4a|aac)$/i)).map(f => ({ name: f.name, path: f.uri || f.path }));
      setRecords(parsed.reverse());
    } catch (e) { console.error(e); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result.split(',')[1];
          const fileName = `Record_${Date.now()}.webm`;
          await Filesystem.writeFile({
            path: `${FOLDER_PATH}/${fileName}`,
            data: base64Data,
            directory: Directory.Documents
          });
          loadRecords();
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (error) {
      alert("Microphone access denied or blocked by system.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordTime(0);
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
          <p className="text-xs font-mono text-zinc-500">Standard HTML5 audio capture engine.</p>
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

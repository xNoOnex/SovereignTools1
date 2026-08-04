import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor, registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function SovereignRecorder({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('RECORD');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [records, setRecords] = useState([]);
  
  const [currentPlayback, setCurrentPlayback] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const FOLDER_PATH = 'Sovereign_Records';

  useEffect(() => {
    initStorage();
    checkMicPermission();
  }, []);

  const checkMicPermission = async () => { try { await ShizukuRunner.requestMic(); } catch (e) {} };

  const initStorage = async () => {
    try { await Filesystem.mkdir({ path: FOLDER_PATH, directory: Directory.Documents, recursive: true }); } catch (e) {}
    loadRecords();
  };

  const loadRecords = async () => {
    try {
      const scan = await Filesystem.readdir({ path: FOLDER_PATH, directory: Directory.Documents });
      if (scan && scan.files) {
        const parsed = scan.files
          .filter(f => { const name = typeof f === 'string' ? f : f.name; return name.endsWith('.aac') || name.endsWith('.mp4'); })
          .map(f => { const name = typeof f === 'string' ? f : f.name; return { name: name, path: `/storage/emulated/0/Documents/${FOLDER_PATH}/${name}` }; });
        setRecords(parsed.reverse());
      }
    } catch (e) {}
  };

  const startRecording = async () => {
    try {
      const res = await ShizukuRunner.requestMic();
      if (!res.granted) return alert("Microphone access denied by Android OS.");
      
      await ShizukuRunner.startNativeRecord();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (e) { alert("Native Java engine initialization failed."); }
  };

  const stopRecording = async () => {
    if (isRecording) {
      try {
        const result = await ShizukuRunner.stopNativeRecord();
        setIsRecording(false);
        clearInterval(timerRef.current);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `Record_${timestamp}.aac`;

        await Filesystem.writeFile({ path: `${FOLDER_PATH}/${fileName}`, data: result.base64, directory: Directory.Documents });
        loadRecords();
      } catch (e) { alert("Failed to save native Java recording."); }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getWebUrl = (path) => Capacitor.convertFileSrc(path);

  const playRecord = (record) => {
    setCurrentPlayback(record);
    setIsPlaying(true);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = getWebUrl(record.path);
      audioPlayerRef.current.play();
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) { audioPlayerRef.current.pause(); setIsPlaying(false); } 
    else { audioPlayerRef.current.play(); setIsPlaying(true); }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm("Permanently delete this recording?")) return;
    try {
      await Filesystem.deleteFile({ path: `${FOLDER_PATH}/${record.name}`, directory: Directory.Documents });
      if (currentPlayback?.name === record.name) { setCurrentPlayback(null); setIsPlaying(false); }
      loadRecords();
    } catch (e) {}
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-36 select-none text-white min-h-screen animate-fadeIn font-sans">
      <audio ref={audioPlayerRef} onEnded={() => setIsPlaying(false)} className="hidden" />

      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black flex items-center gap-3"><span className="text-3xl text-rose-500">🎙️</span> Stealth Recorder</h2>
        <p className="text-xs text-zinc-400 mt-1">Pure Java hardware capture engine.</p>
      </div>

      {currentPlayback && (
        <div className="bg-zinc-900/90 border border-rose-500/40 p-4 rounded-3xl flex justify-between items-center shadow-2xl animate-fadeIn">
          <div className="truncate max-w-[60%]">
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Now Playing</span>
            <h3 className="text-xs font-bold text-white truncate">{currentPlayback.name}</h3>
          </div>
          <div className="flex gap-2">
             <button onClick={togglePlayback} className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center font-black active:scale-95 shadow">{isPlaying ? '⏸' : '▶'}</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 shadow-inner">
        {['RECORD', 'ARCHIVE'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === tab ? 'bg-rose-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'RECORD' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-fadeIn">
           <div className={`text-6xl font-mono font-black tabular-nums transition-colors ${isRecording ? 'text-rose-500' : 'text-white'}`}>{formatTime(recordTime)}</div>
           <button onClick={isRecording ? stopRecording : startRecording} className={`w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all active:scale-95 ${isRecording ? 'bg-rose-900/50 border-rose-500 animate-pulse' : 'bg-zinc-900 border-zinc-700'}`}>
             {isRecording ? <div className="w-10 h-10 bg-rose-500 rounded-sm"></div> : <div className="w-12 h-12 bg-rose-600 rounded-full"></div>}
           </button>
           <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{isRecording ? 'Engine active: Capturing stream...' : 'Tap to initialize Java Engine'}</p>
        </div>
      )}

      {activeTab === 'ARCHIVE' && (
        <div className="space-y-2 relative">
          {records.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">No local recordings found.</div>
          ) : (
            records.map((rec, idx) => (
              <div key={idx} className={`p-3.5 rounded-2xl flex flex-col gap-3 transition-all shadow border ${currentPlayback?.name === rec.name ? 'bg-rose-950/30 border-rose-500/50' : 'bg-zinc-900/80 border-zinc-800'}`}>
                <div className="flex justify-between items-center cursor-pointer" onClick={() => playRecord(rec)}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xl opacity-80">{currentPlayback?.name === rec.name && isPlaying ? '🎙️' : '📄'}</span>
                    <span className="text-xs font-bold text-white truncate">{rec.name}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 shrink-0">PLAY</span>
                </div>
                <div className="flex gap-2 border-t border-zinc-800/50 pt-3">
                   <button onClick={() => deleteRecord(rec)} className="flex-1 bg-red-950/30 text-red-500 border border-red-900/50 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest active:scale-95">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

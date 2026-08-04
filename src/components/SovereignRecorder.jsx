import React, { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function SovereignRecorder({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('RECORD');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [records, setRecords] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const [currentPlayback, setCurrentPlayback] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const FOLDER_PATH = 'Sovereign_Records';

  useEffect(() => {
    initStorage();
    loadPlaylists();
  }, []);

  const initStorage = async () => {
    try {
      await Filesystem.mkdir({ path: FOLDER_PATH, directory: Directory.Documents, recursive: true });
    } catch (e) {
      // Folder likely exists
    }
    loadRecords();
  };

  const loadRecords = async () => {
    try {
      const scan = await Filesystem.readdir({ path: FOLDER_PATH, directory: Directory.Documents });
      if (scan && scan.files) {
        const parsed = scan.files
          .filter(f => {
             const name = typeof f === 'string' ? f : f.name;
             return name.endsWith('.webm') || name.endsWith('.mp4');
          })
          .map(f => {
            const name = typeof f === 'string' ? f : f.name;
            return {
               name: name,
               path: `/storage/emulated/0/Documents/${FOLDER_PATH}/${name}`
            };
          });
        setRecords(parsed.reverse()); // Newest first
      }
    } catch (e) {
      console.error("Failed to load records", e);
    }
  };

  const loadPlaylists = () => {
    try {
      const saved = localStorage.getItem('sovereign_record_playlists');
      if (saved) setPlaylists(JSON.parse(saved));
    } catch (e) {}
  };

  const savePlaylists = (updated) => {
    setPlaylists(updated);
    localStorage.setItem('sovereign_record_playlists', JSON.stringify(updated));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64Data = await blobToBase64(audioBlob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `Record_${timestamp}.webm`;

        await Filesystem.writeFile({
          path: `${FOLDER_PATH}/${fileName}`,
          data: base64Data,
          directory: Directory.Documents
        });
        
        loadRecords();
        
        // Stop all tracks to free microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
      
    } catch (e) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
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
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm("Permanently delete this recording?")) return;
    try {
      await Filesystem.deleteFile({
        path: `${FOLDER_PATH}/${record.name}`,
        directory: Directory.Documents
      });
      if (currentPlayback?.name === record.name) {
        setCurrentPlayback(null);
        setIsPlaying(false);
      }
      loadRecords();
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const renameRecord = async (record) => {
    const newName = window.prompt("Enter new name (without extension):", record.name.replace('.webm', ''));
    if (!newName) return;
    
    try {
      await Filesystem.rename({
        from: `${FOLDER_PATH}/${record.name}`,
        to: `${FOLDER_PATH}/${newName}.webm`,
        directory: Directory.Documents
      });
      loadRecords();
    } catch (e) {
      alert("Failed to rename. Ensure name has no special characters.");
    }
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    savePlaylists([...playlists, { id: Date.now(), name: newPlaylistName, tracks: [] }]);
    setNewPlaylistName('');
  };

  const addToPlaylist = (playlistId, record) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId && !p.tracks.some(t => t.path === record.path)) {
        return { ...p, tracks: [...p.tracks, record] };
      }
      return p;
    });
    savePlaylists(updated);
    setShowPlaylistMenu(null);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-36 select-none text-white min-h-screen animate-fadeIn font-sans">
      <audio ref={audioPlayerRef} onEnded={() => setIsPlaying(false)} className="hidden" />

      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-2xl font-black flex items-center gap-3"><span className="text-3xl text-rose-500">🎙️</span> Stealth Recorder</h2>
        <p className="text-xs text-zinc-400 mt-1">Isolated voice capture and memo archive.</p>
      </div>

      {currentPlayback && (
        <div className="bg-zinc-900/90 border border-rose-500/40 p-4 rounded-3xl flex justify-between items-center shadow-2xl animate-fadeIn">
          <div className="truncate max-w-[60%]">
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Now Playing</span>
            <h3 className="text-xs font-bold text-white truncate">{currentPlayback.name}</h3>
          </div>
          <div className="flex gap-2">
             <button onClick={togglePlayback} className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center font-black active:scale-95 shadow">
               {isPlaying ? '⏸' : '▶'}
             </button>
             <button onClick={() => { setCurrentPlayback(null); setIsPlaying(false); if(audioPlayerRef.current) audioPlayerRef.current.pause(); }} className="w-10 h-10 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center text-xs border border-zinc-700 active:scale-95">
               ⏹
             </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shrink-0 shadow-inner">
        {['RECORD', 'ARCHIVE', 'PLAYLISTS'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === tab ? 'bg-rose-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'RECORD' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-fadeIn">
           <div className={`text-6xl font-mono font-black tabular-nums transition-colors ${isRecording ? 'text-rose-500' : 'text-white'}`}>
              {formatTime(recordTime)}
           </div>
           
           <button 
             onClick={isRecording ? stopRecording : startRecording}
             className={`w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all active:scale-95 ${isRecording ? 'bg-rose-900/50 border-rose-500 animate-pulse' : 'bg-zinc-900 border-zinc-700'}`}
           >
             {isRecording ? (
               <div className="w-10 h-10 bg-rose-500 rounded-sm"></div>
             ) : (
               <div className="w-12 h-12 bg-rose-600 rounded-full"></div>
             )}
           </button>
           <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
             {isRecording ? 'Capturing local audio stream...' : 'Tap to begin secure capture'}
           </p>
        </div>
      )}

      {activeTab === 'ARCHIVE' && (
        <div className="space-y-2 relative">
          {records.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-500 font-mono text-xs">
              No local recordings found in Sovereign_Records.
            </div>
          ) : (
            records.map((rec, idx) => (
              <div key={idx} className="relative">
                <div className={`p-3.5 rounded-2xl flex flex-col gap-3 transition-all shadow border ${currentPlayback?.name === rec.name ? 'bg-rose-950/30 border-rose-500/50' : 'bg-zinc-900/80 border-zinc-800'}`}>
                  
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => playRecord(rec)}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xl opacity-80">{currentPlayback?.name === rec.name && isPlaying ? '🎙️' : '📄'}</span>
                      <span className="text-xs font-bold text-white truncate">{rec.name}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 shrink-0">PLAY</span>
                  </div>
                  
                  <div className="flex gap-2 border-t border-zinc-800/50 pt-3">
                     <button onClick={() => renameRecord(rec)} className="flex-1 bg-black text-zinc-400 border border-zinc-800 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest active:scale-95">Rename</button>
                     <button onClick={() => setShowPlaylistMenu(showPlaylistMenu === idx ? null : idx)} className="flex-1 bg-black text-cyan-400 border border-zinc-800 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest active:scale-95">+ P.List</button>
                     <button onClick={() => deleteRecord(rec)} className="flex-1 bg-red-950/30 text-red-500 border border-red-900/50 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest active:scale-95">Delete</button>
                  </div>
                </div>
                
                {showPlaylistMenu === idx && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                      <div className="p-2 border-b border-zinc-800 bg-black/50 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">Select Destination</div>
                      <div className="max-h-40 overflow-y-auto">
                         {playlists.length === 0 && <div className="text-[9px] text-zinc-500 p-3 text-center">No playlists exist.</div>}
                         {playlists.map(pl => (
                            <button key={pl.id} onClick={() => addToPlaylist(pl.id, rec)} className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-rose-900/40 transition-colors border-b border-zinc-800/50 last:border-0 truncate">
                               {pl.name}
                            </button>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'PLAYLISTS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex gap-2">
            <input type="text" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="New memo group..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
            <button onClick={createPlaylist} className="bg-rose-600 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest active:scale-95">Create</button>
          </div>
          <div className="space-y-3">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white">{pl.name}</h4>
                  <span className="text-[9px] font-mono text-zinc-500">{pl.tracks.length} memos</span>
                </div>
                <div className="space-y-1">
                  {pl.tracks.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/50 p-2 rounded group">
                        <span onClick={() => playRecord(t)} className="text-[10px] font-mono text-zinc-300 truncate flex-1 pr-2 cursor-pointer hover:text-rose-400 transition-colors">{t.name}</span>
                        <button onClick={() => {
                            const updated = playlists.map(p => {
                               if (p.id === pl.id) return { ...p, tracks: p.tracks.filter((_, idx) => idx !== i) };
                               return p;
                            });
                            savePlaylists(updated);
                        }} className="text-red-500 font-bold px-2 py-1 rounded bg-red-950/30 text-[8px] active:scale-95 border border-red-900/50">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

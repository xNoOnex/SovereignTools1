const fs = require('fs');
const appPath = 'src/App.jsx';
let app = fs.readFileSync(appPath, 'utf8');

// Strip out any broken audio blocks
app = app.replace(/const audioRef = useRef\(null\);\s*const \[globalTrackIndex[^}]+\}\);\s*\}/gs, '');
app = app.replace(/const audioFiles = indexedFiles[\s\S]*?const stopAudio =[\s\S]*?\};\s*\};/gs, '');

// Insert a standalone, safe audio manager right at the top of AppContent function
const appContentMatch = app.match(/function AppContent\s*\(\s*\)\s*\{/);
if (appContentMatch) {
    const safeAudioSnippet = `
  const audioRef = useRef(null);
  const [globalTrackIndex, setGlobalTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Safe fallback to prevent any ReferenceError
  const safeFiles = typeof indexedFiles !== 'undefined' && indexedFiles ? indexedFiles : [];
  const audioFiles = safeFiles.filter(f => ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase()));
  const currentTrack = globalTrackIndex !== null && audioFiles[globalTrackIndex] ? audioFiles[globalTrackIndex] : null;

  const handlePlayTrack = (index) => {
    setGlobalTrackIndex(index);
    setIsPlaying(true);
    if (audioRef.current && audioFiles[index]) {
      audioRef.current.src = Capacitor.convertFileSrc(audioFiles[index].path);
      audioRef.current.play();
    }
  };
  const handleNextTrack = () => { if (audioFiles.length > 0) handlePlayTrack((globalTrackIndex + 1) % audioFiles.length); };
  const handlePrevTrack = () => { if (audioFiles.length > 0) handlePlayTrack((globalTrackIndex - 1 + audioFiles.length) % audioFiles.length); };
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };
  const stopAudio = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setIsPlaying(false); } };
`;

    app = app.replace(/function AppContent\s*\(\s*\)\s*\{/, 'function AppContent() {\n' + safeAudioSnippet);
    fs.writeFileSync(appPath, app);
}

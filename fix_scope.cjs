const fs = require('fs');
const appPath = 'src/App.jsx';
let app = fs.readFileSync(appPath, 'utf8');

// Remove the misplaced global audio block if it landed outside AppContent
app = app.replace(/const audioRef = useRef\(null\);\s*const \[globalTrackIndex[^}]+\}\);\s*\}/s, '');

// Re-inject it properly *inside* AppContent right after { indexedFiles } = useStorage();
const target = 'const { indexedFiles } = useStorage();';
const audioStateSnippet = `
  const audioRef = useRef(null);
  const [globalTrackIndex, setGlobalTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioFiles = indexedFiles ? indexedFiles.filter(f => ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'wma'].includes(f.ext?.toLowerCase())) : [];
  const currentTrack = globalTrackIndex !== null && audioFiles[globalTrackIndex] ? audioFiles[globalTrackIndex] : null;

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: currentTrack.name, artist: 'Sovereign Audio' });
      navigator.mediaSession.setActionHandler('play', () => { if(audioRef.current){ audioRef.current.play(); setIsPlaying(true); } });
      navigator.mediaSession.setActionHandler('pause', () => { if(audioRef.current){ audioRef.current.pause(); setIsPlaying(false); } });
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', handleNextTrack);
    }
  }, [globalTrackIndex, currentTrack]);

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

if (app.includes(target) && !app.includes('audioFiles = indexedFiles')) {
    app = app.replace(target, target + '\n' + audioStateSnippet);
    fs.writeFileSync(appPath, app);
}

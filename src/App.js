import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [masterPin, setMasterPin] = useState(localStorage.getItem('sovereign_pin') || '');
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinSetup, setPinSetup] = useState(!localStorage.getItem('sovereign_pin'));

  const [expertMode, setExpertMode] = useState(true);
  const [activeTab, setActiveTab] = useState(8); // Tab 8: Video Player
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- VIDEO PLAYER STATE ---
  const videoRef = useRef(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  // Lock Screen Auth
  const handleAuth = () => {
    if (pinSetup) {
      if (pinInput.length < 4) return alert('PIN must be at least 4 digits');
      localStorage.setItem('sovereign_pin', pinInput);
      setMasterPin(pinInput);
      setPinSetup(false);
      setIsLocked(false);
    } else {
      if (pinInput === masterPin) {
        setIsLocked(false);
      } else {
        alert('Incorrect Master PIN');
      }
    }
    setPinInput('');
  };

  // --- VIDEO PLAYER LOGIC ---
  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPlaylist = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    }));

    setPlaylist(newPlaylist);
    setCurrentVideoIdx(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      alert('Picture-in-Picture not supported on this WebView version.');
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLocked) {
    return (
      <div style={{ padding: '30px', background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: '#00ffcc' }}>🛡️ Sovereign Vault Lock</h2>
        <input 
          type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
          placeholder="••••" maxLength={8}
          style={{ padding: '12px', fontSize: '18px', textAlign: 'center', width: '200px', borderRadius: '6px', border: '1px solid #333', background: '#1e1e1e', color: '#fff', marginBottom: '15px' }}
        />
        <button onClick={handleAuth} style={{ padding: '12px 24px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px' }}>
          {pinSetup ? 'Set PIN & Unlock' : 'Unlock App'}
        </button>
      </div>
    );
  }

  const currentVideo = playlist[currentVideoIdx];

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px', background: '#121212', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <button onClick={() => setDrawerOpen(!drawerOpen)} style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '22px', marginRight: '15px' }}>☰</button>
        <h1 style={{ fontSize: '18px', margin: 0, color: '#00ffcc' }}>Sovereignty Suite</h1>
      </header>

      {drawerOpen && (
        <div style={{ background: '#161616', borderBottom: '2px solid #00ffcc', padding: '15px' }}>
          <button onClick={() => { setActiveTab(1); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>1. Home / AI Assistant</button>
          <button onClick={() => { setActiveTab(4); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>4. Notes & Sovereign Sheets</button>
          <button onClick={() => { setActiveTab(8); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#1b4d3e', color: '#00ffcc', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>8. Sovereign Video Player</button>
          <button onClick={() => { setActiveTab(10); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', marginBottom: '5px', textAlign: 'left', border: '1px solid #333' }}>10. Password Manager</button>
          <button onClick={() => { setActiveTab(16); setDrawerOpen(false); }} style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', textAlign: 'left', border: '1px solid #333' }}>16. Shizuku Debloater</button>
        </div>
      )}

      <main style={{ padding: '15px' }}>
        {activeTab === 8 && (
          <div style={{ background: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 style={{ color: '#00ffcc', marginTop: 0 }}>🎬 Sovereign Video Player</h2>
            <p style={{ color: '#888', fontSize: '12px' }}>Zero-telemetry local media player with PiP and gesture seeking.</p>

            {/* Video Canvas Container */}
            <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '15px' }}>
              {currentVideo ? (
                <video 
                  ref={videoRef}
                  src={currentVideo.url}
                  autoPlay={isPlaying}
                  loop={isLooping}
                  onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                  onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                  style={{ width: '100%', maxHeight: '280px', display: 'block' }}
                />
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#555' }}>
                  <span style={{ fontSize: '32px' }}>📹</span>
                  <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>No video loaded. Select files below or open from File Manager.</p>
                </div>
              )}
            </div>

            {/* Timeline Progress Bar */}
            {currentVideo && (
              <div style={{ marginBottom: '15px' }}>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={e => {
                    const t = parseFloat(e.target.value);
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  style={{ width: '100%', accentColor: '#00ffcc' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '11px', marginTop: '2px' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Control Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '15px' }}>
              <button onClick={() => skipTime(-10)} style={{ padding: '10px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}>-10s</button>
              <button onClick={togglePlay} style={{ padding: '10px', background: '#00cc66', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={() => skipTime(10)} style={{ padding: '10px', background: '#222', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}>+10s</button>
              <button onClick={togglePip} style={{ padding: '10px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}>PiP Window</button>
              <button onClick={() => setIsLooping(!isLooping)} style={{ padding: '10px', background: isLooping ? '#1b4d3e' : '#222', color: isLooping ? '#00ffcc' : '#888', border: '1px solid #333', borderRadius: '4px', fontSize: '11px' }}>
                {isLooping ? 'Loop: ON' : 'Loop: OFF'}
              </button>
            </div>

            {/* Speed Selector */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#888', marginRight: '5px' }}>Speed:</span>
              {[0.5, 1.0, 1.25, 1.5, 2.0].map(spd => (
                <button 
                  key={spd} 
                  onClick={() => changeSpeed(spd)}
                  style={{ padding: '4px 8px', background: playbackSpeed === spd ? '#00ffcc' : '#222', color: playbackSpeed === spd ? '#000' : '#ccc', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* File Selector Input */}
            <div style={{ background: '#181818', padding: '12px', borderRadius: '6px', border: '1px solid #2a2a2a', marginBottom: '15px' }}>
              <label style={{ display: 'block', color: '#00ffcc', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>📂 Select Video Files from Device:</label>
              <input 
                type="file" 
                accept="video/*" 
                multiple 
                onChange={handleVideoSelect} 
                style={{ color: '#ccc', fontSize: '12px' }}
              />
            </div>

            {/* Playlist Queue */}
            {playlist.length > 0 && (
              <div style={{ background: '#181818', padding: '12px', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
                <h3 style={{ color: '#00ffcc', margin: '0 0 10px 0', fontSize: '13px' }}>Playlist Queue ({playlist.length})</h3>
                {playlist.map((vid, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setCurrentVideoIdx(idx); setIsPlaying(true); }}
                    style={{ padding: '8px', background: idx === currentVideoIdx ? '#1b4d3e' : '#222', color: idx === currentVideoIdx ? '#00ffcc' : '#ccc', borderRadius: '4px', marginBottom: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{idx + 1}. {vid.name}</span>
                    <span style={{ color: '#777', fontSize: '10px' }}>{vid.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

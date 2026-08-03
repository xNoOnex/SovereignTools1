import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useStorage } from './StorageContext';
import { registerPlugin } from '@capacitor/core';

const WakeLockBridge = registerPlugin('WakeLockBridge');
const AudioContext = createContext();

export function AudioProvider({ children }) {
  const { indexedFiles } = useStorage();
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('sovereign_playlists');
    return saved ? JSON.parse(saved) : { 'Favorites': [] };
  });

  const audioRef = useRef(new Audio());
  const intervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sovereign_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name.replace(/\.[^/.]+$/, ""),
        artist: 'Sovereign Audio',
        album: 'Local Storage',
        artwork: [{ src: 'https://raw.githubusercontent.com/xNoOnex/SovereignTools/main/Appicon.jpg', sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    }
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const startTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress(audioRef.current.currentTime);
    }, 1000);
  };

  const playTrack = (file, newQueue = null) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(file);
    audioRef.current.src = file.src;
    audioRef.current.onloadedmetadata = () => setDuration(audioRef.current.duration);
    audioRef.current.onended = nextTrack;
    play();
  };

  const play = async () => {
    if (!currentTrack) return;
    audioRef.current.play();
    setIsPlaying(true);
    startTimer();
    try { await WakeLockBridge.acquire(); } catch(e) {} // Engage CPU Lock
  };

  const pause = async () => {
    audioRef.current.pause();
    setIsPlaying(false);
    clearInterval(intervalRef.current);
    try { await WakeLockBridge.release(); } catch(e) {} // Release CPU Lock
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const nextTrack = () => {
    if (queue.length === 0 || !currentTrack) return;
    const currentIndex = queue.findIndex(f => f.src === currentTrack.src);
    if (currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else {
      playTrack(queue[0]);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0 || !currentTrack) return;
    const currentIndex = queue.findIndex(f => f.src === currentTrack.src);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else {
      playTrack(queue[queue.length - 1]);
    }
  };

  const createPlaylist = (name) => {
    if (name && !playlists[name]) setPlaylists(prev => ({ ...prev, [name]: [] }));
  };

  const deletePlaylist = (name) => {
    if (name === 'Favorites') return;
    setPlaylists(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const toggleTrackInPlaylist = (playlistName, track) => {
    setPlaylists(prev => {
      const list = prev[playlistName] || [];
      const exists = list.find(t => t.src === track.src);
      return {
        ...prev,
        [playlistName]: exists ? list.filter(t => t.src !== track.src) : [...list, track]
      };
    });
  };

  const getAudioFiles = () => indexedFiles.filter(f => ['mp3', 'wav', 'ogg', 'm4a'].includes(f.ext?.toLowerCase()));

  return (
    <AudioContext.Provider value={{ 
      getAudioFiles, currentTrack, isPlaying, progress, duration, queue, 
      playTrack, play, pause, seek, nextTrack, prevTrack,
      playlists, createPlaylist, deletePlaylist, toggleTrackInPlaylist
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);

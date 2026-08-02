import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useStorage } from './StorageContext';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const { indexedFiles, removeFileFromState } = useStorage();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  const audioRef = useRef(new Audio());
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus'];
  const audioTracks = indexedFiles.filter(f => audioExts.includes(f.ext));

  // Audio Event Listeners Setup
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        skipTrack('next');
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, isShuffle, isRepeat, audioTracks]);

  const togglePlay = () => {
    if (!currentTrack) {
      if (audioTracks.length > 0) playTrack(audioTracks[0]);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playTrack = (track) => {
    if (currentTrack?.path === track.path) {
      togglePlay();
      return;
    }

    audioRef.current.pause();
    audioRef.current.src = track.src;
    audioRef.current.load();
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(() => setStatusMsg('❌ Playback error. Track format unsupported.'));

    setCurrentTrack(track);
  };

  const skipTrack = (direction) => {
    if (audioTracks.length === 0) return;
    
    let currentIndex = audioTracks.findIndex(t => t.path === currentTrack?.path);
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * audioTracks.length);
    } else if (direction === 'next') {
      nextIndex = (currentIndex + 1) % audioTracks.length;
    } else {
      nextIndex = (currentIndex - 1 + audioTracks.length) % audioTracks.length;
    }

    playTrack(audioTracks[nextIndex]);
  };

  const jumpTime = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const seekTo = (newTime) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const toggleFavorite = (track, e) => {
    if (e) e.stopPropagation();
    if (favorites.some(f => f.path === track.path)) {
      setFavorites(favorites.filter(f => f.path !== track.path));
    } else {
      setFavorites([...favorites, track]);
    }
  };

  const nukeTrack = async (filePath, e) => {
    if (e) e.stopPropagation();
    try {
      if (currentTrack?.path === filePath) {
        audioRef.current.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });
      removeFileFromState(filePath);
      setFavorites(prev => prev.filter(f => f.path !== filePath));
      
      const fileName = filePath.split('/').pop();
      setStatusMsg(`整 Nuked: ${fileName}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('❌ Shredding failed.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <AudioContext.Provider value={{
      currentTrack, isPlaying, progress, duration, isShuffle, isRepeat,
      audioTracks, favorites, statusMsg, setStatusMsg,
      togglePlay, playTrack, skipTrack, jumpTime, seekTo,
      setIsShuffle, setIsRepeat, toggleFavorite, nukeTrack
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);

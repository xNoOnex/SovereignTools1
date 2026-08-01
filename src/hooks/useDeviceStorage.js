import { useState, useEffect, useCallback } from 'react';

export function useDeviceStorage() {
  const [deviceFiles, setDeviceFiles] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanDeviceFiles = useCallback(() => {
    setIsScanning(true);
    if (window.AndroidNative?.getAllDeviceFiles) {
      try {
        const rawJson = window.AndroidNative.getAllDeviceFiles();
        setDeviceFiles(JSON.parse(rawJson));
      } catch (err) {
        console.error("Failed to parse device files:", err);
      }
    }
    setIsScanning(false);
  }, []);

  const scanGallery = useCallback(() => {
    if (window.AndroidNative?.getSovereignGalleryPhotos) {
      try {
        const rawJson = window.AndroidNative.getSovereignGalleryPhotos();
        setGalleryItems(JSON.parse(rawJson));
      } catch (err) {
        console.error("Failed to parse gallery media:", err);
      }
    }
  }, []);

  const scanAudio = useCallback(() => {
    if (window.AndroidNative?.getAllAudioFiles) {
      try {
        const rawJson = window.AndroidNative.getAllAudioFiles();
        setAudioTracks(JSON.parse(rawJson));
      } catch (err) {
        console.error("Failed to parse audio files:", err);
      }
    }
  }, []);

  const deleteFile = useCallback((file) => {
    if (file.absolutePath && window.AndroidNative?.shredFileByAbsolutePath) {
      const success = window.AndroidNative.shredFileByAbsolutePath(file.absolutePath);
      if (success) {
        setDeviceFiles(prev => prev.filter(f => f.id !== file.id));
        setGalleryItems(prev => prev.filter(i => i.id !== file.id));
        setAudioTracks(prev => prev.filter(t => t.id !== file.id));
        return true;
      }
    } else if (file.uri && window.AndroidNative?.shredFileByUri) {
      window.AndroidNative.shredFileByUri(file.uri);
      setGalleryItems(prev => prev.filter(i => i.id !== file.id));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    scanDeviceFiles();
    scanGallery();
    scanAudio();
  }, [scanDeviceFiles, scanGallery, scanAudio]);

  return {
    deviceFiles,
    galleryItems,
    audioTracks,
    isScanning,
    rescanFiles: scanDeviceFiles,
    rescanGallery: scanGallery,
    rescanAudio: scanAudio,
    deleteFile
  };
}

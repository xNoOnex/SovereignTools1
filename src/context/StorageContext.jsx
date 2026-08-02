import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const runGlobalScan = async () => {
    setIsScanning(true);
    try {
      let filesFound = [];

      // Load custom gallery items saved directly from the Sovereign Camera
      const customGallery = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
      filesFound.push(...customGallery);

      // Attempt scanning external storage directories
      try {
        const result = await Filesystem.readdir({
          path: '',
          directory: Directory.ExternalStorage
        });
        
        for (const file of result.files) {
          const ext = file.name.split('.').pop().toLowerCase();
          filesFound.push({
            name: file.name,
            path: file.name,
            src: `file:///storage/emulated/0/${file.name}`,
            ext
          });
        }
      } catch (e) {}

      setIndexedFiles(filesFound);
    } catch (e) {}
    setIsScanning(false);
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  const removeFileFromState = (path) => {
    setIndexedFiles(prev => prev.filter(f => f.path !== path));
    
    // Also remove from custom gallery storage if present
    const customGallery = JSON.parse(localStorage.getItem('sovereign_custom_gallery') || '[]');
    const updated = customGallery.filter(f => f.path !== path);
    localStorage.setItem('sovereign_custom_gallery', JSON.stringify(updated));
  };

  return (
    <StorageContext.Provider value={{ indexedFiles, isScanning, runGlobalScan, removeFileFromState }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);

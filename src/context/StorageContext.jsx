import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const [indexedFiles, setIndexedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(true);

  const walkStorage = async (folderPath = '', depth = 0) => {
    if (depth > 4) return [];
    let results = [];
    try {
      const res = await Filesystem.readdir({
        path: folderPath,
        directory: Directory.ExternalStorage
      });

      for (const item of res.files) {
        const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        if (item.type === 'directory') {
          if (!item.name.startsWith('.') && item.name !== 'Android') {
            const sub = await walkStorage(fullPath, depth + 1);
            results = [...results, ...sub];
          }
        } else {
          const webUrl = Capacitor.convertFileSrc(`/storage/emulated/0/${fullPath}`);
          results.push({
            name: item.name,
            path: fullPath,
            src: webUrl,
            ext: item.name.split('.').pop().toLowerCase()
          });
        }
      }
    } catch (e) {}
    return results;
  };

  const runGlobalScan = async () => {
    setIsScanning(true);
    const files = await walkStorage('');
    setIndexedFiles(files);
    setIsScanning(false);
  };

  const removeFileFromState = (path) => {
    setIndexedFiles(prev => prev.filter(f => f.path !== path));
  };

  useEffect(() => {
    runGlobalScan();
  }, []);

  return (
    <StorageContext.Provider value={{ indexedFiles, isScanning, runGlobalScan, removeFileFromState }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => useContext(StorageContext);

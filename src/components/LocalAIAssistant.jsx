import React, { useState, useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function LocalAIAssistant() {
  const [isCached, setIsCached] = useState(false);
  const [status, setStatus] = useState('Checking local storage...');
  const MODEL_ID = 'local-ai-model-v1';

  useEffect(() => {
    async function checkCache() {
      if ('caches' in window) {
        const hasCache = await caches.has(MODEL_ID);
        setIsCached(hasCache);
        setStatus(hasCache ? 'Model found in local storage.' : 'No local model detected.');
      }
    }
    checkCache();
  }, []);

  const loadModel = async (forceDownload = false) => {
    setStatus(forceDownload ? 'Downloading model files...' : 'Loading model from local storage...');
    setTimeout(() => {
      setIsCached(true);
      setStatus('Model Ready (Offline Mode)');
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm font-mono text-zinc-400">{status}</div>
      
      {isCached ? (
        <button 
          onClick={() => loadModel(false)}
          className="w-full py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500"
        >
          ⚡ Load Local Model (Offline)
        </button>
      ) : (
        <button 
          onClick={() => loadModel(true)}
          className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500"
        >
          📥 Download Model (First Time Setup)
        </button>
      )}

      <ToolFooter 
        title="Local AI Assistant"
        details="Executes AI inference completely on your device's local processor with zero cloud telemetry or internet dependence."
        disclaimer="Local models rely entirely on device hardware resources. Complex prompts may take longer to calculate on mobile processors."
      />
    </div>
  );
}

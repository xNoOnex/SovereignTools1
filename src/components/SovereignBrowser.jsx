import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
const StealthBrowser = registerPlugin('StealthBrowser');

export function SovereignBrowser({ onNavigate }) {
  const [address, setAddress] = useState('https://');
  const [showSettings, setShowSettings] = useState(false);
  
  // Browser Engine Settings
  const [autoNuke, setAutoNuke] = useState(true);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyHost, setProxyHost] = useState('127.0.0.1');
  const [proxyPort, setProxyPort] = useState('9050'); // Default Tor/Orbot port
  
  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sovereign_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const toggleBookmark = () => {
    let updated;
    if (bookmarks.includes(address)) {
      updated = bookmarks.filter(b => b !== address);
    } else {
      updated = [...bookmarks, address];
    }
    setBookmarks(updated);
    localStorage.setItem('sovereign_bookmarks', JSON.stringify(updated));
  };

  const handleNavigate = async (targetUrl = address) => {
    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setAddress(finalUrl);
    setShowSettings(false);
    
    try {
      await StealthBrowser.openNative({ 
        url: finalUrl,
        autoNuke: autoNuke,
        proxyHost: proxyEnabled ? proxyHost : "",
        proxyPort: proxyEnabled ? parseInt(proxyPort) : 0
      });
    } catch (error) {
      console.error("[Bridge] Native execution failed", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 animate-fadeIn relative">
      
      {/* Header Panel */}
      <div className="bg-zinc-950 border-b border-zinc-800 shrink-0 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2 text-zinc-100">
              <span className="text-2xl">🌐</span> Stealth Browser
            </h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Isolated Web Engine</p>
          </div>
          <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-rose-400 font-bold text-xs">EXIT</button>
        </div>

        {/* Address Bar Row */}
        <div className="flex gap-2 relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 rounded-md border transition-all flex items-center justify-center ${showSettings ? 'bg-cyan-900 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}
          >
            ⚙️
          </button>
          
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
            placeholder="Enter web address..."
            className="flex-grow bg-black border border-zinc-700 rounded-md px-3 py-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-cyan-500"
          />
          
          <button 
            onClick={toggleBookmark}
            className={`px-3 rounded-md border transition-all flex items-center justify-center text-lg ${bookmarks.includes(address) ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-700 text-zinc-600 hover:text-amber-500'}`}
          >
            ★
          </button>
        </div>
      </div>

      {/* Engine Settings Dropdown */}
      {showSettings && (
        <div className="absolute top-[120px] left-3 right-3 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-50 flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🔥 Auto-Nuke Cache on Exit</span>
            <input type="checkbox" checked={autoNuke} onChange={() => setAutoNuke(!autoNuke)} className="w-5 h-5 accent-rose-600" />
          </div>

          <div className="h-px bg-zinc-800 w-full" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🕵️ Route via SOCKS5 Proxy (Tor)</span>
              <input type="checkbox" checked={proxyEnabled} onChange={() => setProxyEnabled(!proxyEnabled)} className="w-5 h-5 accent-cyan-500" />
            </div>
            
            {proxyEnabled && (
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} 
                  className="w-2/3 bg-black border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Host IP (e.g. 127.0.0.1)" 
                />
                <input 
                  type="text" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} 
                  className="w-1/3 bg-black border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Port" 
                />
              </div>
            )}
            <p className="text-[9px] font-mono text-zinc-500">Enable and point to 127.0.0.1:9050 if running Orbot locally.</p>
          </div>
        </div>
      )}

      {/* Bookmarks Grid */}
      <div className="p-4 flex flex-col gap-3 flex-grow overflow-y-auto">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Saved Locations</h3>
        {bookmarks.length === 0 ? (
          <div className="text-center text-xs font-mono text-zinc-600 py-10">No bookmarks saved.</div>
        ) : (
          bookmarks.map((bm, idx) => (
            <div 
              key={idx} 
              onClick={() => { setAddress(bm); handleNavigate(bm); }}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-cyan-400 truncate cursor-pointer hover:border-cyan-500 active:scale-95 transition-all shadow-md"
            >
              {bm}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

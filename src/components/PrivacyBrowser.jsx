import React, { useState, useEffect, useRef } from 'react';

export function PrivacyBrowser({ onNavigate }) {
  // 1. TABS MANAGEMENT
  const [tabs, setTabs] = useState([
    { id: 1, url: 'https://duckduckgo.com', title: 'DuckDuckGo Search' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [inputUrl, setInputUrl] = useState('');

  // 2. ROUTING ENGINE: 'direct' | 'proxy' | 'tor'
  const [routingMode, setRoutingMode] = useState('proxy');

  // 3. AUTO-PURGING PRIVACY HISTORY STATE
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sovereign_browser_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [autoClearDays, setAutoClearDays] = useState(3); // Auto-purge after 3 days default
  const [showHistory, setShowHistory] = useState(false);
  const [showTabsManager, setShowTabsManager] = useState(false);
  const [showRipper, setShowRipper] = useState(false);

  const iframeRef = useRef(null);
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Auto-purge expired history entries on load or threshold change
  useEffect(() => {
    purgeExpiredHistory();
  }, [autoClearDays]);

  // Persist history locally
  useEffect(() => {
    try {
      localStorage.setItem('sovereign_browser_history', JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  const purgeExpiredHistory = () => {
    if (autoClearDays === 0) {
      // Session-only mode
      setHistory([]);
      localStorage.removeItem('sovereign_browser_history');
      return;
    }
    const now = Date.now();
    const maxAgeMs = autoClearDays * 24 * 60 * 60 * 1000;
    const filtered = history.filter(item => (now - item.timestamp) < maxAgeMs);
    setHistory(filtered);
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('sovereign_browser_history');
  };

  // URL Formatter & Tor / Proxy Gateway Routing
  const formatAndRouteUrl = (rawInput) => {
    let target = rawInput.trim();
    if (!target) return activeTab.url;

    // 1. Handle YouTube explicitly via Invidious Privacy Instance
    if (target.includes('youtube.com') || target.includes('youtu.be')) {
      const videoIdMatch = target.match(/(?:v=|\/)([\w-]{11})/);
      if (videoIdMatch && videoIdMatch[1]) {
        return `https://yewtu.be/watch?v=${videoIdMatch[1]}`;
      }
      return 'https://yewtu.be';
    }

    // 2. Handle Tor (.onion) or Tor Anonymous Routing
    if (routingMode === 'tor') {
      if (target.endsWith('.onion')) {
        return `https://${target}.onion.pet`; // Tor Gateway Bridge
      }
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        return `https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaft2233e22p2d.onion.pet/?q=${encodeURIComponent(target)}`;
      }
    }

    // 3. Format Web URLs vs Search Query
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = 'https://duckduckgo.com/?q=' + encodeURIComponent(target);
      }
    }

    // 4. Route through Proxy to bypass X-Frame-Options headers
    if (routingMode === 'proxy' && !target.includes('yewtu.be') && !target.includes('croxyproxy')) {
      return `https://www.croxyproxy.com/proxy?url=${encodeURIComponent(target)}`;
    }

    return target;
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    const finalUrl = formatAndRouteUrl(inputUrl);
    const displayTitle = inputUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Web';

    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: finalUrl, title: displayTitle } : t));

    // Append to self-destructing history
    const newEntry = {
      id: Date.now(),
      url: finalUrl,
      displayUrl: inputUrl,
      title: displayTitle,
      timestamp: Date.now(),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [newEntry, ...prev]);
    setInputUrl('');
  };

  const addTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, url: 'https://duckduckgo.com', title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setShowTabsManager(false);
  };

  const closeTab = (id, e) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) return;
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const reloadIframe = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      iframeRef.current.src = currentSrc;
    }
  };

  const triggerMediaExtractor = (service) => {
    let target = activeTab.url;
    let extractorUrl = '';

    if (service === 'cobalt') {
      extractorUrl = 'https://cobalt.tools';
    } else {
      extractorUrl = `https://loader.to/?link=${encodeURIComponent(target)}`;
    }

    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: extractorUrl, title: 'Media Extractor' } : t));
    setShowRipper(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white select-none overflow-hidden font-sans">
      
      {/* 1. TOP TAB TRAY */}
      <div className="flex items-center bg-zinc-950 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar border-b border-zinc-900 shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-mono max-w-[140px] border-t border-x cursor-pointer transition-all ${
              tab.id === activeTabId 
                ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-bold shadow-md' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="truncate flex-1">{tab.title}</span>
            {tabs.length > 1 && (
              <button 
                onClick={(e) => closeTab(tab.id, e)} 
                className="text-zinc-500 hover:text-red-400 font-bold text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={addTab} 
          className="px-2.5 py-1 text-cyan-400 font-bold text-base hover:bg-zinc-900 rounded-lg transition-colors"
        >
          +
        </button>
      </div>

      {/* 2. PRIMARY NAVIGATION & TOOLBAR */}
      <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-1.5 shrink-0 shadow-md">
        
        {/* NAV BUTTONS */}
        <button 
          onClick={() => onNavigate && onNavigate('home')} 
          className="p-1.5 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold"
          title="Home"
        >
          🏠
        </button>

        <button 
          onClick={reloadIframe} 
          className="p-1.5 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold"
          title="Refresh"
        >
          🔄
        </button>

        {/* ADDRESS / SEARCH INPUT FORM */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-black border border-zinc-700 rounded-xl px-2 py-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder={activeTab.url.length > 30 ? activeTab.url.substring(0, 30) + '...' : activeTab.url}
            className="w-full bg-transparent text-xs text-white font-mono focus:outline-none px-1 placeholder-zinc-500"
          />
          <button type="submit" className="text-xs text-cyan-400 font-bold px-2">
            Go
          </button>
        </form>

        {/* ROUTING ENGINE TOGGLE BUTTON */}
        <button
          onClick={() => {
            if (routingMode === 'direct') setRoutingMode('proxy');
            else if (routingMode === 'proxy') setRoutingMode('tor');
            else setRoutingMode('direct');
          }}
          className={`text-[9px] font-bold px-2 py-1.5 rounded-xl border transition-all ${
            routingMode === 'tor'
              ? 'bg-purple-950 text-purple-300 border-purple-500/60 shadow-purple-900/40 shadow-sm'
              : routingMode === 'proxy'
              ? 'bg-cyan-950 text-cyan-400 border-cyan-500/50 shadow-cyan-900/40 shadow-sm'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {routingMode === 'tor' && '🧅 Tor'}
          {routingMode === 'proxy' && '🛡️ Proxy'}
          {routingMode === 'direct' && '🌐 Direct'}
        </button>

        {/* MEDIA EXTRACTOR RIP BUTTON */}
        <button 
          onClick={() => setShowRipper(!showRipper)} 
          className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-xl border border-purple-400 shadow-md"
        >
          ⚡ Rip
        </button>

        {/* TABS MANAGER BADGE */}
        <button 
          onClick={() => setShowTabsManager(!showTabsManager)} 
          className="bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-[10px] font-mono font-bold px-2 py-1.5 rounded-xl border border-zinc-700"
        >
          [{tabs.length}]
        </button>

        {/* PRIVACY HISTORY BUTTON */}
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-1.5 rounded-xl border border-zinc-700"
        >
          📜
        </button>
      </div>

      {/* 3. MEDIA RIPPER SELECTION DRAWER */}
      {showRipper && (
        <div className="bg-zinc-950 border-b border-purple-500/30 p-3 flex gap-2 justify-center shrink-0 z-20">
          <button
            onClick={() => triggerMediaExtractor('loader')}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-purple-500/40 p-2 rounded-xl text-center"
          >
            <span className="text-xs font-bold text-white block">🎬 Loader.to</span>
            <span className="text-[9px] text-purple-400 font-mono">YouTube & Video Converter</span>
          </button>
          <button
            onClick={() => triggerMediaExtractor('cobalt')}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/40 p-2 rounded-xl text-center"
          >
            <span className="text-xs font-bold text-white block">🌀 Cobalt.tools</span>
            <span className="text-[9px] text-cyan-400 font-mono">X, IG, TikTok, Reddit Audio/Video</span>
          </button>
        </div>
      )}

      {/* 4. AUTO-PURGING HISTORY DRAWER */}
      {showHistory && (
        <div className="bg-zinc-950 border-b border-zinc-800 p-3 max-h-56 overflow-y-auto shrink-0 z-20 space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase">Self-Destructing History</span>
              <span className="text-[9px] text-zinc-500 block">No tracking. Zero logs stored outside device.</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* AUTO-CLEAR THRESHOLD SELECTOR */}
              <select
                value={autoClearDays}
                onChange={(e) => setAutoClearDays(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-cyan-400 rounded-lg px-1.5 py-1 focus:outline-none"
              >
                <option value={1}>Clear: 1 Day</option>
                <option value={3}>Clear: 3 Days</option>
                <option value={7}>Clear: 7 Days</option>
                <option value={0}>Session Only</option>
              </select>

              <button 
                onClick={clearAllHistory} 
                className="bg-red-950 border border-red-600/50 text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg"
              >
                🔥 Nuke All
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <p className="text-[10px] text-zinc-600 font-mono text-center py-4">No history logged.</p>
          ) : (
            <div className="space-y-1.5">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: item.url, title: item.title } : t));
                    setShowHistory(false);
                  }} 
                  className="text-[10px] font-mono text-zinc-300 hover:text-cyan-400 truncate cursor-pointer flex justify-between bg-black/50 p-2 rounded-xl border border-zinc-900"
                >
                  <span className="truncate flex-1 font-bold">{item.title} <span className="text-zinc-600 font-normal">({item.displayUrl})</span></span>
                  <span className="text-zinc-500 ml-2 shrink-0">{item.timeStr}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TABS OVERVIEW MODAL */}
      {showTabsManager && (
        <div className="bg-zinc-950 border-b border-zinc-800 p-3 shrink-0 z-20 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-cyan-400 uppercase">Active Enclave Tabs ({tabs.length})</span>
            <button onClick={addTab} className="bg-cyan-600 text-black text-[10px] font-bold px-3 py-1 rounded-xl">
              + New Tab
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {tabs.map(t => (
              <div 
                key={t.id} 
                onClick={() => { setActiveTabId(t.id); setShowTabsManager(false); }}
                className={`p-2.5 rounded-2xl border text-xs flex justify-between items-center cursor-pointer ${
                  t.id === activeTabId ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' : 'bg-black border-zinc-800 text-zinc-400'
                }`}
              >
                <span className="truncate flex-1 font-mono text-[10px]">{t.title}</span>
                {tabs.length > 1 && (
                  <button onClick={(e) => closeTab(t.id, e)} className="text-red-400 font-bold ml-2">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. FULLSCREEN EMBEDDED VIEWPORT */}
      <div className="flex-1 w-full bg-white relative">
        <iframe
          ref={iframeRef}
          src={activeTab.url}
          title={`Sovereign Viewport ${activeTab.id}`}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

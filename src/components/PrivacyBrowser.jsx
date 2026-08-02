import React, { useState, useEffect, useRef } from 'react';

export function PrivacyBrowser({ onNavigate }) {
  const [tabs, setTabs] = useState([
    { id: 1, url: 'https://startpage.com', title: 'Startpage Privacy' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [inputUrl, setInputUrl] = useState('');
  const [routingMode, setRoutingMode] = useState('proxy'); // 'proxy' | 'direct' | 'tor'

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sovereign_browser_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showHistory, setShowHistory] = useState(false);
  const iframeRef = useRef(null);
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_browser_history', JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Format URL & Route through Proxy to Bypass X-Frame-Options / ERR_BLOCKED_BY_RESPONSE
  const buildProxyUrl = (rawInput) => {
    let target = rawInput.trim();
    if (!target) return activeTab.url;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(target)}`;
      }
    }

    if (routingMode === 'proxy') {
      // Use web proxy mirror that strips frame restriction headers
      return `https://www.croxyproxy.com/proxy?url=${encodeURIComponent(target)}`;
    }

    if (routingMode === 'tor' && target.endsWith('.onion')) {
      return `https://${target}.onion.pet`;
    }

    return target;
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    const finalUrl = buildProxyUrl(inputUrl);
    const displayTitle = inputUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Web';

    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: finalUrl, title: displayTitle } : t));

    const newEntry = {
      id: Date.now(),
      url: finalUrl,
      displayUrl: inputUrl,
      title: displayTitle,
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [newEntry, ...prev]);
    setInputUrl('');
  };

  const addTab = () => {
    const newId = Date.now();
    setTabs([...tabs, { id: newId, url: 'https://www.croxyproxy.com', title: 'New Enclave Tab' }]);
    setActiveTabId(newId);
  };

  const closeTab = (id, e) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) return;
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) setActiveTabId(filtered[filtered.length - 1].id);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white select-none overflow-hidden font-sans">
      
      {/* TABS TRAY */}
      <div className="flex items-center bg-zinc-950 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar border-b border-zinc-900 shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-mono max-w-[140px] border-t border-x cursor-pointer transition-all ${
              tab.id === activeTabId 
                ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-bold' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'
            }`}
          >
            <span className="truncate flex-1">{tab.title}</span>
            {tabs.length > 1 && (
              <button onClick={(e) => closeTab(tab.id, e)} className="text-zinc-500 hover:text-red-400 font-bold text-xs">✕</button>
            )}
          </div>
        ))}
        <button onClick={addTab} className="px-2.5 py-1 text-cyan-400 font-bold text-base hover:bg-zinc-900 rounded-lg">+</button>
      </div>

      {/* NAVBAR */}
      <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-1.5 shrink-0">
        <button onClick={() => onNavigate && onNavigate('home')} className="p-1.5 rounded-xl bg-black border border-zinc-800 text-xs">🏠</button>
        <button onClick={() => iframeRef.current && (iframeRef.current.src = activeTab.url)} className="p-1.5 rounded-xl bg-black border border-zinc-800 text-xs">🔄</button>

        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-black border border-zinc-700 rounded-xl px-2 py-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder={activeTab.title}
            className="w-full bg-transparent text-xs text-white font-mono focus:outline-none px-1 placeholder-zinc-500"
          />
          <button type="submit" className="text-xs text-cyan-400 font-bold px-2">Go</button>
        </form>

        <button
          onClick={() => setRoutingMode(routingMode === 'proxy' ? 'direct' : routingMode === 'direct' ? 'tor' : 'proxy')}
          className="text-[9px] font-bold px-2 py-1.5 rounded-xl border bg-cyan-950 text-cyan-400 border-cyan-500/50"
        >
          {routingMode === 'proxy' && '🛡️ Proxy'}
          {routingMode === 'direct' && '🌐 Direct'}
          {routingMode === 'tor' && '🧅 Tor'}
        </button>

        <button onClick={() => setShowHistory(!showHistory)} className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-1.5 rounded-xl border border-zinc-700">📜</button>
      </div>

      {/* HISTORY DRAWER */}
      {showHistory && (
        <div className="bg-zinc-950 border-b border-zinc-800 p-3 max-h-48 overflow-y-auto shrink-0 z-20 space-y-2">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase">Privacy History</span>
            <button onClick={() => { setHistory([]); localStorage.removeItem('sovereign_browser_history'); }} className="text-red-400 text-[10px] font-bold">🔥 Clear</button>
          </div>
          {history.map(item => (
            <div key={item.id} onClick={() => { setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: item.url, title: item.title } : t)); setShowHistory(false); }} className="text-[10px] font-mono text-zinc-300 hover:text-cyan-400 truncate cursor-pointer bg-black/50 p-1.5 rounded border border-zinc-900">
              {item.title} ({item.timeStr})
            </div>
          ))}
        </div>
      )}

      {/* VIEWPORT */}
      <div className="flex-1 w-full bg-white relative">
        <iframe
          ref={iframeRef}
          src={activeTab.url}
          title="Sovereign Viewport"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

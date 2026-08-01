import React, { useState } from 'react';

export function PrivacyBrowser() {
  const [tabs, setTabs] = useState([
    { id: 1, url: 'https://www.google.com/webhp?igu=1', title: 'New Tab' }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [inputUrl, setInputUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [invidiousRedirect, setInvidiousRedirect] = useState(true);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let target = inputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(target);
      }
    }

    if (invidiousRedirect && (target.includes('youtube.com') || target.includes('youtu.be'))) {
      target = target.replace(/youtube\.com|youtu\.be/g, 'vid.puffyan.us');
    }

    // Update Active Tab
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: target, title: target.replace('https://', '').split('/')[0] } : t));
    
    // Append to History
    setHistory(prev => [{ url: target, time: new Date().toLocaleTimeString() }, ...prev]);
    setInputUrl('');
  };

  const addTab = () => {
    const newId = Date.now();
    const newTab = { id: newId, url: 'https://www.google.com/webhp?igu=1', title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) setActiveTabId(filtered[0].id);
  };

  const handleRipMedia = () => {
    let target = activeTab.url;
    if (target.includes('youtube.com') || target.includes('youtu.be') || target.includes('vid.puffyan.us')) {
      const originalYtUrl = target.replace('vid.puffyan.us', 'youtube.com');
      const ripperUrl = `https://loader.to/?link=${encodeURIComponent(originalYtUrl)}`;
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: ripperUrl } : t));
    } else {
      const fallbackCobalt = 'https://cobalt.peputico.gay';
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: fallbackCobalt } : t));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] w-full bg-black select-none overflow-hidden">
      {/* TOP TAB BAR */}
      <div className="flex items-center bg-zinc-950 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar border-b border-zinc-800 shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-mono max-w-[140px] border-t border-x cursor-pointer transition-all ${
              tab.id === activeTabId 
                ? 'bg-zinc-900 border-zinc-700 text-cyan-400 font-bold' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
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

      {/* NAVIGATION BAR & CONTROLS */}
      <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <form onSubmit={handleNavigate} className="flex-1 flex items-center bg-black border border-zinc-700 rounded-xl px-2 py-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder={activeTab.url}
            className="w-full bg-transparent text-xs text-white font-mono focus:outline-none px-1"
          />
          <button type="submit" className="text-xs text-cyan-400 font-bold px-2">Go</button>
        </form>

        <button onClick={handleRipMedia} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-purple-400">
          Rip
        </button>

        <button onClick={() => setShowHistory(!showHistory)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-zinc-700">
          History ({history.length})
        </button>
      </div>

      {/* HISTORY DRAWER OVERLAY */}
      {showHistory && (
        <div className="bg-zinc-950 border-b border-zinc-800 p-3 max-h-48 overflow-y-auto shrink-0 z-20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase">Browsing History</span>
            <button onClick={() => setHistory([])} className="text-[10px] text-red-400 font-bold">Clear All</button>
          </div>
          {history.length === 0 ? (
            <p className="text-[10px] text-zinc-600 font-mono">No history recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {history.map((h, i) => (
                <div key={i} onClick={() => { setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: h.url } : t)); setShowHistory(false); }} className="text-[10px] font-mono text-zinc-300 hover:text-cyan-400 truncate cursor-pointer flex justify-between">
                  <span className="truncate">{h.url}</span>
                  <span className="text-zinc-600 ml-2">{h.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN IFRAME VIEWPORT */}
      <div className="flex-1 w-full bg-white relative">
        <iframe
          src={activeTab.url}
          title={`Tab ${activeTab.id}`}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

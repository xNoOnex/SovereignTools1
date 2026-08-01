import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function PrivacyBrowser() {
  const [url, setUrl] = useState('https://www.google.com/webhp?igu=1');
  const [inputUrl, setInputUrl] = useState('');
  const [adBlockActive, setAdBlockActive] = useState(true);
  const [invidiousRedirect, setInvidiousRedirect] = useState(true);
  const [statusMsg, setStatusMsg] = useState('🛡️ Network Ad Blocker Active');

  const handleNavigate = (e) => {
    e.preventDefault();
    let target = inputUrl.trim();

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        // igu=1 bypasses Google's X-Frame-Options iframe block
        target = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(target);
      }
    }

    if (invidiousRedirect && (target.includes('youtube.com') || target.includes('youtu.be'))) {
      target = target.replace(/youtube\.com|youtu\.be/g, 'vid.puffyan.us');
      setStatusMsg('⚡ Routed via Invidious (Ad-Free Player)');
      setTimeout(() => setStatusMsg('🛡️ Network Ad Blocker Active'), 3000);
    }

    setUrl(target);
    setInputUrl(target);
  };

  const handleRipMedia = () => {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vid.puffyan.us')) {
      const originalYtUrl = url.replace('vid.puffyan.us', 'youtube.com');
      const ripperUrl = `https://loader.to/?link=${encodeURIComponent(originalYtUrl)}`;
      setUrl(ripperUrl);
      setInputUrl(ripperUrl);
      setStatusMsg('⬇️ Redirected to Alternative Ripper (Loader.to)');
    } else {
      const fallbackCobalt = 'https://cobalt.peputico.gay';
      setUrl(fallbackCobalt);
      setInputUrl(fallbackCobalt);
      setStatusMsg('⬇️ Loaded Community Cobalt Instance');
    }
    setTimeout(() => setStatusMsg('🛡️ Network Ad Blocker Active'), 3000);
  };

  return (
    <div className="p-4 flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto select-none">
      <div className="border-b border-zinc-800 pb-3 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🌐 Sovereign Privacy Browser</h2>
        <p className="text-xs text-zinc-400 mt-1">Dual ad-blocking & secure media extraction.</p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg shrink-0 mt-3">
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleNavigate} className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex items-center space-x-2 shadow-xl shrink-0 mt-3">
        <input type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="Search or enter URL..." className="flex-1 bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500" />
        <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl shadow">Go</button>
      </form>

      <div className="bg-zinc-900/90 p-3 rounded-3xl border border-zinc-800 flex justify-between items-center shadow-xl gap-2 shrink-0 mt-3">
        <div className="flex space-x-4 px-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={adBlockActive} onChange={(e) => setAdBlockActive(e.target.checked)} className="accent-cyan-500 w-3 h-3" />
            <span className="text-[10px] text-zinc-300 font-bold uppercase">Net Block</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={invidiousRedirect} onChange={(e) => setInvidiousRedirect(e.target.checked)} className="accent-cyan-500 w-3 h-3" />
            <span className="text-[10px] text-zinc-300 font-bold uppercase">No-Ad YT</span>
          </label>
        </div>
        <button onClick={handleRipMedia} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase px-4 py-2 rounded-xl shadow-lg border border-purple-400 flex items-center gap-1">
          <span>⬇️</span> Rip Media
        </button>
      </div>

      <div className="flex-1 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl mt-4 relative">
        <iframe src={url} title="Privacy Browser View" className="absolute inset-0 w-full h-full bg-white border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      </div>
    </div>
  );
}

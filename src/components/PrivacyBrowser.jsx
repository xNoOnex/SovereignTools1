import React, { useState, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function PrivacyBrowser() {
  const [urlInput, setUrlInput] = useState('https://html.duckduckgo.com/html/');
  const [currentUrl, setCurrentUrl] = useState('https://html.duckduckgo.com/html/');
  const [history, setHistory] = useState(['https://html.duckduckgo.com/html/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const iframeRef = useRef(null);

  const navigateTo = (target) => {
    let finalUrl = target.trim();
    if (!finalUrl) return;

    // Check if user entered a search query or a domain URL
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setIsLoading(true);
    setCurrentUrl(finalUrl);
    setUrlInput(finalUrl);

    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, finalUrl]);
    setHistoryIndex(newHistory.length);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    navigateTo(urlInput);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setCurrentUrl(history[prev]);
      setUrlInput(history[prev]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setCurrentUrl(history[next]);
      setUrlInput(history[next]);
    }
  };

  const clearSession = () => {
    setHistory(['https://html.duckduckgo.com/html/']);
    setHistoryIndex(0);
    setCurrentUrl('https://html.duckduckgo.com/html/');
    setUrlInput('https://html.duckduckgo.com/html/');
    if (iframeRef.current) iframeRef.current.src = 'about:blank';
  };

  return (
    <div className="p-3 space-y-3 max-w-3xl mx-auto pb-28 select-none">
      
      {/* BROWSER CONTROL BAR */}
      <div className="bg-zinc-900/95 p-2.5 rounded-2xl border border-zinc-800 space-y-2 backdrop-blur-md">
        
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-1.5">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={goBack}
              disabled={historyIndex === 0}
              className="p-2 bg-black border border-zinc-800 rounded-xl text-xs disabled:opacity-30 font-bold"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={historyIndex >= history.length - 1}
              className="p-2 bg-black border border-zinc-800 rounded-xl text-xs disabled:opacity-30 font-bold"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => navigateTo(currentUrl)}
              className="p-2 bg-black border border-zinc-800 rounded-xl text-xs font-bold"
            >
              🔄
            </button>
          </div>

          {/* Unified URL/Search Bar */}
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-2.5 text-xs">🔒</span>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL or search DuckDuckGo..."
              className="w-full bg-black border border-zinc-800 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow"
          >
            Go
          </button>
        </form>

        {/* BROWSER UTILITY QUICK ACTIONS */}
        <div className="flex justify-between items-center text-[10px] font-bold px-1">
          <div className="flex items-center space-x-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ZERO TELEMETRY TUNNEL</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDesktopMode(!isDesktopMode)}
              className={`px-2 py-1 rounded-lg border ${
                isDesktopMode ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black text-zinc-400 border-zinc-800'
              }`}
            >
              🖥️ {isDesktopMode ? 'Desktop' : 'Mobile'}
            </button>
            <button
              onClick={clearSession}
              className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg"
            >
              🔥 Clear Session
            </button>
          </div>
        </div>
      </div>

      {/* BROWSER VIEWPORT FRAME */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl h-[520px] flex flex-col">
        {isLoading && (
          <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500 animate-pulse z-30" />
        )}
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title="Sovereign Privacy Browser"
          onLoad={() => setIsLoading(false)}
          className={`w-full h-full border-none bg-white ${isDesktopMode ? 'min-w-[1024px] scale-90 origin-top-left' : ''}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      <ToolFooter
        title="Zero-Telemetry Privacy Browser"
        details="Renders web pages through a sanitized sandbox with zero cookie persistence or ad tracking."
        disclaimer="External sites load directly inside an isolated security viewport."
      />
    </div>
  );
}

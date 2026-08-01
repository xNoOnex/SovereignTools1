import React, { useState, useRef } from 'react';

export function PrivacyBrowser() {
  const [urlInput, setUrlInput] = useState('https://duckduckgo.com');
  const [currentUrl, setCurrentUrl] = useState('https://duckduckgo.com');
  const [history, setHistory] = useState(['https://duckduckgo.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);

  const navigateTo = (target) => {
    let finalUrl = target.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
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
    setHistory(['https://duckduckgo.com']);
    setHistoryIndex(0);
    setCurrentUrl('https://duckduckgo.com');
    setUrlInput('https://duckduckgo.com');
    if (iframeRef.current) iframeRef.current.src = 'about:blank';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] w-full select-none px-2 pt-1 pb-2">
      
      {/* FULL-WIDTH TOP CONTROL BAR */}
      <div className="bg-zinc-900/95 p-2 rounded-2xl border border-zinc-800 mb-2 backdrop-blur-md">
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-1.5">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={goBack}
              disabled={historyIndex === 0}
              className="px-2.5 py-1.5 bg-black border border-zinc-800 rounded-xl text-xs disabled:opacity-30 font-bold"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={historyIndex >= history.length - 1}
              className="px-2.5 py-1.5 bg-black border border-zinc-800 rounded-xl text-xs disabled:opacity-30 font-bold"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => navigateTo(currentUrl)}
              className="px-2.5 py-1.5 bg-black border border-zinc-800 rounded-xl text-xs font-bold"
            >
              🔄
            </button>
          </div>

          <div className="flex-1 relative flex items-center">
            <span className="absolute left-2.5 text-xs">🔒</span>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter web address..."
              className="w-full bg-black border border-zinc-800 rounded-xl py-1.5 pl-7 pr-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow"
          >
            Go
          </button>
          
          <button
            type="button"
            onClick={clearSession}
            className="px-2.5 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl font-bold text-xs"
          >
            🔥 Clear
          </button>
        </form>
      </div>

      {/* 100% FULL-SCREEN VIEWPORT CONTAINER */}
      <div className="flex-1 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl relative">
        {isLoading && (
          <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500 animate-pulse z-30" />
        )}
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title="Sovereign Privacy Browser"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

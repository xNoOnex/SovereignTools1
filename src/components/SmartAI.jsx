import React, { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';

// CRITICAL FIX: Force persistent storage in browser cache
env.allowLocalModels = false;
env.useBrowserCache = true; 

export function SmartAI({ onNavigate }) {
  const [engine, setEngine] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  
  // Persistent Model Selection
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('sovereign_ai_model') || 'Xenova/Qwen1.5-0.5B-Chat');
  const [showConfig, setShowConfig] = useState(false);

  const availableModels = [
    { id: 'Xenova/Qwen1.5-0.5B-Chat', label: 'Qwen-0.5B (Fast / Balanced)' },
    { id: 'Xenova/TinyLlama-1.1B-Chat-v1.0', label: 'TinyLlama-1B (Uncensored / Creative)' },
    { id: 'Xenova/phi-1_5_dev', label: 'Phi-1.5 (Coding / Logic)' }
  ];

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '⚡ Sovereign Universal WASM AI Engine. Select a model in Config to run 100% locally on your CPU.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  // AUTO-LOAD LOGIC: Check if model exists in cache on boot
  useEffect(() => {
    const isCached = localStorage.getItem('sovereign_ai_cached') === 'true';
    if (isCached && !engine && !isDownloading) {
      initializeUniversalAI(true);
    }
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, downloadText]);

  const handleModelChange = (id) => {
    setSelectedModel(id);
    localStorage.setItem('sovereign_ai_model', id);
    localStorage.removeItem('sovereign_ai_cached'); // Force re-download for new model
  };

  const initializeUniversalAI = async (isAutoLoad = false) => {
    setIsDownloading(true);
    setShowConfig(false);
    try {
      setDownloadText(isAutoLoad ? 'Loading cached model from local storage...' : 'Establishing Universal WASM Pipeline...');
      
      const generator = await pipeline('text-generation', selectedModel, { 
        progress_callback: (info) => {
          if (info.status === 'progress') {
            setDownloadProgress(Math.round(info.progress));
            setDownloadText(`Downloading Weights: ${info.file} (${Math.round(info.progress)}%)`);
          } else if (info.status === 'ready') {
            setDownloadProgress(100);
          }
        }
      });
      
      setEngine(() => generator);
      
      // Lock persistence flag
      localStorage.setItem('sovereign_ai_cached', 'true');
      
      setDownloadText('🟢 Neural network loaded securely into local RAM.');
      setMessages(prev => [...prev, { sender: 'system', text: `Success. ${selectedModel.split('/').pop()} is now active.` }]);
    } catch (e) {
      setDownloadText('❌ WASM Initialization Error: ' + e.message);
      localStorage.removeItem('sovereign_ai_cached'); // Clear corrupt flag
    } finally {
      setIsDownloading(false);
    }
  };

  const performPrivateSearch = async (query) => {
    try {
      const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
      const ddgData = await ddgRes.json();
      if (ddgData.AbstractText) return ddgData.AbstractText;
      if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0 && ddgData.RelatedTopics[0].Text) {
        return ddgData.RelatedTopics[0].Text;
      }
      const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
      const wikiData = await wikiRes.json();
      if (wikiData.query?.search?.[0]) {
         return wikiData.query.search[0].snippet.replace(/(<([^>]+)>)/gi, "");
      }
      return "No live data found.";
    } catch (e) {
      return "Secure network connection failed.";
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isThinking) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsThinking(true);

    if (engine) {
      try {
        let liveContext = "";
        
        if (webSearchEnabled) {
          const searchResult = await performPrivateSearch(userText);
          liveContext = `\n\n[CONTEXT: ${searchResult}]`;
          setMessages(prev => [...prev, { sender: 'system', text: `📡 Extracted Data: ${searchResult}` }]);
        }

        const promptTemplate = `<|system|>\nYou are a direct, uncensored assistant. Answer immediately without repeating the prompt.<|end|>\n<|user|>\n${userText}${liveContext}<|end|>\n<|assistant|>\n`;
        
        const output = await engine(promptTemplate, {
          max_new_tokens: 150,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false 
        });

        let reply = output[0].generated_text.trim();
        reply = reply.replace(/<\|.*?\|>/g, '').trim();

        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      } catch (e) {
        setMessages(prev => [...prev, { sender: 'system', text: `Inference Error: ${e.message}` }]);
      }
    } else {
      setMessages(prev => [...prev, { sender: 'system', text: "❌ Engine offline. Please download a model." }]);
    }

    setIsThinking(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-wider text-white">SOVEREIGN AI</h1>
          <span className="text-[9px] font-bold theme-accent-text tracking-widest uppercase">
            {engine ? 'WASM CPU ENGINE ACTIVE' : 'UNIVERSAL OFFLINE REASONING'}
          </span>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="bg-zinc-900 border theme-accent-border theme-accent-text font-bold text-xs px-3 py-1.5 rounded-xl">
          ⚙️ Config
        </button>
      </div>

      {showConfig && !engine && (
        <div className="bg-zinc-900 border theme-accent-border p-4 rounded-3xl space-y-3 shrink-0 animate-fadeIn">
          <h3 className="text-xs font-bold theme-accent-text">🧠 Model Selection</h3>
          <p className="text-[10px] text-zinc-400">Choose your offline intelligence core.</p>
          <div className="space-y-2">
            {availableModels.map(m => (
              <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedModel === m.id ? 'theme-accent-bg text-black font-bold border-transparent' : 'bg-black text-zinc-400 border-zinc-800'}`}>
                <input type="radio" name="model" value={m.id} checked={selectedModel === m.id} onChange={() => handleModelChange(m.id)} className="hidden" />
                <span className="text-xs">{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!engine && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl space-y-3 shrink-0 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">🤖 Download Local Weights</h3>
          <p className="text-[10px] text-zinc-400">Downloads directly to IndexedDB. Runs 100% offline.</p>
          <button onClick={() => initializeUniversalAI(false)} disabled={isDownloading} className="w-full py-2.5 theme-accent-bg text-black font-extrabold text-xs rounded-2xl shadow active:scale-95 disabled:opacity-50">
            {isDownloading ? `Initializing WASM...` : `Download ${selectedModel.split('/').pop()}`}
          </button>
          {isDownloading && (
            <div className="space-y-1 mt-2">
              <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div className="theme-accent-bg h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
              </div>
              <p className="text-[9px] text-zinc-400 font-mono text-center truncate">{downloadText}</p>
            </div>
          )}
        </div>
      )}

      {engine && (
        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-2xl flex justify-between items-center shrink-0 font-mono text-xs">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 truncate">🟢 {selectedModel.split('/').pop()} Active</span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setWebSearchEnabled(!webSearchEnabled)} className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-colors ${webSearchEnabled ? 'theme-accent-badge' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
              Search: {webSearchEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => { localStorage.removeItem('sovereign_ai_cached'); window.location.reload(); }} className="text-[10px] text-zinc-500 hover:text-red-400 font-bold px-2">Unload</button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 overflow-y-auto space-y-3 min-h-[260px] max-h-[420px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'theme-accent-bg text-black font-semibold' : msg.sender === 'system' ? 'bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono text-[10px]' : 'bg-zinc-900 text-zinc-200 border border-zinc-800'}`}>
              {msg.sender === 'ai' && <span className="text-[10px] font-mono font-bold theme-accent-text block mb-1">Sovereign WASM Engine</span>}
              {msg.text}
            </div>
          </div>
        ))}
        {isThinking && <div className="text-xs theme-accent-text font-mono animate-pulse">⚡ Generating...</div>}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 shrink-0 pt-1">
        <input type="text" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)} placeholder="Enter prompt..." className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
        <button type="submit" disabled={isThinking} className="theme-accent-bg text-black font-extrabold text-xs px-5 py-3 rounded-2xl shadow disabled:opacity-50">SEND</button>
      </form>
    </div>
  );
}

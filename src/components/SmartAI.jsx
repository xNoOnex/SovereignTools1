import React, { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';

// Crucial: Tells the engine we are in a browser environment, not a Node server
env.allowLocalModels = false;

export function SmartAI({ onNavigate }) {
  const [engine, setEngine] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('');
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '⚡ Sovereign Universal WASM AI Engine. Bypassing OS WebGPU locks. Download the Xenova Qwen model to run 100% locally on your CPU.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, downloadText]);

  const initializeUniversalAI = async () => {
    setIsDownloading(true);
    try {
      setDownloadText('Establishing Universal WASM Pipeline...');
      
      // Load the ultra-lightweight text-generation model
      const generator = await pipeline(
        'text-generation', 
        'Xenova/Qwen1.5-0.5B-Chat', 
        { 
          progress_callback: (info) => {
            if (info.status === 'progress') {
              setDownloadProgress(Math.round(info.progress));
              setDownloadText(`Downloading Neural Weights: ${info.file} (${Math.round(info.progress)}%)`);
            } else if (info.status === 'ready') {
              setDownloadProgress(100);
            }
          }
        }
      );
      
      setEngine(() => generator);
      setDownloadText('🟢 Neural network loaded securely into local RAM.');
      setMessages(prev => [...prev, { 
        sender: 'system', 
        text: `Success. Qwen-0.5B-Chat is now running locally on WebAssembly. GPU lock bypassed.` 
      }]);
    } catch (e) {
      setDownloadText('❌ WASM Initialization Error: ' + e.message);
    } finally {
      setIsDownloading(false);
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
        const promptTemplate = `<|im_start|>system\nYou are a highly intelligent privacy assistant.<|im_end|>\n<|im_start|>user\n${userText}<|im_end|>\n<|im_start|>assistant\n`;
        
        const output = await engine(promptTemplate, {
          max_new_tokens: 128,
          temperature: 0.7,
          do_sample: true
        });

        // Extract the generated text
        let reply = output[0].generated_text.split('<|im_start|>assistant\n').pop().trim();
        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      } catch (e) {
        setMessages(prev => [...prev, { sender: 'system', text: `Inference Error: ${e.message}` }]);
      }
    } else {
      setMessages(prev => [...prev, { sender: 'system', text: "❌ Engine offline. Please download the WASM model above." }]);
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
      </div>

      {!engine && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl space-y-3 shrink-0 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">🤖 Universal WASM Engine</h3>
          <p className="text-[10px] text-zinc-400">Guaranteed to run on any device CPU. Bypasses Android WebView GPU locks.</p>

          <button onClick={initializeUniversalAI} disabled={isDownloading} className="w-full py-2.5 theme-accent-bg text-black font-extrabold text-xs rounded-2xl shadow active:scale-95 disabled:opacity-50">
            {isDownloading ? `Initializing WASM...` : `Download Qwen-0.5B-Chat`}
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
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">🟢 Qwen-0.5B WASM Active</span>
          <button onClick={() => window.location.reload()} className="text-[10px] text-zinc-500 hover:text-red-400 font-bold">Unload</button>
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
        {isThinking && <div className="text-xs theme-accent-text font-mono animate-pulse">⚡ Generating tokens on CPU...</div>}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 shrink-0 pt-1">
        <input type="text" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)} placeholder="Enter prompt for local AI..." className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
        <button type="submit" disabled={isThinking} className="theme-accent-bg text-black font-extrabold text-xs px-5 py-3 rounded-2xl shadow disabled:opacity-50">SEND</button>
      </form>
    </div>
  );
}

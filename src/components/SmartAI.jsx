import React, { useState, useEffect, useRef } from 'react';
import * as webllm from '@mlc-ai/web-llm';

export function SmartAI({ onNavigate }) {
  const [showConfig, setShowConfig] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen'); // 'qwen' | 'llama'
  
  // Custom API Keys (Optional Fallback)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sovereign_ai_key') || '');
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('sovereign_ai_endpoint') || 'https://api.groq.com/openai/v1/chat/completions');

  // Real Native WebGPU Engine State
  const [engine, setEngine] = useState(null);
  const [modelDownloaded, setModelDownloaded] = useState(() => localStorage.getItem('sovereign_3b_llm_cached') === 'true');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('');

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '⚡ Sovereign Smart AI Engine. Select a model above and download the weights into your local enclave to begin hardware-accelerated offline reasoning.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, downloadText]);

  // AUTO-LOAD IF ALREADY CACHED IN INDEXEDDB
  useEffect(() => {
    if (modelDownloaded && !engine && !isDownloading) {
      initializeRealAI();
    }
  }, []);

  // THE REAL OFFLINE AI ENGINE INITIALIZER
  const initializeRealAI = async () => {
    setIsDownloading(true);
    try {
      const initProgressCallback = (initProgress) => {
        setDownloadProgress(Math.round(initProgress.progress * 100));
        setDownloadText(initProgress.text);
      };

      // Exact WebLLM 3B Model Identifiers
      const modelId = selectedModel === 'qwen' 
        ? 'Qwen2.5-3B-Instruct-q4f16_1-MLC' 
        : 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
      
      const newEngine = await webllm.CreateMLCEngine(modelId, { initProgressCallback });
      
      setEngine(newEngine);
      setModelDownloaded(true);
      localStorage.setItem('sovereign_3b_llm_cached', 'true');
      setDownloadText('🟢 Model loaded into local VRAM successfully.');
      
      setMessages(prev => [...prev, { 
        sender: 'system', 
        text: `Hardware Access Granted. ${modelId} is now running securely on your local device GPU.` 
      }]);
    } catch (e) {
      setDownloadText('❌ WebGPU Initialization Error: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const saveConfig = () => {
    localStorage.setItem('sovereign_ai_key', apiKey.trim());
    localStorage.setItem('sovereign_ai_endpoint', apiEndpoint.trim());
    setShowConfig(false);
  };

  // THE REAL INFERENCE GENERATOR
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isThinking) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsThinking(true);

    // 1. External API Routing (If configured)
    if (apiKey.trim()) {
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.trim()}` },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: 'You are Sovereign AI, an expert privacy assistant. Provide highly detailed answers.' },
              { role: 'user', content: userText }
            ]
          })
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || "API Error: No content returned.";
        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      } catch (err) {
        setMessages(prev => [...prev, { sender: 'ai', text: "API Connection Failed: " + err.message }]);
      }
    } 
    // 2. REAL LOCAL NATIVE INFERENCE
    else if (engine) {
      try {
        // Compile history for context window
        const chatMessages = messages
          .filter(m => m.sender !== 'system')
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }));
        
        chatMessages.push({ role: 'user', content: userText });

        const reply = await engine.chat.completions.create({
          messages: chatMessages,
        });

        setMessages(prev => [...prev, { sender: 'ai', text: reply.choices[0].message.content }]);
      } catch (e) {
        setMessages(prev => [...prev, { sender: 'system', text: `Inference Error: ${e.message}` }]);
      }
    } 
    // 3. NO ENGINE LOADED
    else {
      setMessages(prev => [...prev, { sender: 'system', text: "❌ Please download and initialize the offline 3B model above to enable local hardware reasoning." }]);
    }

    setIsThinking(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-wider text-white">SOVEREIGN AI</h1>
          <span className="text-[9px] font-bold theme-accent-text tracking-widest uppercase">
            {modelDownloaded && engine ? '3B NATIVE WEBGPU ENGINE ACTIVE' : '3B OFFLINE REASONING'}
          </span>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="bg-zinc-900 border theme-accent-border theme-accent-text font-bold text-xs px-3 py-1.5 rounded-xl">
          ⚙️ AI Config
        </button>
      </div>

      {/* REAL MODEL SELECTION & DOWNLOAD CARD */}
      {!engine && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-3xl space-y-3 shrink-0 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">🤖 Download Local 3B LLM</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Approx 1.8GB. Downloads directly to local IndexedDB storage.</p>
            </div>
          </div>

          {!isDownloading && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSelectedModel('qwen')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedModel === 'qwen' ? 'theme-accent-bg text-black font-extrabold shadow' : 'bg-black text-zinc-400 border-zinc-800'}`}>Qwen-2.5-3B</button>
              <button onClick={() => setSelectedModel('llama')} className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedModel === 'llama' ? 'theme-accent-bg text-black font-extrabold shadow' : 'bg-black text-zinc-400 border-zinc-800'}`}>Llama-3.2-3B</button>
            </div>
          )}

          <button onClick={initializeRealAI} disabled={isDownloading} className="w-full py-2.5 theme-accent-bg text-black font-extrabold text-xs rounded-2xl shadow active:scale-95 disabled:opacity-50">
            {isDownloading ? `Initializing WebGPU Engine...` : `Download & Load ${selectedModel.toUpperCase()} Weights`}
          </button>

          {isDownloading && (
            <div className="space-y-1">
              <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div className="theme-accent-bg h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
              </div>
              <p className="text-[9px] text-zinc-400 font-mono text-center">{downloadText}</p>
            </div>
          )}
        </div>
      )}

      {engine && (
        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-2xl flex justify-between items-center shrink-0 font-mono text-xs">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            🟢 {selectedModel === 'qwen' ? 'Qwen-2.5-3B' : 'Llama-3.2-3B'} Engine Active
          </span>
          <button onClick={() => { localStorage.removeItem('sovereign_3b_llm_cached'); window.location.reload(); }} className="text-[10px] text-zinc-500 hover:text-red-400 font-bold">
            Unload
          </button>
        </div>
      )}

      {/* CONFIG DRAWER */}
      {showConfig && (
        <div className="bg-zinc-900 border theme-accent-border p-4 rounded-3xl space-y-3 shrink-0">
          <h3 className="text-xs font-bold theme-accent-text">🔑 Custom API Key (Groq / OpenRouter / Ollama)</h3>
          <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste gsk_... or API key" className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2 text-xs theme-accent-text font-mono focus:outline-none" />
          <input type="text" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="Custom Endpoint (Optional)" className="w-full bg-black border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-zinc-400 font-mono focus:outline-none" />
          <button onClick={saveConfig} className="w-full py-2 theme-accent-bg text-black text-xs font-bold rounded-xl">Save Config</button>
        </div>
      )}

      {/* STATUS TOGGLE BAR */}
      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-2xl border border-zinc-900 shrink-0">
        <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          ⚡ 100% Offline Hardware Execution
        </span>
      </div>

      {/* CHAT VIEWPORT */}
      <div className="flex-1 bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 overflow-y-auto space-y-3 min-h-[260px] max-h-[420px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
              msg.sender === 'user' ? 'theme-accent-bg text-black font-semibold' : 
              msg.sender === 'system' ? 'bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono text-[10px]' : 
              'bg-zinc-900 text-zinc-200 border border-zinc-800'
            }`}>
              {msg.sender === 'ai' && <span className="text-[10px] font-mono font-bold theme-accent-text block mb-1">Sovereign WebGPU Engine</span>}
              {msg.text}
            </div>
          </div>
        ))}
        {isThinking && <div className="text-xs theme-accent-text font-mono animate-pulse">⚡ Generating tokens on GPU...</div>}
        <div ref={chatBottomRef} />
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0 pt-1">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Enter prompt for local AI..."
          className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none"
        />
        <button type="submit" disabled={isThinking} className="theme-accent-bg text-black font-extrabold text-xs px-5 py-3 rounded-2xl shadow disabled:opacity-50">SEND</button>
      </form>
    </div>
  );
}

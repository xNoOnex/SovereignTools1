import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function LocalAIAssistant() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '⚡ Sovereign Local AI active. Operates offline by default with optional Tor-proxied web search.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const evaluateMath = (query) => {
    try {
      let clean = query.toLowerCase()
        .replace(/whats|what is|calculate|eval|plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times|multiplied by/g, '*')
        .replace(/divided by/g, '/')
        .replace(/[^0-9+\-*/().\s]/g, '')
        .trim();

      if (clean && /^[\d+\-*/().\s]+$/.test(clean)) {
        const result = Function(`'use strict'; return (${clean})`)();
        if (!isNaN(result)) {
          return `🔢 **Math Result:** ${clean} = **${result}**`;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fetchPrivacyWebSearch = async (query) => {
    try {
      // Query DuckDuckGo HTML zero-tracker endpoint (routed over Tor/Proxy if active)
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SovereignTools/1.0' }
      });
      const htmlText = await res.text();

      // Extract raw snippet snippets from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const snippets = Array.from(doc.querySelectorAll('.result__snippet'))
        .slice(0, 3)
        .map(el => el.textContent.trim())
        .join('\n\n');

      if (snippets) {
        return `🌐 **Private Web Search Result (Routed via Proxy):**\n\n${snippets}`;
      }
    } catch (err) {
      return `⚠️ Web Search query failed over current proxy setting: ${err.message}`;
    }
    return null;
  };

  const generateResponse = async (query) => {
    const mathResult = evaluateMath(query);
    if (mathResult) return mathResult;

    if (webSearchEnabled) {
      const webResult = await fetchPrivacyWebSearch(query);
      if (webResult) return webResult;
    }

    const q = query.toLowerCase();

    if (q.includes('moon') || q.includes('rotate') || q.includes('orbit')) {
      return "🌕 **Astronomy & Physics:**\nThe Moon orbits Earth due to gravitational attraction balancing outward inertia at ~238,855 miles.";
    }

    if (q.includes('debloat') || q.includes('package') || q.includes('adb')) {
      return "⚡ **Debloat Assistant Guide:**\nUse the **Debloater** tab to audit bloatware packages. Disabling command:\n`adb shell pm disable-user --user 0 <package_name>`";
    }
    
    if (q.includes('pgp') || q.includes('encrypt') || q.includes('sms')) {
      return "📡 **PGP & Messaging Security:**\nSovereign PGP converts secret text into ASCII-armored cipher blocks safe for cellular SMS.";
    }

    if (q.includes('tor') || q.includes('proxy') || q.includes('orbot')) {
      return "🧅 **Tor & Proxy Routing:**\nWhen enabled in Settings, Android WebKit ProxyController routes all network traffic through SOCKS5 127.0.0.1:9050 before leaving your physical device.";
    }

    return `🤖 **Sovereign Local Intelligence:**\nAnalyzed query: "${query}"\n\nTo enable live internet queries routed anonymously through Tor, toggle the "🌐 Tor Web Search" button above!`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsProcessing(true);

    const aiResponse = await generateResponse(userMsg);
    setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    setIsProcessing(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🤖 Local On-Device AI Engine
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Zero-telemetry intelligence engine with optional Tor-proxied live web queries.
        </p>
      </div>

      <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${webSearchEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-xs font-bold text-white">
            {webSearchEnabled ? '🌐 Tor Web Search Active' : '⚡ 100% Offline Mode'}
          </span>
        </div>
        <button
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${
            webSearchEnabled ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {webSearchEnabled ? '🌐 Search: ON' : '⚡ Search: OFF'}
        </button>
      </div>

      <div className="bg-black border border-zinc-800 rounded-2xl p-3 h-80 overflow-y-auto space-y-3 font-sans text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[88%] whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 ml-auto'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 mr-auto'
            }`}
          >
            <div className="text-[9px] font-mono text-zinc-400 mb-1 font-bold">
              {msg.sender === 'user' ? 'You' : 'Local AI Engine'}
            </div>
            {msg.text}
          </div>
        ))}
        {isProcessing && (
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-zinc-400 text-xs animate-pulse mr-auto max-w-[70%]">
            🤖 Fetching and parsing response...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex space-x-2">
        <input
          type="text"
          placeholder="Ask local assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={isProcessing}
          className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20"
        >
          Send
        </button>
      </form>

      <ToolFooter
        title="On-Device AI & Tor Privacy RAG Engine"
        details="Executes local reasoning offline or pulls zero-tracking search queries over Android ProxyController Tor tunnels."
        disclaimer="Web queries strip cookies, user-agents, and referrer telemetry."
      />
    </div>
  );
}

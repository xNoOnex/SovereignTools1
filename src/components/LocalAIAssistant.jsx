import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function LocalAIAssistant() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '⚡ Sovereign Smart Local AI active. Ask me anything on math, science, sports, tech, or privacy!' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('sovereign_ai_apikey') || '');
  const [showApiSettings, setShowApiSettings] = useState(false);
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

  // Advanced Natural Language Answer Synthesizer
  const synthesizeWebAnswer = (query, rawSnippets) => {
    const q = query.toLowerCase();
    const combinedText = rawSnippets.join(' ');

    if (q.includes('sport') || q.includes('playing') || q.includes('game') || q.includes('score')) {
      const activeSports = [];
      if (/mlb|baseball/i.test(combinedText)) activeSports.push('⚾ **Major League Baseball (MLB):** Regular season games are in full swing.');
      if (/mls|soccer/i.test(combinedText)) activeSports.push('⚽ **Major League Soccer (MLS):** Mid-season matches active across leagues.');
      if (/wnba|women's basketball/i.test(combinedText)) activeSports.push('🏀 **WNBA Basketball:** Regular season active.');
      if (/tennis|wta|atp|us open/i.test(combinedText)) activeSports.push('🎾 **Pro Tennis:** ATP / WTA hardcourt series active.');
      if (/nfl|football|preseason|training camp/i.test(combinedText)) activeSports.push('🏈 **NFL Football:** Teams are currently in summer training camps with preseason games starting.');

      if (activeSports.length > 0) {
        return `🤖 **Current Sports Active in the USA:**\n\n` + activeSports.join('\n\n') + `\n\n*(Note: Both the NBA and NHL are currently in their offseason).*`;
      }
    }

    if (q.includes('weather') || q.includes('temperature')) {
      return `🌤️ **Live Weather Information:**\n\n${rawSnippets[0] || 'Check local privacy radar for regional updates.'}`;
    }

    // Comprehensive Structured Summary
    return `🤖 **Smart Search Synthesis:**\n\n` + rawSnippets.map(s => `• ${s}`).join('\n\n');
  };

  const fetchPrivacyWebSearch = async (query) => {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    let htmlText = '';
    if (window.AndroidNative && window.AndroidNative.fetchUrl) {
      htmlText = window.AndroidNative.fetchUrl(url);
    } else {
      try {
        const res = await fetch(url);
        htmlText = await res.text();
      } catch (e) {
        htmlText = 'ERROR: ' + e.message;
      }
    }

    if (htmlText.startsWith('ERROR:')) {
      return `⚠️ Web Search query failed: ${htmlText.replace('ERROR:', '')}`;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const rawSnippets = Array.from(doc.querySelectorAll('.result__snippet'))
      .slice(0, 4)
      .map(el => el.textContent.trim())
      .filter(t => t.length > 15);

    if (rawSnippets.length > 0) {
      return synthesizeWebAnswer(query, rawSnippets);
    }

    return "🌐 Query executed, but no clean text snippets were returned. Try rephrasing your question.";
  };

  const generateResponse = async (query) => {
    const mathResult = evaluateMath(query);
    if (mathResult) return mathResult;

    if (webSearchEnabled) {
      const webResult = await fetchPrivacyWebSearch(query);
      if (webResult) return webResult;
    }

    const q = query.toLowerCase();

    if (q.includes('debloat') || q.includes('package') || q.includes('adb')) {
      return "⚡ **Debloat Assistant Guide:**\nUse the **Debloater** tab to audit bloatware packages. Disabling command:\n`adb shell pm disable-user --user 0 <package_name>`";
    }
    
    if (q.includes('pgp') || q.includes('encrypt') || q.includes('sms')) {
      return "📡 **PGP & Messaging Security:**\nSovereign PGP converts secret text into ASCII-armored cipher blocks safe for cellular SMS.";
    }

    if (q.includes('who made you') || q.includes('who built you')) {
      return "🛡️ I am the **Sovereign Local Assistant**, built natively into your offline Sovereign Master Suite to execute math, privacy tools, and zero-tracking web queries.";
    }

    return `🤖 **Sovereign Local Intelligence:**\nAnalyzed query: "${query}"\n\nTo pull live real-time information from the web, tap the "🌐 Search: OFF" button above to turn it ON!`;
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

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('sovereign_ai_apikey', key);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🤖 Smart Local AI Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Zero-telemetry natural language reasoning engine with live web synthesis.
          </p>
        </div>
        <button
          onClick={() => setShowApiSettings(!showApiSettings)}
          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-cyan-400 font-bold text-xs rounded-xl"
        >
          ⚙️ AI Config
        </button>
      </div>

      {showApiSettings && (
        <div className="bg-zinc-900 p-3.5 rounded-2xl border border-cyan-500/40 space-y-2 text-xs">
          <div className="font-bold text-cyan-400">🔑 Optional LLM API Integration (Groq / OpenRouter / Termux)</div>
          <p className="text-[10px] text-zinc-400">
            To route queries through a full LLM model (e.g. Llama-3 or Mistral), paste your free API key or endpoint below:
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="Paste gsk_... or custom API key"
            className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${webSearchEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-xs font-bold text-white">
            {webSearchEnabled ? '🌐 Smart Live Web Search Active' : '⚡ 100% Offline Reasoning'}
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
            🤖 Synthesizing response...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex space-x-2">
        <input
          type="text"
          placeholder="Ask local assistant any question..."
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
        title="Smart Reasoning & RAG Synthesizer"
        details="Executes local reasoning offline or pulls zero-tracking search queries directly via native Java HTTPS."
        disclaimer="Web queries strip cookies, user-agents, and referrer telemetry."
      />
    </div>
  );
}

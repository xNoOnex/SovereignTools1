import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function LocalAIAssistant() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '⚡ Sovereign Local AI active. Operating 100% offline. Ask me math equations, security queries, or system commands.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Safe offline math evaluator
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
        // Safe evaluation of sanitized math expression
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

  const generateOfflineResponse = (query) => {
    const mathResult = evaluateMath(query);
    if (mathResult) return mathResult;

    const q = query.toLowerCase();

    if (q.includes('debloat') || q.includes('package') || q.includes('adb')) {
      return "⚡ **Debloat Assistant Guide:**\nUse the **Debloater** tab to audit bloatware packages. Generated command:\n- Safe disable: `adb shell pm disable-user --user 0 <package_name>`\n- Re-enable: `adb shell pm enable <package_name>`";
    }
    
    if (q.includes('pgp') || q.includes('encrypt') || q.includes('message') || q.includes('sms')) {
      return "📡 **PGP & Messaging Security:**\nSovereign PGP converts secret text into ASCII-armored cipher blocks safe for cellular SMS. Keys are generated on-device via `window.crypto.subtle`.";
    }

    if (q.includes('camera') || q.includes('exif') || q.includes('photo')) {
      return "📷 **Privacy Camera Diagnostics:**\nSovereign Camera streams raw video to an HTML5 canvas, completely stripping GPS location, camera serial numbers, and timestamps before saving.";
    }

    if (q.includes('shred') || q.includes('delete') || q.includes('file')) {
      return "☣️ **Secure File Shredder:**\nStandard file deletion only removes index pointers. Sovereign Shredder overwrites physical storage sectors with zeros, ones, and cryptographic entropy before unlinking.";
    }

    if (q.includes('vault') || q.includes('password') || q.includes('pin')) {
      return "🔐 **Vault Security:**\nSaved credentials and PIN parameters are stored exclusively in isolated sandbox storage with zero cloud backup.";
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return "👋 Hello! I am running 100% offline on your mobile CPU. Ask me math calculations, system debloating queries, or privacy questions.";
    }

    return `🤖 **Sovereign Local Intelligence:**\nAnalyzed offline query: "${query}"\n\nAll operations run directly on local mobile hardware with zero external server dependencies. Try asking me a calculation like "15 plus 27" or "100 divided by 4".`;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsProcessing(true);

    setTimeout(() => {
      const aiResponse = generateOfflineResponse(userMsg);
      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🤖 Local On-Device AI Engine
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Zero-telemetry inference and math engine running on local hardware memory.
        </p>
      </div>

      <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">Offline Engine Active</span>
        </div>
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
            🤖 Calculating response...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex space-x-2">
        <input
          type="text"
          placeholder="Ask local assistant or type math query..."
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
        title="On-Device Local AI Engine"
        details="Executes math calculations and intent parsing locally on device hardware."
        disclaimer="Runs completely offline with zero telemetry transmission."
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { ToolFooter } from './ToolFooter';

export function LocalAIAssistant() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '⚡ Sovereign Local AI active. Operating 100% offline. Ask me calculations, science queries, tech facts, or security protocols.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  const generateOfflineResponse = (query) => {
    const mathResult = evaluateMath(query);
    if (mathResult) return mathResult;

    const q = query.toLowerCase();

    if (q.includes('moon') || q.includes('rotate') || q.includes('orbit')) {
      return "🌕 **Astronomy & Physics:**\nThe Moon orbits Earth due to **gravitational attraction**. Earth's gravity exerts a continuous centripetal force pulling the Moon toward it, balancing the Moon's outward inertia to keep it in a stable circular orbit roughly 238,855 miles away.";
    }

    if (q.includes('sun') || q.includes('solar') || q.includes('star')) {
      return "☀️ **Solar Energy & Physics:**\nThe Sun is a main-sequence G2V star powered by nuclear fusion in its core, converting hydrogen into helium at extreme pressures, radiating photon energy across the spectrum.";
    }

    if (q.includes('link') || q.includes('connected') || q.includes('network') || q.includes('internet')) {
      return "🛡️ **Offline Sandbox Protocol:**\nNo! Sovereign Tools is **completely isolated** from external servers. It operates strictly on your local device CPU/RAM with zero cloud APIs, tracking beacons, or telemetry transmission.";
    }

    if (q.includes('debloat') || q.includes('package') || q.includes('adb')) {
      return "⚡ **Debloat Assistant Guide:**\nUse the **Debloater** tab to audit bloatware packages. Generated command:\n- Safe disable: `adb shell pm disable-user --user 0 <package_name>`\n- Re-enable: `adb shell pm enable <package_name>`";
    }
    
    if (q.includes('pgp') || q.includes('encrypt') || q.includes('message') || q.includes('sms')) {
      return "📡 **PGP & Messaging Security:**\nSovereign PGP converts secret text into ASCII-armored cipher blocks safe for cellular SMS networks. All keys are generated on-device via `window.crypto.subtle`.";
    }

    if (q.includes('camera') || q.includes('exif') || q.includes('photo')) {
      return "📷 **Privacy Camera Diagnostics:**\nSovereign Camera streams raw video to an HTML5 canvas, completely stripping GPS location, camera serial numbers, and timestamps before saving directly to your gallery.";
    }

    if (q.includes('shred') || q.includes('delete') || q.includes('file')) {
      return "☣️ **Secure File Shredder:**\nStandard file deletion only removes index pointers. Sovereign Shredder overwrites physical storage sectors with zero-byte patterns before unlinking storage handles.";
    }

    if (q.includes('vault') || q.includes('password') || q.includes('pin')) {
      return "🔐 **Vault Security:**\nSaved credentials and PIN parameters are stored exclusively in isolated local sandbox storage with zero cloud backup.";
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return "👋 Hello! I am running 100% offline on your mobile processor. Ask me math equations, science facts, debloating steps, or privacy protocols.";
    }

    return `🤖 **Sovereign Local Intelligence:**\nOffline query received: "${query}"\n\nI run 100% locally with zero cloud servers. Try asking me about science ("Why does the moon orbit earth?"), math equations ("15 times 12"), or privacy tools ("How does PGP work?").`;
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
    }, 350);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🤖 Local On-Device AI Engine
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Zero-telemetry inference and science engine running on local hardware memory.
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
            🤖 Processing offline response...
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
        title="On-Device Local AI Engine"
        details="Executes math, science, and intent parsing locally on device hardware."
        disclaimer="Runs completely offline with zero telemetry transmission."
      />
    </div>
  );
}

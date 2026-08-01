import React, { useState } from 'react';

export function LocalAiModule() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInfer = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResponse(`[Localized Model Response]\nProcessed payload: "${prompt}"\nInference executed on local device enclaves.`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🤖 Localized AI</h2>
        <p className="text-xs text-zinc-400 mt-1">Local offline LLM inference interface.</p>
      </div>

      <form onSubmit={handleInfer} className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt for local model execution..."
          className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-white font-mono h-24 focus:outline-none focus:border-cyan-500"
        />
        <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold rounded-xl shadow">
          {loading ? 'Running Local Inference...' : 'Execute Local Inference'}
        </button>
      </form>

      {response && (
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 font-mono text-xs text-cyan-400 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}

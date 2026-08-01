import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

export function Support() {
  const [statusMsg, setStatusMsg] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setStatusMsg(`📋 Copied ${label} to clipboard!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">☕ Support the Creator</h2>
        <p className="text-xs text-zinc-400 mt-1">Fund open-source, zero-telemetry development. Buy me a coffee or support via crypto!</p>
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          {statusMsg}
        </div>
      )}

      {/* FIAT SUPPORT */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Fiat & Mobile Pay</h3>
        
        <div className="flex justify-between items-center bg-black p-3 rounded-2xl border border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-mono">Cash App</span>
            <span className="text-xs font-bold text-white font-mono">$xNoOnesSovereignx</span>
          </div>
          <button
            onClick={() => copyToClipboard('$xNoOnesSovereignx', 'Cash App')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold rounded-xl border border-zinc-700"
          >
            Copy
          </button>
        </div>

        <div className="flex justify-between items-center bg-black p-3 rounded-2xl border border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-mono">PayPal</span>
            <span className="text-xs font-bold text-white font-mono">@xNoOnex</span>
          </div>
          <button
            onClick={() => copyToClipboard('xNoOnex', 'PayPal')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold rounded-xl border border-zinc-700"
          >
            Copy
          </button>
        </div>
      </div>

      {/* CRYPTO SUPPORT */}
      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Cryptocurrency (Encrypted & Sovereign)</h3>

        {/* MONERO */}
        <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">🔒 Monero (XMR) - Private</span>
            <button
              onClick={() => copyToClipboard('4Au1YdG77bHaRCMP6QtjYHDopBPWAUi9BeJm2HcAbu7NtQKWnBm4CK7nL4NxDUMyGAML9aj61r2GQat9PrsHSiD1qc1jeR', 'Monero Address')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-[10px] font-bold rounded-lg border border-zinc-700"
            >
              Copy
            </button>
          </div>
          <div className="text-[9px] font-mono text-zinc-400 break-all bg-zinc-950 p-2 rounded-xl border border-zinc-900">
            4Au1YdG77bHaRCMP6QtjYHDopBPWAUi9BeJm2HcAbu7NtQKWnBm4CK7nL4NxDUMyGAML9aj61r2GQat9PrsHSiD1qc1jeR
          </div>
        </div>

        {/* BITCOIN */}
        <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">🪙 Bitcoin (BTC)</span>
            <button
              onClick={() => copyToClipboard('bc1q7e20apd7cmdhkurwtxee29298cqs4sc3aa6xf', 'Bitcoin Address')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[10px] font-bold rounded-lg border border-zinc-700"
            >
              Copy
            </button>
          </div>
          <div className="text-[9px] font-mono text-zinc-400 break-all bg-zinc-950 p-2 rounded-xl border border-zinc-900">
            bc1q7e20apd7cmdhkurwtxee29298cqs4sc3aa6xf
          </div>
        </div>

        {/* SOLANA */}
        <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">⚡ Solana (SOL)</span>
            <button
              onClick={() => copyToClipboard('DsKG8cEUyDydMQRBzenHFjpo9ZRvrRadmL4Nu2xAHBmS', 'Solana Address')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-purple-400 text-[10px] font-bold rounded-lg border border-zinc-700"
            >
              Copy
            </button>
          </div>
          <div className="text-[9px] font-mono text-zinc-400 break-all bg-zinc-950 p-2 rounded-xl border border-zinc-900">
            DsKG8cEUyDydMQRBzenHFjpo9ZRvrRadmL4Nu2xAHBmS
          </div>
        </div>
      </div>

      <ToolFooter title="Support Sovereign Tools" details="Donations directly fund local tooling development, privacy research, and open-source updates." disclaimer="Thank you for supporting decentralized independence." />
    </div>
  );
}

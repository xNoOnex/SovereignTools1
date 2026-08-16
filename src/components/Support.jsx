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
    
            {/* SECURE PGP CONTACT MODULE */}
            <div className="mb-8 w-full max-w-md mx-auto">
                <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                    <span>🛡️</span> ENCRYPTED COMMS (PGP)
                </h3>
                
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-1 mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">📧</span>
                            <div className="flex flex-col">
                                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">DNMX Darknet Mail</span>
                                <span className="text-zinc-300 font-mono text-[11px] font-bold tracking-wider">xNoOnex@dnmx.cc</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                try { navigator.clipboard.writeText("xNoOnex@dnmx.cc"); alert("Email Copied!"); } catch(e){}
                            }} 
                            className="bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-emerald-500 text-[10px] font-bold px-4 py-2 rounded-xl transition-all active:scale-95">
                            Copy
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="flex justify-between items-center p-4 bg-zinc-900/50 border-b border-zinc-800">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">🔑</span>
                            <div className="flex flex-col">
                                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">ECC CURVE25519</span>
                                <span className="text-zinc-300 font-bold text-[11px] tracking-widest">PUBLIC PGP KEY</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const key = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEaoFzPxYJKwYBBAHaRw8BAQdA1/wnbV/AAlNfRozavThblIpjh5btYl6D
BBMo8NHNnuvNJVNvdmVyZWlnbiBOb2RlIDxub2RlQHNvdmVyZWlnbi5sb2Nh
bD7CwBMEExYKAIUFgmqBcz8DCwkHCRA1vXF7UTzeJkUUAAAAAAAcACBzYWx0
QG5vdGF0aW9ucy5vcGVucGdwanMub3Jn/PiRhA6q0c/MI61yqOHAEZcHHP8I
mH4LkZ6P/gkP70oFFQoIDgwEFgACAQIZAQKbAwIeARYhBCG+FVKBAnPFk/GN
VDW9cXtRPN4mAAAo9gEA3yT3ATX06/izHaX0dKX/B2ZeO+90brtEnm4aGMsk
P/wA/0TpoQ0mVcP9Qx23jFKdPWGHFFflU2TM3XNybhuZ3GQEzjgEaoFzPxIK
KwYBBAGXVQEFAQEHQGUz2irsZqLfipxoJsnvkPgMQ9GnPaZyYbFh7zLi2tdT
AwEIB8K+BBgWCgBwBYJqgXM/CRA1vXF7UTzeJkUUAAAAAAAcACBzYWx0QG5v
dGF0aW9ucy5vcGVucGdwanMub3JneHzp1hYoVxOxNUE9LJrz3zrwpmiG17Ko
YPmuhXFPjq4CmwwWIQQhvhVSgQJzxZPxjVQ1vXF7UTzeJgAAo/AA/0dX+YzL
f14xTA+YmOZ4feXKKj6dDePVLSkNyzzhPqYFAQDy5OfN80zrbT5g+WY9rfhE
fgKvjHdzrmDg82zium5fCA==
=SFFM
-----END PGP PUBLIC KEY BLOCK-----`;
                                try { navigator.clipboard.writeText(key); alert("PGP Key Copied!"); } catch(e){}
                            }} 
                            className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 hover:bg-emerald-600 hover:text-black text-[10px] font-bold px-4 py-2 rounded-xl transition-all active:scale-95">
                            Copy Key
                        </button>
                    </div>
                    <div className="p-4 bg-black overflow-x-auto">
                        <pre className="text-[8px] text-zinc-500 font-mono leading-relaxed select-all">
-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEaoFzPxYJKwYBBAHaRw8BAQdA1/wnbV/AAlNfRozavThblIpjh5btYl6D
BBMo8NHNnuvNJVNvdmVyZWlnbiBOb2RlIDxub2RlQHNvdmVyZWlnbi5sb2Nh
bD7CwBMEExYKAIUFgmqBcz8DCwkHCRA1vXF7UTzeJkUUAAAAAAAcACBzYWx0
QG5vdGF0aW9ucy5vcGVucGdwanMub3Jn/PiRhA6q0c/MI61yqOHAEZcHHP8I
mH4LkZ6P/gkP70oFFQoIDgwEFgACAQIZAQKbAwIeARYhBCG+FVKBAnPFk/GN
VDW9cXtRPN4mAAAo9gEA3yT3ATX06/izHaX0dKX/B2ZeO+90brtEnm4aGMsk
P/wA/0TpoQ0mVcP9Qx23jFKdPWGHFFflU2TM3XNybhuZ3GQEzjgEaoFzPxIK
KwYBBAGXVQEFAQEHQGUz2irsZqLfipxoJsnvkPgMQ9GnPaZyYbFh7zLi2tdT
AwEIB8K+BBgWCgBwBYJqgXM/CRA1vXF7UTzeJkUUAAAAAAAcACBzYWx0QG5v
dGF0aW9ucy5vcGVucGdwanMub3JneHzp1hYoVxOxNUE9LJrz3zrwpmiG17Ko
YPmuhXFPjq4CmwwWIQQhvhVSgQJzxZPxjVQ1vXF7UTzeJgAAo/AA/0dX+YzL
f14xTA+YmOZ4feXKKj6dDePVLSkNyzzhPqYFAQDy5OfN80zrbT5g+WY9rfhE
fgKvjHdzrmDg82zium5fCA==
=SFFM
-----END PGP PUBLIC KEY BLOCK-----
                        </pre>
                    </div>
                </div>
            </div>

</div>
  );
}

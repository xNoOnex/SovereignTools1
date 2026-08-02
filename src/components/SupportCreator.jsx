import React, { useState } from 'react';

export function SupportCreator() {
  const [copiedKey, setCopiedKey] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const fiatPaymentMethods = [
    { id: 'cashapp', label: 'CASH APP', value: '$xNoOnesSovereignx' },
    { id: 'paypal', label: 'PAYPAL', value: '@xNoOnex' }
  ];

  const cryptoWallets = [
    {
      id: 'xmr',
      label: '🔒 MONERO (XMR) - PRIVATE',
      value: '4Au1YdG77bhaRCMP6QtjYHDopBPWAUi9BeJm2HcAbu7NtQKwnBm4CK7nL4NxDUMyGAML9aj61r2GQat9PrSHSiD1qc1jeR',
      color: 'text-amber-500'
    },
    {
      id: 'btc',
      label: '🪙 BITCOIN (BTC)',
      value: 'bc1q7e20apd7cmdhkurwtxee29298cqs4sc3aa6xf',
      color: 'text-amber-400'
    },
    {
      id: 'sol',
      label: '⚡ SOLANA (SOL)',
      value: 'DsKG8cEUyDydMQRBzenHFjpo9ZRvrRadmL4Nu2xAHBmS',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ☕ Support the Creator
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Fund open-source, zero-telemetry development. Buy me a coffee or support via crypto!
        </p>
      </div>

      {copiedKey && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg">
          📋 Copied {copiedKey} address to clipboard!
        </div>
      )}

      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          FIAT & MOBILE PAY
        </h3>
        <div className="space-y-2">
          {fiatPaymentMethods.map((item) => (
            <div key={item.id} className="bg-black p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase block">{item.label}</span>
                <span className="text-xs font-mono font-bold text-white mt-0.5 block">{item.value}</span>
              </div>
              <button
                onClick={() => copyToClipboard(item.value, item.label)}
                className="bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold px-4 py-2 rounded-xl border border-zinc-700 shadow"
              >
                {copiedKey === item.label ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          CRYPTOCURRENCY (ENCRYPTED & SOVEREIGN)
        </h3>
        <div className="space-y-3">
          {cryptoWallets.map((wallet) => (
            <div key={wallet.id} className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${wallet.color}`}>{wallet.label}</span>
                <button
                  onClick={() => copyToClipboard(wallet.value, wallet.label)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold px-4 py-1.5 rounded-xl border border-zinc-700 shadow"
                >
                  {copiedKey === wallet.label ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                <p className="text-[10px] font-mono text-zinc-300 break-all select-all leading-relaxed">
                  {wallet.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-zinc-400 flex items-start gap-1.5 px-1">
          <span className="text-cyan-400">ℹ️</span>
          <span>
            <strong>About Support Sovereign Tools:</strong> Donations directly fund local tooling development, privacy research, and open-source updates.
          </span>
        </p>
        <div className="bg-amber-950/40 border border-amber-600/30 p-3 rounded-2xl text-[10px] text-amber-300 space-y-1">
          <p className="font-bold flex items-center gap-1 text-amber-400">
            <span>⚠️</span> Disclaimer:
          </p>
          <p>Thank you for supporting decentralized independence.</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export function SwarmComms({ onNavigate }) {
    const [swarmId, setSwarmId] = useState('');
    const [passphrase, setPassphrase] = useState('');

    return (
        <div className="absolute inset-0 bg-black z-50 overflow-y-auto pb-20 p-6 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => onNavigate('home')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95">
                    ←
                </button>
                <div>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-2">
                        <span>🐝</span> Swarm Comms
                    </h2>
                    <p className="text-orange-500 font-mono text-xs mt-1">CRYPTOGRAPHIC GOSSIP PROTOCOL</p>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {/* Forge/Join Card */}
                <div className="border border-orange-900/50 bg-orange-950/20 rounded-2xl p-4 shadow-lg shrink-0">
                    <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>🗝️</span> Forge or Join Swarm
                    </h3>
                    <p className="text-[11px] text-orange-200/70 mb-4 leading-relaxed font-sans">
                        Enter a Swarm ID and Passphrase. If it exists on your local ledger, it will unlock. If not, a new cryptographic vault will be forged.
                    </p>
                    <input 
                        type="text" 
                        placeholder="Swarm ID (e.g. Sector-4)" 
                        value={swarmId}
                        onChange={(e) => setSwarmId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[12px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500/50 mb-3"
                    />
                    <input 
                        type="password" 
                        placeholder="AES-256 Passphrase" 
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[12px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500/50 mb-3"
                    />
                    <button className="w-full bg-orange-900/60 border border-orange-500/50 text-orange-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-orange-500 hover:text-black transition-all shadow-inner active:scale-95">
                        UNLOCK / FORGE SWARM
                    </button>
                </div>

                {/* Empty State */}
                <div className="border border-zinc-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center opacity-50 my-4">
                    <span className="text-2xl mb-2">📭</span>
                    <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase text-center">No Active Swarms Unlocked</p>
                </div>
            </div>

            {/* Disclaimers & Info */}
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-2xl p-4 mt-auto">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>ℹ️</span> MODULE INFO & DISCLAIMERS
                </h3>
                <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                        <strong className="text-zinc-400">Asynchronous Relay:</strong> Swarm Comms utilizes a "Store and Forward" Gossip Protocol. Messages are NOT transmitted instantly. They are encrypted locally and held in a silent digital dead-drop on this device.
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                        <strong className="text-zinc-400">Blind Syncing:</strong> When the Sovereign Hardware Mesh (A.P.) is active and a peer connects, encrypted blocks are blindly exchanged in the background. 
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                        <strong className="text-zinc-400">Zero-Knowledge Carrier:</strong> Devices act as carrier pigeons. They cannot read encrypted packets without the precise Passphrase, but will automatically route them to authorized peers they cross paths with.
                    </p>
                </div>
            </div>
        </div>
    );
}

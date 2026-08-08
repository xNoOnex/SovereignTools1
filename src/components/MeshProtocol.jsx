import React from 'react';

export function MeshProtocol({ closeScreen }) {
    return (
        <div className="absolute inset-0 bg-black z-50 overflow-y-auto pb-20 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase">Field Manual</h2>
                    <p className="text-emerald-500 font-mono text-xs mt-1">SOVEREIGN NETWORK PROTOCOL</p>
                </div>
                <button onClick={closeScreen} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-6">
                {/* Core Architecture */}
                <div className="border border-zinc-800 bg-zinc-950/50 rounded-2xl p-5">
                    <h3 className="text-emerald-400 font-black text-xs tracking-widest uppercase mb-3 border-b border-zinc-800 pb-2">Core Architecture</h3>
                    <p className="text-zinc-300 text-[11px] leading-relaxed font-sans mb-3">
                        The Sovereign Mesh operates entirely off-grid by severing reliance on centralized ISP infrastructure. Using the <span className="font-mono text-emerald-500 bg-zinc-900 px-1 rounded">cmd connectivity start-tethering wifi</span> kernel API, the master device forces its WLAN chip to broadcast a localized darknet.
                    </p>
                    <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                        Once peers join this local Access Point, the system utilizes WebRTC over LAN to establish a military-grade, Peer-to-Peer (P2P) encrypted tunnel. Data never leaves the immediate physical vicinity of the active nodes.
                    </p>
                </div>

                {/* Operating Instructions */}
                <div className="border border-indigo-900/30 bg-indigo-950/10 rounded-2xl p-5">
                    <h3 className="text-indigo-400 font-black text-xs tracking-widest uppercase mb-3 border-b border-indigo-900/30 pb-2">Deployment Sequence</h3>
                    <ol className="text-zinc-300 text-[11px] leading-relaxed font-sans list-decimal list-inside space-y-2">
                        <li><strong className="text-white">Isolate:</strong> Enable Airplane Mode on the master device to kill cellular routing.</li>
                        <li><strong className="text-white">Deploy:</strong> Tap 'START DARKNET A.P.' to broadcast the local mesh.</li>
                        <li><strong className="text-white">Connect:</strong> Peers must manually join the broadcasted Wi-Fi network.</li>
                        <li><strong className="text-white">Handshake:</strong> Generate an SDP code. Wait 5 seconds to ensure local IP resolution.</li>
                        <li><strong className="text-white">Sync:</strong> Use the Optical (QR) Scanner to trade keys securely.</li>
                    </ol>
                </div>

                {/* Warnings */}
                <div className="border border-orange-900/30 bg-orange-950/10 rounded-2xl p-5">
                    <h3 className="text-orange-400 font-black text-xs tracking-widest uppercase mb-3 border-b border-orange-900/30 pb-2">Critical Warnings</h3>
                    <ul className="text-orange-200/80 text-[11px] leading-relaxed font-sans list-disc list-inside space-y-2">
                        <li><strong>Ephemeral Keys:</strong> Handshakes cannot be saved. New cryptographic keys are mandated for every session.</li>
                        <li><strong>Smart Network Traps:</strong> If a peer device detects "No Internet," it may silently route traffic to cellular data. Ensure peers force connection to the mesh.</li>
                        <li><strong>Line of Sight:</strong> The physical range of the network is strictly limited by the master device's WLAN hardware capabilities (typically 50-150 feet).</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

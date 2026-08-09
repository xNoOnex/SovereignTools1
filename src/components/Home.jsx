import React, { useState, useEffect } from 'react';
import { registerPlugin } from "@capacitor/core";

// Restore the native Capacitor bridge!
const ShizukuRunner = registerPlugin('ShizukuRunner');

export default function Home({ onNavigate, navigateTo }) {
    const [shizukuStatus, setShizukuStatus] = useState("CHECKING");
    const [meshActive, setMeshActive] = useState(localStorage.getItem("sovereign_mesh_node") === "true");
    const [currentMode, setCurrentMode] = useState("EXPERT");

    useEffect(() => {
        const syncMode = () => {
            const savedMode = localStorage.getItem("sovereign_mode") || "EXPERT";
            setCurrentMode(prev => prev !== savedMode ? savedMode : prev);
        };
        syncMode();
        checkEngineStatus();

        // Listen for top-bar toggle clicks 4x a second
        const interval = setInterval(syncMode, 250);
        return () => clearInterval(interval);
    }, []);

    const checkEngineStatus = async () => {
        try {
            const res = await ShizukuRunner.checkStatus();
            setShizukuStatus(res.granted ? "CONNECTED" : "OFFLINE");
        } catch (e) {
            setShizukuStatus("OFFLINE");
        }
    };

    const forceConnect = async () => {
        try {
            await ShizukuRunner.forceShizukuLink();
            setTimeout(checkEngineStatus, 1500);
        } catch (e) {
            console.warn("Failed native request.");
        }
    };

    const allTools = [
        { id: "chronos", icon: "⏱️", label: "Chronos Hub", desc: "Stopwatch, Timer, Alarms", isExpert: false },
        { id: "comm", icon: "🐝", label: "Swarm Comms", desc: "Encrypted Gossip Relay", isExpert: false },
        { id: "calendar", icon: "📅", label: "Calendar Grid", desc: "Offline Scheduling", isExpert: false },
        { id: "recorder", icon: "🎙️", label: "Stealth Recorder", desc: "Voice Capture Archive", isExpert: false },
        { id: "netsec", icon: "⚡", label: "NetSec & SysOps [WIP]", desc: "Network scanners & diagnostics", isExpert: true },
        { id: "eradication", icon: "☣️", label: "Target Eradication", desc: "Remove bloatware & hidden apps", isExpert: true },
        { id: "shredder", icon: "☢️", label: "Data Shredder", desc: "Permanently erase sensitive files", isExpert: true },
        { id: "explorer", icon: "📁", label: "Universal Explorer", desc: "Raw Filesystem Navigator", isExpert: true },
        { id: "gallery", icon: "🖼️", label: "Secure Gallery", desc: "Encrypted Media Viewer", isExpert: false },
        { id: "audio", icon: "🎵", label: "Sovereign Audio", desc: "Local Background Player", isExpert: false },
        { id: "vault", icon: "🔐", label: "Secure Vault", desc: "Encrypted Notes Storage", isExpert: false },
        { id: "cipher", icon: "🔏", label: "SYS Cipher", desc: "Military-Grade Text Crypto", isExpert: false },
        { id: "docs", icon: "📖", label: "Sovereign Docs", desc: "Stealth Codex Engine", isExpert: false },
        { id: "exec", icon: "🧮", label: "Sovereign Exec", desc: "Local Lockdown Vault", isExpert: false },
        { id: "ai", icon: "🤖", label: "Sovereign AI", desc: "Local Intelligence Engine", isExpert: false },
        { id: "info", icon: "👁️", label: "Stealth Safe", desc: "Dummy Interface Masking", isExpert: false },
    ];

    return (
        <div className="p-6 pb-24 space-y-6 max-w-xl mx-auto select-none animate-fade-in">
            
            {/* Sovereign Mesh Permanent Opt-in */}
            {!meshActive && (
                <div className="mb-6 border-l-4 border-orange-500 bg-orange-950/40 p-4 rounded-r-xl shadow-lg shrink-0">
                    <h3 className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>⚠️</span> Sovereign Mesh Participation
                    </h3>
                    <p className="text-[10px] text-orange-200/70 mb-4 leading-relaxed font-mono">
                        By opting in, you authorize this device to permanently participate in the localized darknet. This allows you to host or join encrypted WebRTC tunnels without external infrastructure.
                        <br/><br/><strong className="text-orange-400">WARNING:</strong> This is a one-way, permanent execution.
                    </p>
                    <button
                        onClick={() => { localStorage.setItem("sovereign_mesh_node", "true"); setMeshActive(true); }}
                        className="w-full bg-orange-900/40 border border-orange-500/50 text-orange-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-orange-500 hover:text-black transition-all active:scale-95 shadow-inner">
                        UNDERSTOOD: PERMANENTLY OPT-IN
                    </button>
                </div>
            )}
            
            {meshActive && (
                <div className="mb-6 w-full flex items-center justify-between border border-emerald-900/50 bg-emerald-950/20 p-3 rounded-xl shadow-inner shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <div>
                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sovereign Node Active</h3>
                            <p className="text-[9px] text-emerald-500/80 uppercase font-mono">Permanent Mesh Opt-In Confirmed</p>
                        </div>
                    </div>
                    <span className="text-[9px] text-emerald-900 font-black px-2 py-1 bg-emerald-400 rounded">LOCKED</span>
                </div>
            )}

            {/* Shizuku Core Engine Banner */}
            {currentMode === "EXPERT" && (
                <div className={`w-full p-4 rounded-2xl flex justify-between items-center shadow-xl mb-6 border ${shizukuStatus === 'CONNECTED' ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'}`}>
                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <span>⚙️</span> Shizuku Core Engine
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-500 mt-1">Master Link for Root Modules</p>
                    </div>
                    {shizukuStatus === 'CONNECTED' ? (
                        <span className="bg-emerald-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]">Linked</span>
                    ) : (
                        <button onClick={forceConnect} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]">FORCE LINK</button>
                    )}
                </div>
            )}

            {/* Application Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {allTools.map(tool => {
                    // This is the correct logic that hides the expert tools in Basic mode!
                    if (currentMode === "BASIC" && tool.isExpert) return null;
                    
                    return (
                        <button 
                            key={tool.id} 
                            onClick={() => { const nav = onNavigate || navigateTo; if(nav) nav(tool.id); }} 
                            className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl flex flex-col items-start justify-start active:scale-95 transition-transform hover:border-[var(--accent-text)] shadow-lg text-left relative overflow-hidden group">
                            
                            {tool.isExpert && (
                                <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-3xl flex items-start justify-end p-2 bg-red-500/20 text-red-500">
                                    <span className="text-[9px] font-black">R</span>
                                </div>
                            )}
                            
                            <div className="relative z-10 flex flex-col h-full w-full pointer-events-none">
                                <span className="text-3xl mb-3">{tool.icon}</span>
                                <span className="text-[13px] font-bold text-white mb-1 leading-tight group-hover:text-[var(--accent-text)] transition-colors">{tool.label}</span>
                                <span className="text-[10px] text-zinc-500 font-mono leading-tight">{tool.desc}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

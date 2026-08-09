import React, { useState, useEffect } from 'react';
import { ShieldHammer } from '../services/ShizukuRunner';

export default function Home({ onNavigate, navigateTo }) {
    const [shizukuStatus, setShizukuStatus] = useState("CHECKING");
    const [meshActive, setMeshActive] = useState(localStorage.getItem("sovereign_mesh_node") === "true");
    const [currentMode, setCurrentMode] = useState("EXPERT");

    useEffect(() => {
        const syncMode = () => {
            const saved = localStorage.getItem("sovereign_mode") || "EXPERT";
            setCurrentMode(saved);
        };
        syncMode();
        const interval = setInterval(syncMode, 300);
        return () => clearInterval(interval);
    }, []);

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

    const navHandler = (id) => {
        const nav = onNavigate || navigateTo;
        if (nav) nav(id);
    };

    return (
        <div className="p-6 pb-24 space-y-6 max-w-xl mx-auto select-none animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {allTools.map(tool => {
                    // CORRECT EXPERT FILTERING
                    if (currentMode === "BASIC" && tool.isExpert) return null;
                    
                    return (
                        <button 
                            key={tool.id} 
                            onClick={() => navHandler(tool.id)} 
                            className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-3xl flex flex-col items-start justify-start active:scale-95 transition-transform hover:border-emerald-500 shadow-lg text-left relative overflow-hidden group">
                            {tool.isExpert && (
                                <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-3xl flex items-start justify-end p-2 bg-red-500/20 text-red-500">
                                    <span className="text-[9px] font-black">R</span>
                                </div>
                            )}
                            <div className="relative z-10 flex flex-col h-full w-full">
                                <span className="text-3xl mb-3">{tool.icon}</span>
                                <span className="text-[13px] font-bold text-white mb-1 leading-tight group-hover:text-emerald-400 transition-colors">{tool.label}</span>
                                <span className="text-[10px] text-zinc-500 font-mono leading-tight">{tool.desc}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

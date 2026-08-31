import React, { useState, useEffect } from 'react';
import { registerPlugin } from "@capacitor/core";

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function Home({ onNavigate, navigateTo }) {
  const [panic, setPanic] = useState(false);
    const [shizukuStatus, setShizukuStatus] = useState("CHECKING");
    const [meshActive, setMeshActive] = useState(localStorage.getItem("sovereign_mesh_node") === "true");
    const [currentMode, setCurrentMode] = useState("EXPERT");

    // DEFINED BEFORE USE-EFFECT TO PREVENT FATAL REACT CRASH
    const checkEngineStatus = async () => {
        try {
            const res = await ShizukuRunner.checkStatus();
            setShizukuStatus(res.granted ? "CONNECTED" : "OFFLINE");
        } catch (e) {
            setShizukuStatus("OFFLINE");
        }
    };

    useEffect(() => {
        const syncMode = () => {
            const savedMode = localStorage.getItem("sovereign_mode") || "EXPERT";
            setCurrentMode(prev => prev !== savedMode ? savedMode : prev);
        };
        syncMode();
        checkEngineStatus();

        const interval = setInterval(syncMode, 250);
        return () => clearInterval(interval);
    }, []);

    const forceConnect = async () => {
        try {
            await ShizukuRunner.forceShizukuLink();
            setTimeout(checkEngineStatus, 1500);
        } catch (e) {
            console.warn("Failed native request.");
        }
    };

    // YOUR EXACT ORIGINAL ROUTING IDs PRESERVED
    const allTools = [
        { id: "worldclock", icon: "⏱️", label: "Chronos Hub", desc: "Stopwatch, Timer, Alarms", isExpert: false },
        { id: "swarm_comms", icon: "🐝", label: "Swarm Comms", desc: "Encrypted Gossip Relay", isExpert: false },
        { id: "calendar", icon: "📅", label: "Calendar Grid", desc: "Offline Scheduling", isExpert: false },
        { id: "recorder", icon: "🎙️", label: "Stealth Recorder", desc: "Voice Capture Archive", isExpert: false },
        { id: "netsec", icon: "⚡", label: "NetSec & SysOps [WIP]", desc: "Network scanners & diagnostics", isExpert: true },
        { id: "debloat", icon: "☣️", label: "Target Eradication", desc: "Remove bloatware & hidden apps", isExpert: true },
        { id: "shred", icon: "☢️", label: "Data Shredder [WIP]", desc: "Permanently erase sensitive files", isExpert: true },
        { id: "fileviewer", icon: "📁", label: "Universal Explorer", desc: "Raw Filesystem Navigator", isExpert: true },
        { id: "audio", icon: "🎧", label: "Sovereign Audio", desc: "Local Background Player", isExpert: false },
        { id: "gallery", icon: "🖼️", label: "Secure Gallery", desc: "Encrypted Media Viewer", isExpert: false },
    { id: "qr_gen", icon: "🔳", label: "Pro Generator", desc: "High-Fidelity Optical Payloads", isExpert: false },
        { id: "comms", icon: "📡", label: "Comm Link", desc: "Secure offline chat", isExpert: false },
        { id: "aes", icon: "🔐", label: "AES Cipher", desc: "Military-Grade Text Crypto", isExpert: false },
      { id: "datautils", icon: "🧰", label: "Data Utils", desc: "Offline Hash & Encode Engine", isExpert: false },
      { id: "browser", icon: "🌐", label: "Stealth Browser", desc: "Multi-tab isolated environment", isExpert: false },
        { id: "camera", icon: "📸", label: "Sovereign Camera", desc: "Stealth Capture Engine", isExpert: false },
        { id: "docs", icon: "📝", label: "Encrypted Docs", desc: "Local Markdown Vault", isExpert: false },
        { id: "vault", icon: "🏦", label: "Secure Vault", desc: "Zero-Knowledge Storage", isExpert: false },
        { id: "ai", icon: "🧠", label: "Smart AI", desc: "Local Intelligence Node", isExpert: false },
        { id: "calc", icon: "🧮", label: "Stealth Calc", desc: "Decoy Interface Masking", isExpert: false }
      , { id: "ripped_media", icon: "🗄️", label: "Ripped Media", desc: "Encrypted Vault", isExpert: false }
];

    
  if (panic) {
    return (
      <div style={{background:'black', color:'#00ff00', height:'100vh', padding:'10px', fontFamily:'monospace', fontSize:'11px', zIndex:9999, position:'fixed', top:0, left:0, width:'100%', overflow:'hidden'}}>
        Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)<br/>
        CPU: 0 PID: 1 Comm: init Not tainted Sovereign-OS<br/>
        Hardware name: Secure Enclave<br/>
        Call Trace:<br/>
         dump_stack+0x5c/0x7c<br/>
         panic+0x101/0x2c3<br/>
         sys_mount+0x289/0x2e0<br/>
        ---[ end Kernel panic - not syncing: Fatal exception ]---<br/><br/>
        [!] SEGMENTATION FAULT IN ENCRYPTED MODULE.<br/>
        [!] ATTEMPTING MEMORY DUMP... FAILED.<br/>
        [!] CRITICAL I/O ERROR ON SECURE VOLUME.<br/>
        [!] SYSTEM HALTED.
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-6 max-w-xl mx-auto select-none animate-fade-in">
            
            {/* Mesh Opt-In Banner */}
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

            {/* Shizuku Core Engine Banner - HIDDEN ON BASIC */}
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
                    // ABORT RENDERING EXPERT TOOLS IN BASIC MODE
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

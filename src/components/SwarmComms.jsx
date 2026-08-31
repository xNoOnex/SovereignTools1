import { useSecureStorage } from '../hooks/useSecureStorage';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';

export function SwarmComms({ onNavigate }) {
    const [swarmId, setSwarmId] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [activeSwarm, setActiveSwarm] = useState(null);
    const [draftMessage, setDraftMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    
    // Demolition States
    const [showDestruct, setShowDestruct] = useState(false);
    const [destructPin, setDestructPin] = useState('');
    const MASTER_PIN = '9999'; 
    
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (activeSwarm) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeSwarm?.messages]);

    const handleUnlock = () => {
        // Reset destruct states on new attempt
        setShowDestruct(false);
        setDestructPin('');
        
        if (!swarmId.trim() || !passphrase) {
            setErrorMsg("SWARM ID AND PASSPHRASE REQUIRED.");
            return;
        }

        const storageKey = `swarm_ledger_${swarmId.trim().toLowerCase()}`;
        const existingLedger = localStorage.getItem(storageKey);

        if (existingLedger) {
            try {
                const bytes = CryptoJS.AES.decrypt(existingLedger, passphrase);
                const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

                if (!decryptedData) throw new Error("DECRYPTION FAILED");

                const parsedMessages = JSON.parse(decryptedData);
                setActiveSwarm({ id: swarmId.trim(), key: passphrase, messages: parsedMessages });
                setErrorMsg("");
            } catch (err) {
                setErrorMsg("ACCESS DENIED: INCORRECT PASSPHRASE OR CORRUPT LEDGER.");
            }
        } else {
            const initialData = JSON.stringify([]);
            const encrypted = CryptoJS.AES.encrypt(initialData, passphrase).toString();
            localStorage.setItem(storageKey, encrypted);
            setActiveSwarm({ id: swarmId.trim(), key: passphrase, messages: [] });
            setErrorMsg("");
        }
    };

    const executeDestruct = () => {
        if (destructPin === MASTER_PIN) {
            localStorage.removeItem(`swarm_ledger_${swarmId.trim().toLowerCase()}`);
            setErrorMsg('');
            setPassphrase('');
            setSwarmId('');
            setShowDestruct(false);
            setDestructPin('');
        } else {
            setErrorMsg("CRITICAL ERROR: INVALID DESTRUCTION PIN.");
            setShowDestruct(false);
            setDestructPin('');
        }
    };

    const handleSend = () => {
        if (!draftMessage.trim()) return;

        const newMessage = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            text: draftMessage.trim(),
            timestamp: new Date().toISOString(),
            sender: 'LOCAL_NODE'
        };

        const updatedMessages = [...activeSwarm.messages, newMessage];
        const storageKey = `swarm_ledger_${activeSwarm.id.toLowerCase()}`;
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(updatedMessages), activeSwarm.key).toString();
        
        localStorage.setItem(storageKey, encrypted);
        setActiveSwarm({ ...activeSwarm, messages: updatedMessages });
        setDraftMessage('');
    };

    const handleLock = () => {
        setActiveSwarm(null);
        setSwarmId('');
        setPassphrase('');
        setErrorMsg('');
        setShowDestruct(false);
    };

    return (
        <div className="absolute inset-0 bg-black z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 bg-zinc-950/80 border-b border-zinc-900 shrink-0">
                <div className="flex items-center gap-4">
                    {!activeSwarm && (
                        <button onClick={() => onNavigate('home')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95 shrink-0">
                            ←
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-2">
                            <span>🐝</span> {activeSwarm ? activeSwarm.id : 'Swarm Comms'}
                        </h2>
                        <p className="text-orange-500 font-mono text-xs mt-1">
                            {activeSwarm ? 'AES-256 VAULT UNLOCKED' : 'CRYPTOGRAPHIC GOSSIP PROTOCOL'}
                        </p>
                    </div>
                </div>
                {activeSwarm && (
                    <button onClick={handleLock} className="px-4 py-2 bg-red-950/40 border border-red-900 text-red-500 rounded-lg text-[10px] font-black tracking-widest uppercase hover:bg-red-900/60 active:scale-95 transition-all">
                        LOCK VAULT
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                
                {/* STATE 1: VAULT LOCKED (FORGE UI) */}
                {!activeSwarm && (
                    <div className="flex-1 space-y-4">
                        <div className="border border-orange-900/50 bg-orange-950/20 rounded-2xl p-4 shadow-lg shrink-0">
                            <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span>🗝️</span> Forge or Join Swarm
                            </h3>
                            <p className="text-[11px] text-orange-200/70 mb-4 leading-relaxed font-sans">
                                Enter a Swarm ID and Passphrase. If it exists on your local ledger, it will unlock. If not, a new cryptographic vault will be forged.
                            </p>
                            
                            {errorMsg && (
                                <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-lg text-[10px] font-black tracking-widest uppercase mb-4 flex flex-col gap-2">
                                    <span>⚠️ {errorMsg}</span>
                                    
                                    {!showDestruct ? (
                                        <button 
                                            onClick={() => setShowDestruct(true)} 
                                            className="bg-red-900/60 border border-red-500/50 text-red-200 py-2 rounded-lg mt-1 hover:bg-red-500 hover:text-black transition-all active:scale-95"
                                        >
                                            INITIATE LEDGER DESTRUCTION
                                        </button>
                                    ) : (
                                        <div className="flex gap-2 mt-1">
                                            <input 
                                                type="password" 
                                                placeholder="ENTER DESTRUCT PIN"
                                                value={destructPin}
                                                onChange={(e) => setDestructPin(e.target.value)}
                                                className="flex-1 bg-red-950 border border-red-500/50 text-red-200 p-2 rounded-lg text-center placeholder-red-900/50 focus:outline-none focus:border-red-500"
                                            />
                                            <button 
                                                onClick={executeDestruct}
                                                className="w-16 bg-red-600 text-black font-black rounded-lg hover:bg-red-500 active:scale-95 transition-all"
                                            >
                                                EXEC
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <input 
                                type="text" 
                                placeholder="Swarm ID (e.g. Sector-4)" 
                                value={swarmId}
                                onChange={(e) => setSwarmId(e.target.value.toUpperCase())}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[12px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500/50 mb-3 uppercase"
                            />
                            <input 
                                type="password" 
                                placeholder="AES-256 Passphrase" 
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[12px] text-zinc-300 font-mono focus:outline-none focus:border-orange-500/50 mb-4"
                            />
                            <button onClick={handleUnlock} className="w-full bg-orange-900/60 border border-orange-500/50 text-orange-400 py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-orange-500 hover:text-black transition-all shadow-inner active:scale-95">
                                UNLOCK / FORGE SWARM
                            </button>
                        </div>

                        {/* Disclaimers & Info */}
                        <div className="border border-zinc-800 bg-zinc-900/30 rounded-2xl p-4 mt-auto">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span>ℹ️</span> MODULE INFO & DISCLAIMERS
                            </h3>
                            <div className="space-y-3">
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                                    <strong className="text-zinc-400">Asynchronous Relay:</strong> Messages are encrypted locally and held in a silent digital dead-drop on this device.
                                </p>
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                                    <strong className="text-zinc-400">Zero-Knowledge:</strong> Devices act as carrier pigeons. They cannot read encrypted packets without the precise Passphrase, but will automatically route them to authorized peers.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATE 2: VAULT UNLOCKED (CHAT UI) */}
                {activeSwarm && (
                    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/50 rounded-2xl border border-zinc-900 p-4">
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
                            {activeSwarm.messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <span className="text-3xl mb-2">📭</span>
                                    <p className="text-[10px] font-black tracking-widest text-white uppercase">Vault is Empty</p>
                                </div>
                            ) : (
                                activeSwarm.messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'LOCAL_NODE' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl ${msg.sender === 'LOCAL_NODE' ? 'bg-orange-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'}`}>
                                            <p className="text-[13px] leading-relaxed font-sans">{msg.text}</p>
                                            <span className="text-[8px] opacity-60 mt-1 block font-mono text-right uppercase">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="pt-4 border-t border-zinc-900 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={draftMessage}
                                onChange={(e) => setDraftMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Drop encrypted message into ledger..."
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[12px] text-white focus:outline-none focus:border-orange-500/50"
                            />
                            <button 
                                onClick={handleSend}
                                className="w-12 bg-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-400 active:scale-95 transition-all shrink-0"
                            >
                                <span className="text-black text-lg">↑</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

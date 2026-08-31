import { Filesystem, Directory } from '@capacitor/filesystem';
import { Innertube } from 'youtubei.js/web';
import React, { useState, useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';

const StealthBrowser = registerPlugin('StealthBrowser');

export function SovereignBrowser({ onNavigate }) {
    const [tabs, setTabs] = useState([{ id: 1, title: 'New Tab', url: 'https://', history: [] }]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [address, setAddress] = useState('https://');
    
    // UI View Toggles
    const [showMenu, setShowMenu] = useState(false);
    const [activeView, setActiveView] = useState('blank'); // 'blank', 'settings', 'bookmarks'
    
    // Ripper State
    const [isExtracting, setIsExtracting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [foundMedia, setFoundMedia] = useState([]);

    // Security State
    const [autoNuke, setAutoNuke] = useState(true);
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyHost, setProxyHost] = useState('127.0.0.1');
    const [proxyPort, setProxyPort] = useState('9050');
    const [lowRamMode, setLowRamMode] = useState(false);

    const [vaultKey, setVaultKey] = useState('');
    const [bookmarks, setBookmarks] = useState([]);
    const [isUnlocked, setIsUnlocked] = useState(false);

    // Refs for Event Listeners
    const tabsRef = useRef(tabs);
    const activeTabIdRef = useRef(activeTabId);
    const addressRef = useRef(address);

    useEffect(() => { tabsRef.current = tabs; }, [tabs]);
    useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);
    useEffect(() => { addressRef.current = address; }, [address]);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    useEffect(() => { if (activeTab) setAddress(activeTab.url); }, [activeTabId]);

    // --- CRYPTOGRAPHY ---
    const getCryptoKey = async (password) => {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
        return await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: enc.encode("sovereign_salt_99"), iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
        );
    };

    const unlockVault = async () => {
        if (!vaultKey) { alert("❌ Enter a Vault Key."); return; }
        if (localStorage.getItem('sovereign_bookmarks')) localStorage.removeItem('sovereign_bookmarks');
        try {
            const savedEnc = localStorage.getItem('sovereign_bookmarks_enc');
            if (!savedEnc) { setIsUnlocked(true); return; }
            const binaryString = atob(savedEnc);
            const combined = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) combined[i] = binaryString.charCodeAt(i);
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);
            const key = await getCryptoKey(vaultKey);
            const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
            
            // Clean bookmarks to ensure they only store simple URLs
            let parsed = JSON.parse(new TextDecoder().decode(decryptedBuffer));
            setBookmarks(parsed.filter(b => typeof b === 'string'));
            setIsUnlocked(true);
        } catch (e) { alert("❌ Decryption Failed. Incorrect Vault Key."); }
    };

    const saveEncryptedBookmarks = async (newBookmarks) => {
        try {
            const key = await getCryptoKey(vaultKey);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(JSON.stringify(newBookmarks)));
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);
            let binaryStr = "";
            for (let i = 0; i < combined.byteLength; i++) binaryStr += String.fromCharCode(combined[i]);
            localStorage.setItem('sovereign_bookmarks_enc', btoa(binaryStr));
        } catch (e) { console.error("Encryption failed", e); }
    };

    const toggleBookmark = async () => {
        if (!isUnlocked) return;
        let updated = bookmarks.includes(address) ? bookmarks.filter(b => b !== address) : [...bookmarks, address];
        setBookmarks(updated);
        await saveEncryptedBookmarks(updated);
        setShowMenu(false);
    };

    // --- NAVIGATION ---
    const createNewTab = () => {
        const newId = Date.now();
        setTabs(prev => [...prev, { id: newId, title: 'New Tab', url: 'https://', history: [] }]);
        setActiveTabId(newId);
        setActiveView('blank');
    };

    const closeTab = (id, e) => {
        if (e) e.stopPropagation();
        if (tabs.length === 1) {
            setTabs([{ id: Date.now(), title: 'New Tab', url: 'https://', history: [] }]);
            setActiveView('blank');
            return;
        }
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);
        if (activeTabId === id) setActiveTabId(remaining[remaining.length - 1].id);
    };

    const handleNavigate = async (targetUrl = address) => {
        let finalUrl = targetUrl.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) finalUrl = 'https://' + finalUrl;
        
        setTabs(prev => prev.map(t => {
            if (t.id === activeTabId) {
                return { ...t, url: finalUrl, title: finalUrl.replace(/^https?:\/\//, '').substring(0, 15), history: t.url && t.url !== 'https://' ? [...t.history, t.url] : t.history };
            }
            return t;
        }));
        setAddress(finalUrl);
        setShowMenu(false);
        setActiveView('blank');
        try { await StealthBrowser.openNative({ url: finalUrl, autoNuke, proxyHost: proxyEnabled ? proxyHost : "", proxyPort: proxyEnabled ? parseInt(proxyPort) : 0 }); } catch (error) { alert("Native Engine Error: " + error.message); }
    };

    const goBack = async () => {
        const targetTab = tabsRef.current.find(t => t.id === activeTabIdRef.current);
        if (targetTab && targetTab.history.length > 0) {
            const newHistory = [...targetTab.history];
            const prevUrl = newHistory.pop();
            setTabs(prev => prev.map(t => t.id === activeTabIdRef.current ? { ...t, url: prevUrl, title: prevUrl.replace(/^https?:\/\//, '').substring(0, 15), history: newHistory } : t));
            setAddress(prevUrl);
            await StealthBrowser.openNative({ url: prevUrl, autoNuke, proxyHost: proxyEnabled ? proxyHost : "", proxyPort: proxyEnabled ? parseInt(proxyPort) : 0 });
        } else if (tabsRef.current.length > 1) {
            closeTab(activeTabIdRef.current);
        } else {
            onNavigate('home');
        }
    };

    // --- PAGE SCANNER (Finds Media on Current Site) ---
    const scanCurrentPage = async () => {
        if (address === 'https://' || !address) { alert("Navigate to a webpage first."); return; }
        setShowMenu(false);
        setIsScanning(true);
        
        try {
            if (address.includes('youtube.com') || address.includes('youtu.be')) {
                setFoundMedia([{ title: "YouTube Video Stream", url: address }]);
                setIsScanning(false);
                return;
            }

            const res = await fetch(address, { mode: 'cors' });
            const html = await res.text();
            
            const regex = /["'](https?:\/\/[^"']*\.(?:mp4|webm|m3u8|mp3|wav|jpg|jpeg|png|gif))["']/gi;
            const matches = [...html.matchAll(regex)];
            
            let uniqueUrls = [...new Set(matches.map(m => m[1]))];
            let mediaObjects = uniqueUrls.map(u => ({
                title: u.split('/').pop().substring(0, 30) || 'Found Payload',
                url: u
            }));

            if (mediaObjects.length === 0) alert("No direct media files found in the source code of this page.");
            else setFoundMedia(mediaObjects);

        } catch (e) {
            alert("Scanner blocked by site security. Attempting blind direct rip...");
            ripPayload(address, true);
        }
        setIsScanning(false);
    };

    // --- GOD-TIER OMNI-RIPPER ENGINE ---
    const ripPayload = async (targetUrl, isManual = false) => {
        if (!vaultKey) { alert("❌ Vault Locked."); return; }
        if (!isManual && !window.confirm(`🚨 TARGET ACQUIRED!\nURL: ${targetUrl.substring(0, 50)}...\n\nExecute ripping sequence to Vault?`)) return;

        setIsExtracting(true);
        try {
            const targetLower = targetUrl.toLowerCase();
            const key = await getCryptoKey(vaultKey);
            let sanitizedTitle = `rip_${Date.now()}`;

            if (lowRamMode) {
                alert("🌊 Low-RAM Streaming Mode Engaged.");
                let isFirstChunk = true;
                
                const processAndAppendChunk = async (chunkBuffer, extType) => {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, chunkBuffer);
                    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                    combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);

                    let binaryStr = "";
                    for (let j = 0; j < combined.byteLength; j++) binaryStr += String.fromCharCode(combined[j]);
                    const b64 = btoa(binaryStr);

                    if (isFirstChunk) {
                        try { await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); } catch(e) {}
                        await Filesystem.writeFile({ path: `sovereign_media/${sanitizedTitle}.${extType}`, data: b64, directory: Directory.Data });
                        isFirstChunk = false;
                    } else {
                        await Filesystem.appendFile({ path: `sovereign_media/${sanitizedTitle}.${extType}`, data: b64, directory: Directory.Data });
                    }
                };

                if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
                    let videoId = targetLower.includes('youtu.be/') ? targetUrl.split('youtu.be/')[1].split('?')[0] : targetLower.includes('/shorts/') ? targetUrl.split('/shorts/')[1].split('?')[0] : new URL(targetUrl).searchParams.get('v');
                    const yt = await Innertube.create();
                    const ytInfo = await yt.getInfo(videoId);
                    sanitizedTitle = (ytInfo.basic_info.title || `yt_${videoId}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
                    
                    const stream = await yt.download(videoId, { type: 'video+audio', quality: 'best', format: 'mp4' });
                    const reader = stream.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await processAndAppendChunk(value, 'mp4');
                        await new Promise(r => setTimeout(r, 15));
                    }
                } else if (targetLower.includes('.m3u8')) {
                    const rText = await (await fetch(targetUrl, { mode: 'cors' })).text();
                    let baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                    const chunkUrls = rText.split('\n').filter(line => line.trim() && !line.startsWith('#')).map(line => line.startsWith('http') ? line : baseUrl + line);
                    
                    for (let i = 0; i < chunkUrls.length; i++) {
                        const segRes = await fetch(chunkUrls[i], { mode: 'cors' });
                        await processAndAppendChunk(await segRes.arrayBuffer(), 'ts');
                        await new Promise(r => setTimeout(r, 15));
                    }
                }
                alert(`✅ Massive Payload Vaulted!`);
                setIsExtracting(false);
                return; 
            }

            let mediaBuffer;
            let ext = 'bin';

            if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
                alert("🔴 YouTube Engine: Bypassing...");
                let videoId = targetLower.includes('youtu.be/') ? targetUrl.split('youtu.be/')[1].split('?')[0] : targetLower.includes('/shorts/') ? targetUrl.split('/shorts/')[1].split('?')[0] : new URL(targetUrl).searchParams.get('v');
                const yt = await Innertube.create();
                const ytInfo = await yt.getInfo(videoId);
                sanitizedTitle = (ytInfo.basic_info.title || `yt_${videoId}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
                
                const stream = await yt.download(videoId, { type: 'video+audio', quality: 'best', format: 'mp4' });
                const chunks = [];
                const reader = stream.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break; chunks.push(value);
                }
                mediaBuffer = await new Blob(chunks).arrayBuffer();
                ext = 'mp4';
            } else {
                if (targetLower.startsWith('blob:')) throw new Error("Blob URLs require direct network interception.");
                if (targetLower.includes('.m3u8')) throw new Error("HLS detected. Turn on Low-RAM mode in settings.");

                alert("🌐 Pulling payload into RAM...");
                const res = await fetch(targetUrl, { mode: 'cors' });
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                mediaBuffer = await res.arrayBuffer();
                const contentType = res.headers.get('content-type') || '';
                
                if (contentType.includes('image/')) ext = 'jpg';
                else if (contentType.includes('video/')) ext = 'mp4';
                else if (contentType.includes('audio/')) ext = 'mp3';
                else ext = 'dat'; 
            }

            alert("🔐 Encrypting payload...");
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, mediaBuffer);

            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);

            const fileReader = new FileReader();
            fileReader.onloadend = async () => {
                const b64 = fileReader.result.split(',')[1];
                const fname = `${sanitizedTitle}_${Date.now()}.${ext}`;
                try { await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); } catch(e) {}
                await Filesystem.writeFile({ path: `sovereign_media/${fname}`, data: b64, directory: Directory.Data });
                alert(`✅ Payload Vaulted!\nSaved as: ${fname}`);
            };
            fileReader.readAsDataURL(new Blob([combined]));

        } catch (e) { alert("❌ Extraction Failed: " + e.message); } 
        finally { setIsExtracting(false); }
    };

    // Fixes the YouTube Blob Error from your video!
    useEffect(() => {
        const backSub = App.addListener('backButton', () => {
            if (showMenu || activeView !== 'blank') { setShowMenu(false); setActiveView('blank'); } 
            else goBack();
        });
        
        const listener = StealthBrowser.addListener('onMediaDetected', (info) => {
            let mediaUrl = info.url;
            const currentAddress = addressRef.current;
            // If native popup sends a useless blob but we are on youtube, swap it for the page URL!
            if (mediaUrl.startsWith('blob:') && (currentAddress.includes('youtube.com') || currentAddress.includes('youtu.be'))) {
                mediaUrl = currentAddress;
            }
            ripPayload(mediaUrl, false);
        });
        return () => { if (listener && listener.remove) listener.remove(); if (backSub && backSub.remove) backSub.remove(); };
    }, [vaultKey, autoNuke, proxyEnabled, proxyHost, proxyPort, lowRamMode]);

    return (
        <div className="flex flex-col h-full bg-black text-zinc-300 font-sans relative">
            
            {/* LOCK SCREEN */}
            {!isUnlocked ? (
                <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
                    <span className="text-4xl mb-4">🌐</span>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-6">Stealth Browser</h1>
                    <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-cyan-900/50 shadow-inner w-full max-w-sm">
                        <span className="text-lg pl-2">🔑</span>
                        <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Vault Key..." className="flex-grow bg-transparent text-sm font-mono text-cyan-400 focus:outline-none placeholder:text-zinc-600 px-2" />
                        <button onClick={unlockVault} className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase active:scale-95 transition-all">UNLOCK</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full w-full">
                    
                    {/* TOP BAR: TABS */}
                    <div className="flex bg-zinc-950 pt-2 px-2 gap-1 overflow-x-auto border-b border-zinc-800 shrink-0 no-scrollbar">
                        {tabs.map(tab => (
                            <div key={tab.id} onClick={() => { setActiveTabId(tab.id); setActiveView('blank'); }} className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-mono cursor-pointer transition-all max-w-[160px] min-w-[120px] ${tab.id === activeTabId ? 'bg-zinc-900 text-cyan-400 border-t border-l border-r border-zinc-700/50 shadow-[0_-5px_15px_rgba(6,182,212,0.1)]' : 'bg-black text-zinc-500 hover:bg-zinc-900'}`}>
                                <span className="truncate flex-1">{tab.title}</span>
                                <span onClick={(e) => closeTab(tab.id, e)} className="text-zinc-600 hover:text-rose-400 font-bold ml-2">×</span>
                            </div>
                        ))}
                        <button onClick={createNewTab} className="px-3 py-2 text-zinc-500 hover:text-cyan-400 font-bold text-lg leading-none">+</button>
                    </div>

                    {/* ADDRESS BAR ROW */}
                    <div className="flex items-center gap-2 p-2 bg-zinc-900 border-b border-zinc-800 shrink-0 relative">
                        <button onClick={goBack} disabled={!activeTab || activeTab.history.length === 0} className={`p-2 rounded-lg font-bold transition-all ${activeTab && activeTab.history.length > 0 ? 'text-cyan-400 hover:bg-zinc-800' : 'text-zinc-700 opacity-50'}`}>←</button>
                        
                        <div className="flex-1 bg-black rounded-xl flex items-center px-3 border border-zinc-700 focus-within:border-cyan-500 transition-colors h-11">
                            <span className="text-[10px] text-zinc-500 mr-2">🔒</span>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleNavigate()} placeholder="Type URL..." className="w-full bg-transparent text-sm font-mono text-zinc-200 focus:outline-none" />
                        </div>
                        
                        <button onClick={() => handleNavigate()} className="px-4 py-2 bg-cyan-900/30 text-cyan-400 font-black text-xs tracking-widest rounded-xl active:scale-95 transition-all border border-cyan-900/50 h-11">GO</button>
                        
                        {/* 3-DOT MENU BUTTON */}
                        <button onClick={() => setShowMenu(!showMenu)} className={`w-10 h-11 flex items-center justify-center rounded-xl transition-all ${showMenu ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                            <span className="text-xl leading-none">⋮</span>
                        </button>

                        {/* 3-DOT MENU DROPDOWN */}
                        {showMenu && (
                            <div className="absolute top-14 right-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 w-56 z-50 flex flex-col gap-1 animate-fadeIn">
                                <button onClick={scanCurrentPage} disabled={isScanning || isExtracting} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-lg flex items-center gap-3 text-emerald-400 font-bold text-sm transition-all">
                                    {isScanning ? '⏳ Scanning...' : isExtracting ? '📥 Ripping...' : '🎯 Scan & Rip Media'}
                                </button>
                                <div className="h-px bg-zinc-800 my-1 mx-2"></div>
                                <button onClick={toggleBookmark} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-lg flex items-center gap-3 text-zinc-300 text-sm transition-all">
                                    ★ {bookmarks.includes(address) ? 'Remove Bookmark' : 'Bookmark Site'}
                                </button>
                                <button onClick={() => { setActiveView('bookmarks'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-lg flex items-center gap-3 text-zinc-300 text-sm transition-all">
                                    📁 View Bookmarks
                                </button>
                                <button onClick={() => { setActiveView('settings'); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-lg flex items-center gap-3 text-zinc-300 text-sm transition-all">
                                    ⚙️ Engine Settings
                                </button>
                                <div className="h-px bg-zinc-800 my-1 mx-2"></div>
                                <button onClick={() => onNavigate('home')} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-lg flex items-center gap-3 text-rose-400 font-bold text-sm transition-all">
                                    ✕ Exit Browser
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 p-4 overflow-y-auto bg-black relative">
                        
                        {/* FOUND MEDIA MODAL OVERLAY */}
                        {foundMedia.length > 0 && (
                            <div className="absolute inset-0 bg-black/95 z-[100] flex flex-col p-6 animate-fadeIn">
                                <h2 className="text-emerald-400 font-black text-lg mb-1 flex items-center gap-2"><span>🎯</span> Scanned Payloads</h2>
                                <p className="text-zinc-500 text-[10px] font-mono mb-4 border-b border-zinc-800 pb-3">Found {foundMedia.length} media target(s)</p>
                                <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                                    {foundMedia.map((media, idx) => (
                                        <button key={idx} onClick={() => { setFoundMedia([]); ripPayload(media.url, true); }} className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-left hover:border-emerald-500 active:scale-95 transition-all flex items-center justify-between shadow-lg">
                                            <div className="flex flex-col truncate pr-4">
                                                <span className="text-xs font-bold text-zinc-200 truncate">{media.title}</span>
                                                <span className="text-[9px] font-mono text-zinc-500 truncate mt-1">{media.url}</span>
                                            </div>
                                            <span className="text-lg bg-black p-2 rounded-lg border border-zinc-800">📥</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setFoundMedia([])} className="mt-4 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all text-sm">CANCEL</button>
                            </div>
                        )}

                        {/* ROUTING VIEWS */}
                        {activeView === 'settings' ? (
                            <div className="flex flex-col gap-5 animate-fadeIn max-w-md mx-auto">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Engine Settings</h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🌊 Low-RAM Streaming Mode</span>
                                        <span className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Chunk-by-Chunk AES for massive files</span>
                                    </div>
                                    <input type="checkbox" checked={lowRamMode} onChange={() => setLowRamMode(!lowRamMode)} className="w-5 h-5 accent-cyan-500" />
                                </div>
                                <div className="h-px bg-zinc-800 w-full" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🔥 Auto-Nuke Session on Close</span>
                                    <input type="checkbox" checked={autoNuke} onChange={() => setAutoNuke(!autoNuke)} className="w-5 h-5 accent-rose-600" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🛡️ Route via SOCKS5 Proxy</span>
                                        <input type="checkbox" checked={proxyEnabled} onChange={() => setProxyEnabled(!proxyEnabled)} className="w-5 h-5 accent-emerald-500" />
                                    </div>
                                    {proxyEnabled && (
                                        <div className="flex gap-2">
                                            <input type="text" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} className="w-2/3 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Host IP" />
                                            <input type="text" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} className="w-1/3 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Port" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeView === 'bookmarks' ? (
                            <div className="flex flex-col gap-3 animate-fadeIn max-w-md mx-auto">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Vaulted Sites</h3>
                                {bookmarks.length === 0 ? (
                                    <div className="text-center text-xs font-mono text-zinc-600 py-10 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">No secure bookmarks saved.</div>
                                ) : (
                                    bookmarks.map((bm, idx) => (
                                        <div key={idx} onClick={() => { setAddress(bm); handleNavigate(bm); }} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-cyan-400 truncate cursor-pointer hover:border-cyan-500 active:scale-95 transition-all shadow-md">{bm}</div>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* BLANK BROWSER STATE (Command Center Idle) */
                            <div className="flex flex-col items-center justify-center h-full opacity-30 select-none animate-fadeIn pointer-events-none">
                                <span className="text-5xl mb-4">🌐</span>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Secure Webkit Ready</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SovereignBrowser;

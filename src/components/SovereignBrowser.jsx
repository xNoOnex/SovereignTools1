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
    
    // UI Toggles
    const [showMenu, setShowMenu] = useState(false);
    const [showTabs, setShowTabs] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // Ripper State
    const [isExtracting, setIsExtracting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [foundMedia, setFoundMedia] = useState([]);

    // Security & Proxy State
    const [autoNuke, setAutoNuke] = useState(true);
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyHost, setProxyHost] = useState('127.0.0.1');
    const [proxyPort, setProxyPort] = useState('9050');
    const [lowRamMode, setLowRamMode] = useState(false);

    const [vaultKey, setVaultKey] = useState('');
    const [bookmarks, setBookmarks] = useState([]);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const tabsRef = useRef(tabs);
    const activeTabIdRef = useRef(activeTabId);

    useEffect(() => { tabsRef.current = tabs; }, [tabs]);
    useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    useEffect(() => {
        if (activeTab) setAddress(activeTab.url);
    }, [activeTabId]);

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
            
            // Clean legacy bookmarks to ensure they are strictly URLs
            let parsed = JSON.parse(new TextDecoder().decode(decryptedBuffer));
            let cleanUrls = parsed.map(b => typeof b === 'string' ? b : b.url).filter(Boolean);
            setBookmarks(cleanUrls);
            setIsUnlocked(true);
        } catch (e) { alert("❌ Decryption Failed. Incorrect Vault Key."); }
    };

    const saveEncryptedBookmarks = async (newBookmarks) => {
        try {
            const key = await getCryptoKey(vaultKey);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(JSON.stringify(newBookmarks)));
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);
            let binaryStr = "";
            for (let i = 0; i < combined.byteLength; i++) binaryStr += String.fromCharCode(combined[i]);
            localStorage.setItem('sovereign_bookmarks_enc', btoa(binaryStr));
        } catch (e) { console.error("Encryption failed", e); }
    };

    const toggleBookmark = async () => {
        if (!isUnlocked) { alert("❌ Unlock Vault First."); return; }
        let updated = bookmarks.includes(address) ? bookmarks.filter(b => b !== address) : [...bookmarks, address];
        setBookmarks(updated);
        await saveEncryptedBookmarks(updated);
    };

    // --- NAVIGATION ---
    const createNewTab = () => {
        const newId = Date.now();
        setTabs(prev => [...prev, { id: newId, title: 'New Tab', url: 'https://', history: [] }]);
        setActiveTabId(newId);
        setShowTabs(false);
        setShowMenu(false);
    };

    const closeTab = (id, e) => {
        if (e) e.stopPropagation();
        if (tabs.length === 1) {
            setTabs([{ id: Date.now(), title: 'New Tab', url: 'https://', history: [] }]);
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

    // --- MEDIA SCRAPER (Extracts Payload Links from Current Page) ---
    const scanCurrentPage = async () => {
        if (address === 'https://' || !address) { alert("Navigate to a webpage first."); return; }
        
        setIsScanning(true);
        setShowMenu(false);
        
        try {
            if (address.includes('youtube.com') || address.includes('youtu.be')) {
                setFoundMedia([{ title: "YouTube Media Stream", url: address }]);
                setIsScanning(false);
                return;
            }

            const res = await fetch(address, { mode: 'cors' });
            const html = await res.text();
            
            // Regex sniffs out standard media links embedded in the raw HTML
            const regex = /["'](https?:\/\/[^"']*\.(?:mp4|webm|m3u8|mp3|wav|jpg|jpeg|png|gif|webp))["']/gi;
            const matches = [...html.matchAll(regex)];
            
            let uniqueUrls = [...new Set(matches.map(m => m[1]))];
            let mediaObjects = uniqueUrls.map(u => ({
                title: u.split('/').pop().substring(0, 35) || 'Media Payload',
                url: u
            }));

            if (mediaObjects.length === 0) {
                alert("No extractable media found embedded on this page.");
            } else {
                setFoundMedia(mediaObjects);
            }
        } catch (e) {
            alert("Scrape Blocked by CORS/Network. Attempting direct native rip...");
            ripPayload(address, true); // Fallback to direct rip if fetch is blocked
        }
        setIsScanning(false);
    };

    // --- GOD-TIER OMNI-RIPPER ENGINE ---
    const ripPayload = async (targetUrl, isManual = false) => {
        if (!vaultKey) { alert("❌ Vault is Locked. Enter Session Vault Key first."); return; }
        if (!isManual && !window.confirm(`🚨 TARGET ACQUIRED!\nURL: ${targetUrl.substring(0, 50)}...\n\nExecute ripping sequence to Encrypted Vault?`)) return;

        setIsExtracting(true);
        try {
            const targetLower = targetUrl.toLowerCase();
            const key = await getCryptoKey(vaultKey);
            let sanitizedTitle = `rip_${Date.now()}`;

            if (lowRamMode) {
                alert("🌊 Low-RAM Streaming Mode Engaged: Intercepting chunk-by-chunk...");
                let isFirstChunk = true;
                let finalFilename = '';
                
                const processAndAppendChunk = async (chunkBuffer, extType) => {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, chunkBuffer);
                    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                    combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);

                    let binaryStr = "";
                    for (let j = 0; j < combined.byteLength; j++) binaryStr += String.fromCharCode(combined[j]);
                    const b64 = btoa(binaryStr);

                    finalFilename = `${sanitizedTitle}_chunked.${extType}`;
                    if (isFirstChunk) {
                        try { await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); } catch(e) {}
                        await Filesystem.writeFile({ path: `sovereign_media/${finalFilename}`, data: b64, directory: Directory.Data });
                        isFirstChunk = false;
                    } else {
                        await Filesystem.appendFile({ path: `sovereign_media/${finalFilename}`, data: b64, directory: Directory.Data });
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
                } else {
                    const res = await fetch(targetUrl, { mode: 'cors' });
                    const reader = res.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await processAndAppendChunk(value, 'mp4'); 
                        await new Promise(r => setTimeout(r, 15));
                    }
                }
                alert(`✅ Massive Payload Vaulted!\nSaved as: ${finalFilename}`);
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
                if (targetLower.includes('.m3u8')) throw new Error("HLS detected. Toggle Low-RAM mode in settings.");

                alert("🌐 Universal Scraper: Pulling payload into RAM...");
                const res = await fetch(targetUrl, { mode: 'cors' });
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                mediaBuffer = await res.arrayBuffer();
                const contentType = res.headers.get('content-type') || '';

                if (contentType.includes('image/jpeg') || targetLower.includes('.jpg')) ext = 'jpg';
                else if (contentType.includes('image/png') || targetLower.includes('.png')) ext = 'png';
                else if (contentType.includes('video/mp4') || targetLower.includes('.mp4')) ext = 'mp4';
                else if (contentType.includes('video/webm') || targetLower.includes('.webm')) ext = 'webm';
                else if (contentType.includes('audio/mpeg') || targetLower.includes('.mp3')) ext = 'mp3';
                else ext = 'dat'; 
            }

            alert("🔐 Encrypting payload with AES-256-GCM...");
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

    useEffect(() => {
        const backSub = App.addListener('backButton', () => {
            if (showMenu || showSettings || showTabs) { setShowMenu(false); setShowSettings(false); setShowTabs(false); } 
            else goBack();
        });
        const listener = StealthBrowser.addListener('onMediaDetected', (info) => ripPayload(info.url, false));
        return () => { if (listener && listener.remove) listener.remove(); if (backSub && backSub.remove) backSub.remove(); };
    }, [vaultKey, autoNuke, proxyEnabled, proxyHost, proxyPort, lowRamMode]);

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-300 relative select-none">
            
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto">
                {!isUnlocked ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
                        <span className="text-4xl mb-4">🌐</span>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-6">Stealth Browser</h1>
                        <div className="flex items-center gap-2 bg-black p-3 rounded-xl border border-cyan-900/50 shadow-inner w-full max-w-sm">
                            <span className="text-xl pl-1">🔑</span>
                            <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Vault Key..." className="flex-grow bg-transparent text-sm font-mono text-cyan-400 focus:outline-none placeholder:text-zinc-600" />
                            <button onClick={unlockVault} className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase active:scale-95">UNLOCK</button>
                        </div>
                    </div>
                ) : showTabs ? (
                    /* TAB MANAGER VIEW */
                    <div className="p-4 grid grid-cols-2 gap-4 animate-fadeIn">
                        {tabs.map(tab => (
                            <div key={tab.id} className={`bg-zinc-900 border rounded-2xl flex flex-col overflow-hidden relative shadow-lg ${tab.id === activeTabId ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-zinc-800'}`}>
                                <div className="bg-black border-b border-zinc-800 px-3 py-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-zinc-300 truncate pr-2">{tab.title}</span>
                                    <button onClick={(e) => closeTab(tab.id, e)} className="text-zinc-600 hover:text-rose-400 font-bold p-1">✕</button>
                                </div>
                                <div onClick={() => { setActiveTabId(tab.id); setShowTabs(false); }} className="h-32 bg-zinc-950 p-3 cursor-pointer">
                                    <span className="text-[10px] font-mono text-zinc-500 break-all">{tab.url}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* START PAGE / BOOKMARKS */
                    <div className="flex flex-col h-full p-4 animate-fadeIn">
                        <div className="flex flex-col items-center pt-10 pb-8">
                            <h1 className="text-3xl font-black text-white tracking-tight">Stealth</h1>
                            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest mt-1">Webkit Engine</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Vaulted Sites</span>
                            {bookmarks.length === 0 ? (
                                <div className="text-center text-xs font-mono text-zinc-600 py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">No secure bookmarks saved.</div>
                            ) : (
                                bookmarks.map((bm, idx) => (
                                    <div key={idx} onClick={() => { setAddress(bm); handleNavigate(bm); }} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-mono text-cyan-400 truncate cursor-pointer hover:border-cyan-500 active:scale-95 transition-all shadow-md">{bm}</div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FOUND MEDIA MODAL (RIPPER SELECTION) */}
            {foundMedia.length > 0 && (
                <div className="absolute inset-0 bg-black/95 z-[100] flex flex-col p-6 animate-fadeIn">
                    <h2 className="text-emerald-400 font-black text-xl mb-1 flex items-center gap-2"><span>🎯</span> Payload Scanner</h2>
                    <p className="text-zinc-400 text-xs font-mono mb-4 border-b border-zinc-800 pb-4">Found {foundMedia.length} target(s) on {address}</p>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                        {foundMedia.map((media, idx) => (
                            <button key={idx} onClick={() => { setFoundMedia([]); ripPayload(media.url, true); }} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-left hover:border-emerald-500 active:scale-95 transition-all flex items-center justify-between shadow-lg">
                                <div className="flex flex-col truncate pr-4">
                                    <span className="text-sm font-bold text-zinc-200 truncate">{media.title}</span>
                                    <span className="text-[10px] font-mono text-zinc-500 truncate mt-1">{media.url}</span>
                                </div>
                                <span className="text-xl bg-black p-2 rounded-lg border border-zinc-800">⬇️</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setFoundMedia([])} className="mt-4 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all">CANCEL</button>
                </div>
            )}

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-5 animate-fadeIn">
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
                                <input type="text" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} className="w-2/3 bg-black border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Host IP (e.g. 127.0.0.1)" />
                                <input type="text" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} className="w-1/3 bg-black border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Port" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3-DOT MENU BOTTOM SHEET */}
            {showMenu && isUnlocked && (
                <div className="absolute bottom-20 right-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                    <button onClick={scanCurrentPage} disabled={isScanning} className="w-full text-left px-4 py-4 hover:bg-zinc-800 rounded-xl flex items-center gap-3 text-emerald-400 font-bold text-sm transition-colors">
                        <span className="text-lg">{isScanning ? '⏳' : '🎯'}</span> {isScanning ? 'Scanning Page...' : 'Rip Page Media'}
                    </button>
                    <div className="h-px bg-zinc-800 my-1 mx-2"></div>
                    <button onClick={() => { setShowMenu(false); createNewTab(); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-xl flex items-center gap-3 text-zinc-300 text-sm transition-colors">
                        <span className="text-lg">➕</span> New Tab
                    </button>
                    <button onClick={() => { setShowMenu(false); setShowSettings(true); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-xl flex items-center gap-3 text-zinc-300 text-sm transition-colors">
                        <span className="text-lg">⚙️</span> Engine Settings
                    </button>
                    <div className="h-px bg-zinc-800 my-1 mx-2"></div>
                    <button onClick={() => onNavigate('home')} className="w-full text-left px-4 py-3 hover:bg-zinc-800 rounded-xl flex items-center gap-3 text-rose-400 text-sm transition-colors">
                        <span className="text-lg">✕</span> Exit Browser
                    </button>
                </div>
            )}

            {/* BRAVE-STYLE BOTTOM NAV BAR */}
            {isUnlocked && (
                <div className="bg-zinc-950 border-t border-zinc-900 p-2 flex items-center justify-between gap-2 z-40 pb-4">
                    <button onClick={() => { setAddress('https://'); setShowTabs(false); }} className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <span className="text-xl">🏠</span>
                    </button>
                    
                    <button onClick={toggleBookmark} className={`p-2 transition-colors ${bookmarks.includes(address) ? 'text-amber-400' : 'text-zinc-500 hover:text-white'}`}>
                        <span className="text-xl">★</span>
                    </button>
                    
                    <div className="flex-1 bg-zinc-900 rounded-full flex items-center px-4 border border-zinc-800 focus-within:border-cyan-500 transition-colors h-12 shadow-inner">
                        <span className="text-[10px] text-zinc-500 mr-2">🔒</span>
                        <input 
                            type="text" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                            placeholder="Search or type URL"
                            className="w-full bg-transparent text-sm font-mono text-zinc-200 py-2 focus:outline-none"
                        />
                    </div>
                    
                    <button onClick={() => { setShowTabs(!showTabs); setShowMenu(false); setShowSettings(false); }} className="w-10 h-10 rounded-xl border-2 border-zinc-600 text-zinc-400 flex items-center justify-center text-xs font-black hover:text-white hover:border-zinc-400 transition-colors mx-1">
                        {tabs.length}
                    </button>
                    
                    <button onClick={() => { setShowMenu(!showMenu); setShowSettings(false); }} className="p-2 text-zinc-500 hover:text-white transition-colors flex items-center justify-center h-10 w-10">
                        <span className="text-2xl leading-none -mt-2">⋮</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default SovereignBrowser;

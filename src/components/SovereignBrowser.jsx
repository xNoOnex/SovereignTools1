import { Filesystem, Directory } from '@capacitor/filesystem';
import { Innertube } from 'youtubei.js/web';
import React, { useState, useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';

const StealthBrowser = registerPlugin('StealthBrowser');

export function SovereignBrowser({ onNavigate }) {
    const [tabs, setTabs] = useState([{ id: 1, title: 'New Tab', url: 'https://' }]);
    const [activeTabId, setActiveTabId] = useState(1);
    
    // Security & Proxy State
    const [autoNuke, setAutoNuke] = useState(true);
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyHost, setProxyHost] = useState('127.0.0.1');
    const [proxyPort, setProxyPort] = useState('9050');
    const [lowRamMode, setLowRamMode] = useState(false);

    const [vaultKey, setVaultKey] = useState('');
    const [bookmarks, setBookmarks] = useState([]);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const activeTabIdRef = useRef(activeTabId);
    useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

    const getCryptoKey = async (password) => {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
        return await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: enc.encode("sovereign_salt_99"), iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
        );
    };

    const unlockVault = async () => {
        if (!vaultKey) return;
        try {
            const savedEnc = localStorage.getItem('sovereign_bookmarks_enc');
            if (!savedEnc) { setIsUnlocked(true); return; }
            const binaryString = atob(savedEnc);
            const combined = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) combined[i] = binaryString.charCodeAt(i);
            const key = await getCryptoKey(vaultKey);
            const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: combined.slice(0, 12) }, key, combined.slice(12));
            setBookmarks(JSON.parse(new TextDecoder().decode(decryptedBuffer)));
            setIsUnlocked(true);
        } catch (e) { alert("❌ Decryption Failed. Incorrect Vault Key."); }
    };

    const handleNavigate = async (targetUrl) => {
        let finalUrl = targetUrl.trim();
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
        
        try { await StealthBrowser.openNative({ url: finalUrl, autoNuke, proxyHost: proxyEnabled ? proxyHost : "", proxyPort: proxyEnabled ? parseInt(proxyPort) : 0 }); } catch (e) {}
    };

    const createNewTab = () => {
        setTabs(prev => [...prev, { id: Date.now(), title: 'New Tab', url: 'https://' }]);
    };

    const closeTab = (id, e) => {
        e.stopPropagation();
        if (tabs.length === 1) { setTabs([{ id: Date.now(), title: 'New Tab', url: 'https://' }]); return; }
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);
        if (activeTabId === id) setActiveTabId(remaining[0].id);
    };

    // --- BACKGROUND EVENT LISTENERS ---
    useEffect(() => {
        // 1. Silently update tab URL when browsing natively
        const syncListener = StealthBrowser.addListener('onUrlSync', (info) => {
            setTabs(prev => prev.map(t => t.id === activeTabIdRef.current ? { ...t, url: info.url, title: info.url.replace(/^https?:\/\//, '').substring(0, 15) } : t));
        });

        // 2. Silently save bookmarks when tapped natively
        const bookmarkListener = StealthBrowser.addListener('onBookmark', async (info) => {
            setBookmarks(prev => {
                const updated = prev.includes(info.url) ? prev : [...prev, info.url];
                (async () => {
                    try {
                        const key = await getCryptoKey(vaultKey);
                        const iv = crypto.getRandomValues(new Uint8Array(12));
                        const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(JSON.stringify(updated)));
                        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                        combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);
                        let binaryStr = "";
                        for (let i = 0; i < combined.byteLength; i++) binaryStr += String.fromCharCode(combined[i]);
                        localStorage.setItem('sovereign_bookmarks_enc', btoa(binaryStr));
                    } catch (e) {}
                })();
                return updated;
            });
        });

        // 3. Silently trigger God-Tier Ripper in the background
        const mediaListener = StealthBrowser.addListener('onMediaDetected', async (info) => {
            try {
                const targetLower = info.url.toLowerCase();
                const key = await getCryptoKey(vaultKey);
                let sanitizedTitle = `rip_${Date.now()}`;

                if (lowRamMode) {
                    let isFirstChunk = true;
                    const processAndAppendChunk = async (chunkBuffer, extType) => {
                        const iv = crypto.getRandomValues(new Uint8Array(12));
                        const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, chunkBuffer);
                        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                        combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);
                        let binaryStr = "";
                        for (let j = 0; j < combined.byteLength; j++) binaryStr += String.fromCharCode(combined[j]);
                        if (isFirstChunk) {
                            try { await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); } catch(e) {}
                            await Filesystem.writeFile({ path: `sovereign_media/${sanitizedTitle}_chunked.${extType}`, data: btoa(binaryStr), directory: Directory.Data });
                            isFirstChunk = false;
                        } else {
                            await Filesystem.appendFile({ path: `sovereign_media/${sanitizedTitle}_chunked.${extType}`, data: btoa(binaryStr), directory: Directory.Data });
                        }
                    };

                    if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
                        let videoId = targetLower.includes('youtu.be/') ? info.url.split('youtu.be/')[1].split('?')[0] : targetLower.includes('/shorts/') ? info.url.split('/shorts/')[1].split('?')[0] : new URL(info.url).searchParams.get('v');
                        const yt = await Innertube.create();
                        const ytInfo = await yt.getInfo(videoId);
                        sanitizedTitle = (ytInfo.basic_info.title || `yt_${videoId}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
                        const stream = await yt.download(videoId, { type: 'video+audio', quality: 'best', format: 'mp4' });
                        const reader = stream.getReader();
                        while (true) { const { done, value } = await reader.read(); if (done) break; await processAndAppendChunk(value, 'mp4'); await new Promise(r => setTimeout(r, 15)); }
                    } else if (targetLower.includes('.m3u8')) {
                        const rText = await (await fetch(info.url, { mode: 'cors' })).text();
                        let baseUrl = info.url.substring(0, info.url.lastIndexOf('/') + 1);
                        const chunkUrls = rText.split('\n').filter(line => line.trim() && !line.startsWith('#')).map(line => line.startsWith('http') ? line : baseUrl + line);
                        for (let i = 0; i < chunkUrls.length; i++) {
                            await processAndAppendChunk(await (await fetch(chunkUrls[i], { mode: 'cors' })).arrayBuffer(), 'ts');
                            await new Promise(r => setTimeout(r, 15));
                        }
                    } else {
                        const res = await fetch(info.url, { mode: 'cors' });
                        const reader = res.body.getReader();
                        while (true) { const { done, value } = await reader.read(); if (done) break; await processAndAppendChunk(value, 'mp4'); await new Promise(r => setTimeout(r, 15)); }
                    }
                    return; 
                }

                let mediaBuffer;
                let ext = 'bin';

                if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
                    let videoId = targetLower.includes('youtu.be/') ? info.url.split('youtu.be/')[1].split('?')[0] : targetLower.includes('/shorts/') ? info.url.split('/shorts/')[1].split('?')[0] : new URL(info.url).searchParams.get('v');
                    const yt = await Innertube.create();
                    const ytInfo = await yt.getInfo(videoId);
                    sanitizedTitle = (ytInfo.basic_info.title || `yt_${videoId}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
                    const stream = await yt.download(videoId, { type: 'video+audio', quality: 'best', format: 'mp4' });
                    const chunks = [];
                    const reader = stream.getReader();
                    while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
                    mediaBuffer = await new Blob(chunks).arrayBuffer();
                    ext = 'mp4';
                } else {
                    const res = await fetch(info.url, { mode: 'cors' });
                    mediaBuffer = await res.arrayBuffer();
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('image/')) ext = 'jpg';
                    else if (contentType.includes('video/')) ext = 'mp4';
                    else if (contentType.includes('audio/')) ext = 'mp3';
                    else ext = 'dat'; 
                }

                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, mediaBuffer);
                const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                combined.set(iv, 0); combined.set(new Uint8Array(encryptedBuffer), iv.length);

                const fileReader = new FileReader();
                fileReader.onloadend = async () => {
                    const b64 = fileReader.result.split(',')[1];
                    try { await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); } catch(e) {}
                    await Filesystem.writeFile({ path: `sovereign_media/${sanitizedTitle}_${Date.now()}.${ext}`, data: b64, directory: Directory.Data });
                };
                fileReader.readAsDataURL(new Blob([combined]));
            } catch (e) { console.error("Extraction Failed", e); } 
        });

        return () => { 
            if (syncListener && syncListener.remove) syncListener.remove(); 
            if (bookmarkListener && bookmarkListener.remove) bookmarkListener.remove();
            if (mediaListener && mediaListener.remove) mediaListener.remove(); 
        };
    }, [vaultKey, autoNuke, proxyEnabled, proxyHost, proxyPort, lowRamMode]);

    return (
        <div className="flex flex-col h-full bg-black text-zinc-300 font-sans">
            {!isUnlocked ? (
                <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
                    <span className="text-4xl mb-4">🌐</span>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-6">Initialize Browser</h1>
                    <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-cyan-900/50 shadow-inner w-full max-w-sm">
                        <span className="text-lg pl-2">🔑</span>
                        <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Vault Key..." className="flex-grow bg-transparent text-sm font-mono text-cyan-400 focus:outline-none placeholder:text-zinc-600 px-2" />
                        <button onClick={unlockVault} className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase active:scale-95 transition-all">UNLOCK</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full w-full animate-fadeIn p-4 overflow-y-auto">
                    
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                        <h2 className="text-xl font-black text-white tracking-tight">Stealth<span className="text-cyan-500">Dashboard</span></h2>
                        <button onClick={() => onNavigate('home')} className="bg-zinc-900 text-rose-400 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-zinc-800">Exit</button>
                    </div>

                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Active Tabs</h3>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {tabs.map(tab => (
                            <div key={tab.id} className={`bg-zinc-900 border rounded-xl flex flex-col overflow-hidden relative shadow-lg ${tab.id === activeTabId ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-zinc-800'}`}>
                                <div className="bg-black border-b border-zinc-800 px-3 py-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-zinc-300 truncate pr-2">{tab.title}</span>
                                    <button onClick={(e) => closeTab(tab.id, e)} className="text-zinc-600 hover:text-rose-400 font-bold p-1">✕</button>
                                </div>
                                <div onClick={() => { setActiveTabId(tab.id); handleNavigate(tab.url); }} className="h-20 bg-zinc-950 p-3 cursor-pointer flex items-center justify-center">
                                    <span className="text-4xl text-zinc-800 font-black">⧉</span>
                                </div>
                            </div>
                        ))}
                        <button onClick={createNewTab} className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400 text-3xl pb-2 transition-all">
                            +
                        </button>
                    </div>

                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Vaulted Sites</h3>
                    <div className="flex flex-col gap-2 mb-8">
                        {bookmarks.length === 0 ? (
                            <div className="text-center text-xs font-mono text-zinc-600 py-6 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">No secure bookmarks saved.</div>
                        ) : (
                            bookmarks.map((bm, idx) => (
                                <div key={idx} onClick={() => { handleNavigate(bm); }} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-cyan-400 truncate cursor-pointer hover:border-cyan-500 active:scale-95 transition-all shadow-md">{bm}</div>
                            ))
                        )}
                    </div>

                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Engine Config</h3>
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🌊 Streaming Mode</span>
                                <span className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">AES Chunking for large files</span>
                            </div>
                            <input type="checkbox" checked={lowRamMode} onChange={() => setLowRamMode(!lowRamMode)} className="w-5 h-5 accent-cyan-500" />
                        </div>
                        <div className="h-px bg-zinc-800 w-full" />
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🔥 Auto-Nuke Session</span>
                            <input type="checkbox" checked={autoNuke} onChange={() => setAutoNuke(!autoNuke)} className="w-5 h-5 accent-rose-600" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">🛡️ SOCKS5 Proxy</span>
                                <input type="checkbox" checked={proxyEnabled} onChange={() => setProxyEnabled(!proxyEnabled)} className="w-5 h-5 accent-emerald-500" />
                            </div>
                            {proxyEnabled && (
                                <div className="flex gap-2">
                                    <input type="text" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} className="w-2/3 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Host IP" />
                                    <input type="text" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} className="w-1/3 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300" placeholder="Port" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SovereignBrowser;

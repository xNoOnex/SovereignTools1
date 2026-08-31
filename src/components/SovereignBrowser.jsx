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
    const [showSettings, setShowSettings] = useState(false);
    const [sniperUrl, setSniperUrl] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);

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
    const showSettingsRef = useRef(showSettings);

    useEffect(() => { tabsRef.current = tabs; }, [tabs]);
    useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);
    useEffect(() => { showSettingsRef.current = showSettings; }, [showSettings]);

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
            setBookmarks(JSON.parse(new TextDecoder().decode(decryptedBuffer)));
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
        setShowSettings(false);
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
                alert("🌊 Low-RAM Streaming Mode Engaged: Intercepting, encrypting, and routing chunk-by-chunk to the disk...");
                let isFirstChunk = true;
                let finalFilename = '';
                
                const processAndAppendChunk = async (chunkBuffer, extType) => {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, chunkBuffer);
                    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
                    combined.set(iv, 0);
                    combined.set(new Uint8Array(encryptedBuffer), iv.length);

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
                        const segBuf = await segRes.arrayBuffer();
                        await processAndAppendChunk(segBuf, 'ts');
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

                alert(`✅ Massive Payload Vaulted Successfully!\nSaved as: ${finalFilename}`);
                setIsExtracting(false);
                if (isManual) setSniperUrl('');
                return; 
            }

            let mediaBuffer;
            let ext = 'bin';

            if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
                alert("🔴 YouTube Engine: Bypassing...");
                let videoId = targetLower.includes('youtu.be/') ? targetUrl.split('youtu.be/')[1].split('?')[0] : targetLower.includes('/shorts/') ? targetUrl.split('/shorts/')[1].split('?')[0] : new URL(targetUrl).searchParams.get('v');
                if (!videoId) throw new Error("Could not parse Video ID.");
                
                const yt = await Innertube.create();
                const ytInfo = await yt.getInfo(videoId);
                sanitizedTitle = (ytInfo.basic_info.title || `yt_${videoId}`).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
                
                const stream = await yt.download(videoId, { type: 'video+audio', quality: 'best', format: 'mp4' });
                const chunks = [];
                const reader = stream.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }
                mediaBuffer = await new Blob(chunks).arrayBuffer();
                ext = 'mp4';
            } else {
                if (targetLower.startsWith('blob:')) throw new Error("Blob URLs require direct network interception or screen recording.");
                if (targetLower.includes('.m3u8')) throw new Error("HLS detected. Toggle Low-RAM mode in settings to download massive fragmented playlists.");

                alert("🌐 Universal Scraper: Pulling payload into RAM...");
                const res = await fetch(targetUrl, { mode: 'cors' });
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

                mediaBuffer = await res.arrayBuffer();
                const contentType = res.headers.get('content-type') || '';

                if (contentType.includes('image/jpeg') || targetLower.includes('.jpg') || targetLower.includes('.jpeg')) ext = 'jpg';
                else if (contentType.includes('image/png') || targetLower.includes('.png')) ext = 'png';
                else if (contentType.includes('image/webp') || targetLower.includes('.webp')) ext = 'webp';
                else if (contentType.includes('image/gif') || targetLower.includes('.gif')) ext = 'gif';
                else if (contentType.includes('video/mp4') || targetLower.includes('.mp4')) ext = 'mp4';
                else if (contentType.includes('video/webm') || targetLower.includes('.webm')) ext = 'webm';
                else if (contentType.includes('audio/mpeg') || targetLower.includes('.mp3')) ext = 'mp3';
                else if (contentType.includes('audio/wav') || targetLower.includes('.wav')) ext = 'wav';
                else if (contentType.includes('application/pdf') || targetLower.includes('.pdf')) ext = 'pdf';
                else ext = 'dat'; 
            }

            alert("🔐 Encrypting payload with AES-256-GCM...");
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, mediaBuffer);

            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);

            const fileReader = new FileReader();
            fileReader.onloadend = async () => {
                const b64 = fileReader.result.split(',')[1];
                const fname = `${sanitizedTitle}_${Date.now()}.${ext}`;
                try { await Filesystem.mkdir({ path: 'sovereign_media', directory: Directory.Data, recursive: true }); } catch(e) {}
                await Filesystem.writeFile({ path: `sovereign_media/${fname}`, data: b64, directory: Directory.Data });
                alert(`✅ Payload Neutralized & Vaulted!\nSaved as: ${fname}`);
            };
            fileReader.readAsDataURL(new Blob([combined]));

        } catch (e) {
            alert("❌ Extraction Failed: " + e.message);
        } finally {
            setIsExtracting(false);
            if (isManual) setSniperUrl('');
        }
    };

    useEffect(() => {
        const backSub = App.addListener('backButton', () => showSettingsRef.current ? setShowSettings(false) : goBack());
        const listener = StealthBrowser.addListener('onMediaDetected', (info) => ripPayload(info.url, false));
        return () => {
            if (listener && listener.remove) listener.remove();
            if (backSub && backSub.remove) backSub.remove();
        };
    }, [vaultKey, autoNuke, proxyEnabled, proxyHost, proxyPort, lowRamMode]);

    return (
        <div className="flex flex-col h-full bg-black text-zinc-300 animate-fadeIn relative">
            
            {/* 1. BROWSER TABS (Desktop Style at the Top) */}
            <div className="flex bg-black pt-2 px-2 gap-1 overflow-x-auto no-scrollbar border-b border-zinc-800">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-mono cursor-pointer transition-all max-w-[160px] min-w-[120px] ${
                            tab.id === activeTabId
                                ? 'bg-zinc-900 text-cyan-400 border-t border-l border-r border-zinc-700/50 shadow-[0_-5px_15px_rgba(6,182,212,0.1)]'
                                : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-900/50'
                        }`}
                    >
                        <span className="truncate flex-1">{tab.title}</span>
                        <span onClick={(e) => closeTab(tab.id, e)} className="text-zinc-600 hover:text-rose-400 font-bold ml-2">×</span>
                    </div>
                ))}
                <button onClick={createNewTab} className="px-3 py-2 text-zinc-400 hover:text-cyan-400 font-bold text-lg leading-none mb-1">+</button>
                <div className="flex-1"></div>
                <button onClick={() => onNavigate('home')} className="text-zinc-600 hover:text-rose-400 font-bold text-xs uppercase tracking-widest px-3">Exit</button>
            </div>

            {/* 2. MAIN ADDRESS BAR ROW */}
            <div className="bg-zinc-900 border-b border-zinc-800 shrink-0 p-3 z-40 relative">
                {!isUnlocked ? (
                    <div className="flex items-center gap-2 bg-black p-2 rounded-lg border border-cyan-900/50 shadow-inner">
                        <span className="text-lg pl-1">🔑</span>
                        <input type="password" value={vaultKey} onChange={(e) => setVaultKey(e.target.value)} placeholder="Set Session Vault Key..." className="flex-grow bg-transparent text-sm font-mono text-cyan-400 focus:outline-none placeholder:text-zinc-600" />
                        <button onClick={unlockVault} className="bg-cyan-900/30 text-cyan-400 border border-cyan-900/50 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase active:scale-95">UNLOCK</button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={goBack} disabled={!activeTab || activeTab.history.length === 0} className={`px-3 rounded-xl border transition-all flex items-center justify-center font-bold ${activeTab && activeTab.history.length > 0 ? 'bg-zinc-800 border-zinc-600 text-cyan-400 active:scale-95' : 'bg-black border-zinc-900 text-zinc-700 opacity-50 cursor-not-allowed'}`}>←</button>
                        <button onClick={() => setShowSettings(!showSettings)} className={`px-3 rounded-xl border transition-all flex items-center justify-center ${showSettings ? 'bg-cyan-900 border-cyan-500 text-cyan-400' : 'bg-black border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>⚙️</button>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleNavigate()} placeholder="Enter web address or search..." className="flex-grow bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-cyan-500 shadow-inner" />
                        <button onClick={() => handleNavigate()} className="px-5 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs tracking-widest rounded-xl active:scale-95 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]">GO</button>
                        <button onClick={toggleBookmark} className={`px-3 rounded-xl border transition-all flex items-center justify-center text-lg ${bookmarks.includes(address) ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-black border-zinc-700 text-zinc-600 hover:text-amber-500'}`}>★</button>
                    </div>
                )}
            </div>

            {/* 3. SETTINGS DROPDOWN (Sniper removed, kept strictly to network configs) */}
            {showSettings && isUnlocked && (
                <div className="absolute top-[135px] left-3 right-3 bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl z-50 flex flex-col gap-4 animate-fadeIn">
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

            {/* 4. MAIN DASHBOARD AREA */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-black p-4">
                
                {/* SHOW START PAGE IF ON NEW TAB */}
                {isUnlocked && (address === 'https://' || address === '') ? (
                    <div className="flex flex-col gap-8 max-w-md mx-auto mt-6 w-full animate-fadeIn">
                        
                        <div className="text-center">
                            <h1 className="text-3xl font-black text-white tracking-tight">Stealth<span className="text-cyan-500">Browser</span></h1>
                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">Encrypted Webkit Engine</p>
                        </div>

                        {/* 🎯 THE DEDICATED SNIPER UI */}
                        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-cyan-600"></div>
                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                🎯 Direct Payload Sniper
                            </h3>
                            <p className="text-[10px] text-zinc-400 font-mono leading-tight mb-4">Paste any media URL (.mp4, .m3u8, .jpg, etc) to bypass browser rendering and extract directly to Vault.</p>
                            
                            <div className="flex flex-col gap-3">
                                <input 
                                    type="text" 
                                    value={sniperUrl} 
                                    onChange={(e) => setSniperUrl(e.target.value)} 
                                    placeholder="Paste target URL here..." 
                                    className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-emerald-300 focus:border-emerald-500 focus:outline-none shadow-inner" 
                                />
                                <button 
                                    onClick={() => ripPayload(sniperUrl, true)}
                                    disabled={!sniperUrl || isExtracting}
                                    className={`py-3 font-black text-xs tracking-widest rounded-xl uppercase transition-all ${!sniperUrl || isExtracting ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95'}`}
                                >
                                    {isExtracting ? 'Extracting Payload...' : 'Execute Rip Sequence'}
                                </button>
                            </div>
                        </div>

                    </div>
                ) : (
                    /* SHOW BOOKMARKS IF NOT ON START PAGE */
                    <div className="flex flex-col gap-3 mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 px-1">Vaulted Locations</h3>
                        {!isUnlocked ? (
                            <div className="text-center text-xs font-mono text-zinc-600 py-10">Vault is locked.</div>
                        ) : bookmarks.length === 0 ? (
                            <div className="text-center text-xs font-mono text-zinc-600 py-10">No secure bookmarks saved.</div>
                        ) : (
                            bookmarks.map((bm, idx) => (
                                <div key={idx} onClick={() => { setAddress(bm); handleNavigate(bm); }} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-cyan-400 truncate cursor-pointer hover:border-cyan-500 active:scale-95 transition-all shadow-md">{bm}</div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SovereignBrowser;

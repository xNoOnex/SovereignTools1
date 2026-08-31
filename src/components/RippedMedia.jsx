import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function RippedMedia({ onNavigate }) {
    const [vaultKey, setVaultKey] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [activeMedia, setActiveMedia] = useState(null);

    // Scan the hidden sandbox directory for rips
    const loadMedia = async () => {
        try {
            const res = await Filesystem.readdir({
                path: 'sovereign_media',
                directory: Directory.Data
            });
            setMediaFiles(res.files);
        } catch (e) {
            console.log("No media directory found or empty.");
        }
    };

    useEffect(() => { loadMedia(); }, []);

    const unlockMedia = async (file) => {
        if (!vaultKey) return alert("Enter your vault key first.");
        
        try {
            const fileData = await Filesystem.readFile({
                path: `sovereign_media/${file.name}`,
                directory: Directory.Data
            });
            
            // Rebuild the AES components
            const combined = new Uint8Array(atob(fileData.data).split('').map(c => c.charCodeAt(0)));
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            // Derive the key
            const enc = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(vaultKey), { name: "PBKDF2" }, false, ["deriveKey"]);
            const key = await crypto.subtle.deriveKey(
                { name: "PBKDF2", salt: enc.encode("sovereign_salt_99"), iterations: 100000, hash: "SHA-256" },
                keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            );

            // Decrypt and mount the Blob
            const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
            
            // Determine MIME type based on extension
            const mimeType = file.name.includes('.mp4') ? 'video/mp4' : 'audio/mp3';
            const blob = new Blob([decryptedBuffer], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            setActiveMedia({ name: file.name, url, type: mimeType });
        } catch (e) {
            alert("Decryption failed. Incorrect Vault Key or corrupted media.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white p-4 pb-20">
            <div className="flex justify-between items-center border-b border-indigo-900/50 pb-4 mb-4">
                <h2 className="text-xl font-black text-indigo-500 tracking-widest uppercase">Ripped Media Vault</h2>
                <button onClick={() => onNavigate('home')} className="bg-zinc-900 px-4 py-2 rounded-full text-xs font-bold border border-zinc-700">EXIT</button>
            </div>

            <input 
                type="password" 
                value={vaultKey} 
                onChange={(e) => setVaultKey(e.target.value)} 
                placeholder="Enter Session Vault Key..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 mb-6"
            />

            {activeMedia && (
                <div className="mb-6 p-2 border border-indigo-900/50 rounded-2xl bg-zinc-950">
                    {activeMedia.type.includes('video') ? (
                        <video src={activeMedia.url} controls autoPlay className="w-full rounded-xl" />
                    ) : (
                        <audio src={activeMedia.url} controls autoPlay className="w-full" />
                    )}
                    <button onClick={() => setActiveMedia(null)} className="w-full mt-2 py-2 bg-indigo-900/30 text-indigo-400 font-bold text-xs rounded-lg">Close Media</button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
                {mediaFiles.length === 0 ? <p className="text-center text-zinc-600 text-xs mt-10 font-mono">No intercepted media found.</p> : null}
                {mediaFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <span className="text-xs font-mono text-zinc-400 truncate pr-4">{file.name}</span>
                        <button onClick={() => unlockMedia(file)} className="bg-indigo-900/50 text-indigo-300 font-bold px-4 py-2 rounded-lg text-[10px] tracking-wider active:scale-95 transition-all shrink-0">
                            DECRYPT
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

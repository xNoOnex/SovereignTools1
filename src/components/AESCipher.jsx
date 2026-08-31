import React, { useState, useEffect } from "react";
import * as openpgp from "openpgp";

export function AESCipher({ onNavigate, navigateTo }) {
    const navHandler = onNavigate || navigateTo;
    const [keyTab, setKeyTab] = useState("OpenPGP"); // "AES-256 GCM" or "OpenPGP"
    const [pgpMode, setPgpMode] = useState("Encrypt"); // "Encrypt", "Decrypt", "Keys"
    const [aesMode, setAesMode] = useState("Encrypt");
    
    // Persistent Local Keyring
    const [pubKey, setPubKey] = useState(() => localStorage.getItem("sovereign_pgp_pub") || "");
    const [privKey, setPrivKey] = useState(() => localStorage.getItem("sovereign_pgp_priv") || "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusTag, setStatusTag] = useState("");

    // PGP Encrypt / Decrypt Fields
    const [recipientKey, setRecipientKey] = useState("");
    const [pgpText, setPgpText] = useState("");
    const [decryptPrivKey, setDecryptPrivKey] = useState(privKey);
    const [passphrase, setPassphrase] = useState("");
    const [pgpOutput, setPgpOutput] = useState("");
    const [pgpError, setPgpError] = useState("");

    // AES Fields
    const [aesText, setAesText] = useState("");
    const [aesKey, setAesKey] = useState("");
    const [aesOutput, setAesOutput] = useState("");

    useEffect(() => {
        setDecryptPrivKey(privKey);
    }, [privKey]);

    const showStatus = (msg) => {
        setStatusTag(msg);
        setTimeout(() => setStatusTag(""), 3000);
    };

    const handleSaveKeyring = (newPub, newPriv) => {
        localStorage.setItem("sovereign_pgp_pub", newPub);
        localStorage.setItem("sovereign_pgp_priv", newPriv);
        setPubKey(newPub);
        setPrivKey(newPriv);
        showStatus("KEYPAIR SAVED TO PERSISTENT STORAGE");
    };

    const handleClearKeyring = () => {
        localStorage.removeItem("sovereign_pgp_pub");
        localStorage.removeItem("sovereign_pgp_priv");
        setPubKey("");
        setPrivKey("");
        setDecryptPrivKey("");
        showStatus("LOCAL KEYRING CLEARED");
    };

    const generatePgpKeypair = async () => {
        setIsGenerating(true);
        setPgpError("");
        try {
            const { privateKey, publicKey } = await openpgp.generateKey({
                type: 'ecc',
                curve: 'curve25519',
                userIDs: [{ name: 'Sovereign Node', email: 'node@sovereign.local' }],
                format: 'armored'
            });
            handleSaveKeyring(publicKey, privateKey);
        } catch (e) {
            setPgpError("Key generation failed: " + e.message);
        }
        setIsGenerating(false);
    };

    const handlePgpEncrypt = async () => {
        setPgpError("");
        setPgpOutput("");
        if (!recipientKey || !pgpText) {
            setPgpError("Recipient public key and message plaintext are required.");
            return;
        }
        try {
            const publicKey = await openpgp.readKey({ armoredKey: recipientKey });
            const encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: pgpText }),
                encryptionKeys: publicKey
            });
            setPgpOutput(encrypted);
            showStatus("PAYLOAD ENCRYPTED");
        } catch (e) {
            setPgpError("PGP Encryption Error: " + e.message);
        }
    };

    const handlePgpDecrypt = async () => {
        setPgpError("");
        setPgpOutput("");
        if (!pgpText || !decryptPrivKey) {
            setPgpError("Encrypted PGP message block and private key are required.");
            return;
        }
        try {
            let privateKeyObj = await openpgp.readPrivateKey({ armoredKey: decryptPrivKey });
            if (passphrase) {
                privateKeyObj = await openpgp.decryptKey({
                    privateKey: privateKeyObj,
                    passphrase
                });
            }
            const messageObj = await openpgp.readMessage({ armoredMessage: pgpText });
            const { data: decrypted } = await openpgp.decrypt({
                message: messageObj,
                decryptionKeys: privateKeyObj
            });
            setPgpOutput(decrypted);
            showStatus("MESSAGE DECRYPTED");
        } catch (e) {
            setPgpError("PGP Decryption Error: " + e.message + " (Check private key or passphrase)");
        }
    };

    const handleAesProcess = async () => {
        if (!aeskey || !aesText) return;
        try {
            const enc = new TextEncoder();
            // Securely hash the password into a 256-bit key
            const keyHash = await window.crypto.subtle.digest('SHA-256', enc.encode(aeskey));
            const cryptoKey = await window.crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

            if (aesMode === 'Encrypt') {
                // Generate a secure, random Initialization Vector
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, enc.encode(aesText));
                
                // Package the IV and Ciphertext together securely
                const combined = new Uint8Array(iv.length + encrypted.byteLength);
                combined.set(iv, 0);
                combined.set(new Uint8Array(encrypted), iv.length);
                const base64 = btoa(String.fromCharCode(...combined));
                
                setAesOutput('AES-GCM-LOCKED[' + base64 + ']');
                showStatus('AES PAYLOAD LOCKED');
            } else {
                const raw = aesText.replace('AES-GCM-LOCKED[', '').replace(']', '');
                const combined = new Uint8Array(atob(raw).split('').map(c => c.charCodeAt(0)));
                
                // Extract the IV and the encrypted data
                const iv = combined.slice(0, 12);
                const data = combined.slice(12);
                
                const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, data);
                setAesOutput(new TextDecoder().decode(decrypted));
                showStatus('AES PAYLOAD UNLOCKED');
            }
        } catch (e) {
            setAesOutput('Decryption failed. Invalid secret passphrase or corrupted payload.');
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        showStatus(label + " COPIED");
    };

    return (
        <div className="min-h-screen bg-black text-white p-5 pb-24 font-sans select-none overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                        <span className="text-red-500">🛡️</span> Cryptographic Engine
                    </h1>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">AES-256 GCM & OpenPGP Asymmetric Security</p>
                </div>
                <button onClick={() => navHandler("home")} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all">Exit</button>
            </div>

            {/* Algorithm Selector */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 mb-6">
                {["OpenPGP", "AES-256 GCM"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setKeyTab(tab); setPgpError(""); }}
                        className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${keyTab === tab ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "text-zinc-500 hover:text-white"}`}
                    >
                        {tab === "OpenPGP" ? "🔑 OpenPGP" : "🛡️ AES-256 GCM"}
                    </button>
                ))}
            </div>

            {/* Status Alert Badge */}
            {statusTag && (
                <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold p-3 rounded-xl mb-4 text-center animate-fadeIn">
                    ✓ {statusTag}
                </div>
            )}
            {pgpError && (
                <div className="bg-red-950 border border-red-500 text-red-300 text-xs font-mono p-3 rounded-xl mb-4 break-all">
                    ⚠️ {pgpError}
                </div>
            )}

            {/* OPEN PGP ENGINE */}
            {keyTab === "OpenPGP" && (
                <div className="space-y-6">
                    {/* Mode Sub-Tabs */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
                        {["Encrypt", "Decrypt", "Keys"].map((m) => (
                            <button
                                key={m}
                                onClick={() => { setPgpMode(m); setPgpError(""); setPgpOutput(""); }}
                                className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${pgpMode === m ? "bg-zinc-800 text-cyan-400 border border-cyan-500/50" : "text-zinc-500 hover:text-white"}`}
                            >
                                {m === "Keys" ? "🔑 My Keys" : m === "Encrypt" ? "🔒 Encrypt" : "🔓 Decrypt"}
                            </button>
                        ))}
                    </div>

                    {/* TAB: MY KEYS */}
                    {pgpMode === "Keys" && (
                        <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Local PGP Keyring</h3>
                                <button
                                    onClick={generatePgpKeypair}
                                    disabled={isGenerating}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider disabled:opacity-50 active:scale-95 transition-all"
                                >
                                    {isGenerating ? "Generating..." : "⚡ Generate Pair"}
                                </button>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">Public Key Block (Shareable)</label>
                                    {pubKey && <button onClick={() => copyToClipboard(pubKey, "PUBLIC KEY")} className="text-[10px] text-cyan-400 font-bold uppercase hover:underline">Copy Public</button>}
                                </div>
                                <textarea
                                    value={pubKey}
                                    onChange={(e) => setPubKey(e.target.value)}
                                    placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----..."
                                    className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-mono uppercase text-red-400">Private Key Block (Keep Secret)</label>
                                    {privKey && <button onClick={() => copyToClipboard(privKey, "PRIVATE KEY")} className="text-[10px] text-red-400 font-bold uppercase hover:underline">Copy Private</button>}
                                </div>
                                <textarea
                                    value={privKey}
                                    onChange={(e) => setPrivKey(e.target.value)}
                                    placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----..."
                                    className="w-full h-32 bg-black border border-red-900/50 rounded-xl p-3 font-mono text-xs text-red-300 focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => handleSaveKeyring(pubKey, privKey)}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                                >
                                    Save Keys to Storage
                                </button>
                                <button
                                    onClick={handleClearKeyring}
                                    className="bg-zinc-900 hover:bg-red-900/60 text-zinc-400 hover:text-white border border-zinc-800 font-bold text-xs px-5 py-3 rounded-xl uppercase active:scale-95 transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: ENCRYPT */}
                    {pgpMode === "Encrypt" && (
                        <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                            <div>
                                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Recipient's Public Key Block</label>
                                <textarea
                                    value={recipientKey}
                                    onChange={(e) => setRecipientKey(e.target.value)}
                                    placeholder="Paste recipient's -----BEGIN PGP PUBLIC KEY BLOCK-----"
                                    className="w-full h-28 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Plaintext Message</label>
                                <textarea
                                    value={pgpText}
                                    onChange={(e) => setPgpText(e.target.value)}
                                    placeholder="Type sensitive message..."
                                    className="w-full h-28 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <button
                                onClick={handlePgpEncrypt}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs py-3.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                            >
                                🔒 Generate PGP Payload
                            </button>
                        </div>
                    )}

                    {/* TAB: DECRYPT */}
                    {pgpMode === "Decrypt" && (
                        <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                            <div>
                                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Incoming Encrypted Message Block</label>
                                <textarea
                                    value={pgpText}
                                    onChange={(e) => setPgpText(e.target.value)}
                                    placeholder="Paste incoming -----BEGIN PGP MESSAGE----- block..."
                                    className="w-full h-28 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-400">Private Key Block</label>
                                    {privKey && <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500 px-2 py-0.5 rounded font-mono">KEYRING LOADED</span>}
                                </div>
                                <textarea
                                    value={decryptPrivKey}
                                    onChange={(e) => setDecryptPrivKey(e.target.value)}
                                    placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----"
                                    className="w-full h-28 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Key Passphrase (Optional)</label>
                                <input
                                    type="password"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Enter private key passphrase if locked..."
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <button
                                onClick={handlePgpDecrypt}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs py-3.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                            >
                                🔓 Decrypt Message
                            </button>
                        </div>
                    )}

                    {/* PGP OUTPUT DISPLAY */}
                    {pgpOutput && (
                        <div className="bg-zinc-950 border-2 border-emerald-500/80 rounded-2xl p-5 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">PGP Output Payload</span>
                                <button
                                    onClick={() => copyToClipboard(pgpOutput, "PAYLOAD")}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] px-3 py-1 rounded-lg uppercase"
                                >
                                    Copy Output
                                </button>
                            </div>
                            <textarea
                                readOnly
                                value={pgpOutput}
                                className="w-full h-36 bg-black/80 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200 select-all"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* AES-256 GCM ENGINE */}
            {keyTab === "AES-256 GCM" && (
                <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {["Encrypt", "Decrypt"].map((m) => (
                            <button
                                key={m}
                                onClick={() => { setAesMode(m); setAesOutput(""); }}
                                className={`py-2 rounded-xl font-bold text-xs uppercase ${aesMode === m ? "bg-zinc-800 text-cyan-400 border border-cyan-500/50" : "text-zinc-500"}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Secret Passphrase</label>
                        <input
                            type="password"
                            value={aesKey}
                            onChange={(e) => setAesKey(e.target.value)}
                            placeholder="Enter shared symmetric secret..."
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">{aesMode === "Encrypt" ? "Plaintext Message" : "Locked Ciphertext"}</label>
                        <textarea
                            value={aesText}
                            onChange={(e) => setAesText(e.target.value)}
                            placeholder={aesMode === "Encrypt" ? "Enter plaintext message..." : "Paste AES-GCM-LOCKED[...] payload"}
                            className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <button
                        onClick={handleAesProcess}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs py-3.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all"
                    >
                        {aesMode === "Encrypt" ? "🔒 Lock Payload" : "🔓 Unlock Payload"}
                    </button>

                    {aesOutput && (
                        <div className="mt-4 bg-black border border-zinc-800 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-mono text-zinc-400 uppercase">AES Result</span>
                                <button onClick={() => copyToClipboard(aesOutput, "AES RESULT")} className="text-[10px] text-cyan-400 font-bold uppercase hover:underline">Copy</button>
                            </div>
                            <div className="font-mono text-xs text-zinc-200 break-all select-all">{aesOutput}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

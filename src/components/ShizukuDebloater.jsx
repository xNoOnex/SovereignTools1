import React, { useState } from 'react';
import { ToolFooter } from './ToolFooter';

// Extended Android & OEM Package Directory
const EXTENDED_PACKAGES = [
  // --- SAMSUNG BLOATWARE ---
  { name: 'Bixby Voice & Agent', pkg: 'com.samsung.android.bixby.agent', risk: 'SAFE', cat: 'Samsung', desc: 'Samsung voice assistant background listener. Safe to remove if using local AI or alternative assistants.' },
  { name: 'Bixby Vision AI', pkg: 'com.samsung.android.visionintelligence', risk: 'SAFE', cat: 'Samsung', desc: 'Camera object recognition overlay. Safe to remove.' },
  { name: 'AR Zone & Emoji', pkg: 'com.samsung.android.arzone', risk: 'SAFE', cat: 'Samsung', desc: 'Augmented reality stickers and avatar creation tools. Safe to remove.' },
  { name: 'Galaxy Store Ad Engine', pkg: 'com.sec.android.app.samsungapps', risk: 'SAFE', cat: 'Samsung', desc: 'Samsung native app store and push notification ad engine. Safe if you use Google Play or F-Droid.' },
  { name: 'Game Launcher & Tools', pkg: 'com.samsung.android.game.gamehome', risk: 'SAFE', cat: 'Samsung', desc: 'Game overlay telemetry and promotional game notifications.' },
  { name: 'Samsung Pass & Pay', pkg: 'com.samsung.android.samsungpass', risk: 'SAFE', cat: 'Samsung', desc: 'Samsung proprietary biometric credential manager.' },
  { name: 'Knox Analytics Daemon', pkg: 'com.samsung.android.knox.analytics.uploader', risk: 'SAFE', cat: 'Samsung', desc: 'Background device usage data uploader for Knox telemetry.' },

  // --- META / FACEBOOK ---
  { name: 'Meta System Installer', pkg: 'com.facebook.system', risk: 'SAFE', cat: 'Meta', desc: 'Background service allowing Meta apps to update without Play Store prompts.' },
  { name: 'Meta App Manager', pkg: 'com.facebook.appmanager', risk: 'SAFE', cat: 'Meta', desc: 'Background telemetry and app analytics daemon for Facebook services.' },
  { name: 'Meta Services Daemon', pkg: 'com.facebook.services', risk: 'SAFE', cat: 'Meta', desc: 'Meta background sync and push notification helper.' },

  // --- GOOGLE TELEMETRY & STUBS ---
  { name: 'Digital Wellbeing', pkg: 'com.google.android.apps.wellbeing', risk: 'SAFE', cat: 'Google', desc: 'Tracks screen time, app unlocks, and usage habits continuous background logging.' },
  { name: 'Google Feedback Collector', pkg: 'com.google.android.feedback', risk: 'SAFE', cat: 'Google', desc: 'Collects crash reports and system diagnostic logs to send to Google.' },
  { name: 'Google Partner Setup', pkg: 'com.google.android.partnerbackupsubmit', risk: 'SAFE', cat: 'Google', desc: 'Carrier and OEM initial phone configuration helper.' },
  { name: 'Google Chrome', pkg: 'com.android.chrome', risk: 'CAUTION', cat: 'Google', desc: 'Default web browser. SAFE to remove ONLY if you have Brave or Firefox already installed.' },
  { name: 'Android Speech Services', pkg: 'com.google.android.tts', risk: 'CAUTION', cat: 'Google', desc: 'Text-to-speech engine used by accessibility apps and screen readers.' },

  // --- MICROSOFT & CARRIER ---
  { name: 'Link to Windows', pkg: 'com.microsoft.appmanager', risk: 'SAFE', cat: 'Microsoft', desc: 'Pre-installed phone companion link for Windows PC sync.' },
  { name: 'Carrier Hub Diagnostics', pkg: 'com.carrierhub.service', risk: 'SAFE', cat: 'Carrier', desc: 'Carrier network telemetry and diagnostic reporting service.' },

  // --- CORE SYSTEM (HIGH RISK - DO NOT REMOVE) ---
  { name: 'Android System UI', pkg: 'com.android.systemui', risk: 'HIGH_RISK', cat: 'System', desc: 'Renders status bar, navigation bar, and lock screen. CRITICAL: Removing causes bootloops.' },
  { name: 'Package Installer', pkg: 'com.google.android.packageinstaller', risk: 'HIGH_RISK', cat: 'System', desc: 'Android OS component that installs .apk files. CRITICAL: DO NOT REMOVE.' },
  { name: 'Android Settings Host', pkg: 'com.android.settings', risk: 'HIGH_RISK', cat: 'System', desc: 'Main system settings menu. CRITICAL: DO NOT REMOVE.' }
];

export function ShizukuDebloater() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState(null);

  const categories = ['ALL', 'Samsung', 'Google', 'Meta', 'Microsoft', 'Carrier', 'System'];
  const risks = ['ALL', 'SAFE', 'CAUTION', 'HIGH_RISK'];

  const filtered = EXTENDED_PACKAGES.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.pkg.toLowerCase().includes(search.toLowerCase()) ||
                          p.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'ALL' || p.cat === selectedCat;
    const matchesRisk = selectedRisk === 'ALL' || p.risk === selectedRisk;
    return matchesSearch && matchesCat && matchesRisk;
  });

  const copyCommand = (command, key) => {
    navigator.clipboard.writeText(command);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 select-none">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚡ System Package & Debloat Inspector
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Inspect Android package risk levels, review background descriptions, and copy clean terminal strings.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search package name, ID, or keyword (e.g. bixby, telemetry)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 shadow-inner"
        />
      </div>

      {/* Filter Row 1: Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
              selectedCat === cat 
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' 
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter Row 2: Risk Levels */}
      <div className="flex gap-2 text-[10px] font-bold">
        {risks.map(risk => (
          <button
            key={risk}
            onClick={() => setSelectedRisk(risk)}
            className={`px-2.5 py-1 rounded-md border transition-all ${
              selectedRisk === risk
                ? 'bg-zinc-100 text-black border-white'
                : risk === 'SAFE' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                : risk === 'CAUTION' ? 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                : risk === 'HIGH_RISK' ? 'bg-red-950/40 text-red-400 border-red-900/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            {risk === 'ALL' ? 'ALL RISKS' : risk === 'SAFE' ? '🟢 SAFE' : risk === 'CAUTION' ? '🟡 CAUTION' : '🔴 HIGH RISK'}
          </button>
        ))}
      </div>

      {/* Package List Container */}
      <div className="space-y-3 pt-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-zinc-500 text-xs">
            No matching packages found in database.
          </div>
        ) : (
          filtered.map(item => {
            const disableCmd = `adb shell pm disable-user --user 0 ${item.pkg}`;
            const uninstallCmd = `adb shell pm uninstall -k --user 0 ${item.pkg}`;

            return (
              <div 
                key={item.pkg}
                className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 space-y-3 shadow-lg backdrop-blur-sm"
              >
                {/* Title & Risk Badge */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-wide">{item.name}</h3>
                    <p className="text-[11px] font-mono text-cyan-400/90 mt-0.5">{item.pkg}</p>
                  </div>
                  <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                    item.risk === 'SAFE'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                      : item.risk === 'CAUTION'
                      ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                      : 'bg-red-950 text-red-400 border-red-800/60'
                  }`}>
                    {item.risk === 'SAFE' ? '🟢 SAFE' : item.risk === 'CAUTION' ? '🟡 CAUTION' : '🔴 HIGH RISK'}
                  </span>
                </div>

                {/* Description Box */}
                <p className="text-xs text-zinc-300 bg-black/60 p-2.5 rounded-xl border border-zinc-800/60 leading-relaxed">
                  {item.desc}
                </p>

                {/* ADB Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Safely Disable Button */}
                  <button
                    onClick={() => copyCommand(disableCmd, `dis-${item.pkg}`)}
                    className="py-2 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-mono text-[10px] font-bold border border-zinc-700/60 truncate"
                  >
                    {copiedKey === `dis-${item.pkg}` ? '✓ Copied Disable' : '🚫 Copy Disable Command'}
                  </button>

                  {/* Uninstall Button */}
                  <button
                    onClick={() => copyCommand(uninstallCmd, `un-${item.pkg}`)}
                    className="py-2 px-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-300 rounded-xl font-mono text-[10px] font-bold border border-zinc-700/60 truncate"
                  >
                    {copiedKey === `un-${item.pkg}` ? '✓ Copied Uninstall' : '🗑️ Copy Uninstall Command'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tool Footer */}
      <ToolFooter
        title="Package & Debloat Inspector"
        details="Provides risk assessments, package IDs, and descriptions for Android system bloatware. Formats reversible disable commands and full removal commands for execution in Termux, Shizuku, or ADB."
        disclaimer="Always prefer disabling packages over uninstalling them first. Never disable or uninstall packages flagged as HIGH RISK."
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Home } from './components/Home';
import { PrivacyBrowser } from './components/PrivacyBrowser';
import { SecureGallery } from './components/SecureGallery';
import { SovereignAudio } from './components/SovereignAudio';
import { FileShredder } from './components/FileShredder';
import { NetSec } from './components/NetSec';

export default function App() {
  const [activeTab, setActiveTab] = useState('browser');

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'browser', label: 'Browser', icon: '🌐' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'audio', label: 'Audio', icon: '🎧' },
    { id: 'shred', label: 'Shred', icon: '☣️' },
    { id: 'netsec', label: 'NetSec', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-sans">
      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <Home />}
        {activeTab === 'browser' && <PrivacyBrowser />}
        {activeTab === 'gallery' && <SecureGallery />}
        {activeTab === 'audio' && <SovereignAudio />}
        {activeTab === 'shred' && <FileShredder />}
        {activeTab === 'netsec' && <NetSec />}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 z-50 px-2 py-1.5">
        <div className="flex items-center justify-around max-w-2xl mx-auto overflow-x-auto no-scrollbar gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all min-w-[60px] ${
                  isActive
                    ? 'bg-zinc-800/80 text-cyan-400 font-bold scale-105 border border-cyan-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-base mb-0.5">{item.icon}</span>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

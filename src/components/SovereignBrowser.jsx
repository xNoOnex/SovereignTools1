import React, { useState } from 'react';
import { registerPlugin } from '@capacitor/core';
const StealthBrowser = registerPlugin('StealthBrowser');

export function SovereignBrowser({ onNavigate }) {
  const [tabs, setTabs] = useState([{ id: Date.now(), url: 'https://html5test.com', title: 'Start' }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [address, setAddress] = useState(tabs[0].url);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const addNewTab = () => {
    const newTab = { id: Date.now(), url: 'https://html5test.com', title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setAddress(newTab.url);
  };

  const closeTab = (e, id) => {
    e.stopPropagation();
    const remaining = tabs.filter(t => t.id !== id);
    if (remaining.length === 0) {
      onNavigate('home');
    } else {
      setTabs(remaining);
      if (activeTabId === id) {
        setActiveTabId(remaining[remaining.length - 1].id);
        setAddress(remaining[remaining.length - 1].url);
      }
    }
  };

  const switchTab = (id) => {
    setActiveTabId(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) setAddress(tab.url);
  };

  const handleNavigate = (e) => {
    if (e.key === 'Enter') {
      let finalUrl = address;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: finalUrl, title: finalUrl } : t));
      setAddress(finalUrl);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 animate-fadeIn">
      
      {/* Browser Header & Tab Bar */}
      <div className="bg-zinc-950 border-b border-zinc-800 shrink-0 flex flex-col">
        <div className="flex items-center justify-between p-2">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-grow pr-2">
             {tabs.map(tab => (
               <div 
                 key={tab.id}
                 onClick={() => switchTab(tab.id)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x cursor-pointer max-w-[150px] ${
                   activeTabId === tab.id 
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-zinc-400'
                 }`}
               >
                 <span className="text-xs truncate">{tab.title}</span>
                 <button onClick={(e) => closeTab(e, tab.id)} className="text-[10px] hover:text-rose-500">✕</button>
               </div>
             ))}
             <button onClick={addNewTab} className="text-zinc-500 hover:text-zinc-200 px-2 text-xl">+</button>
           </div>
           <button onClick={() => onNavigate('home')} className="text-xs font-bold text-zinc-500 hover:text-rose-400">EXIT</button>
        </div>

        {/* URL Address Bar */}
        <div className="p-2 bg-zinc-900 flex gap-2">
           <input 
             type="text" 
             value={address}
             onChange={(e) => setAddress(e.target.value)}
             onKeyDown={handleNavigate}
             placeholder="Search or enter web address..."
             className="w-full bg-black border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
           />
        </div>
      </div>

      {/* Web Viewport (MVP iframe) */}
      <div className="flex-grow bg-white relative">
         {tabs.map(tab => (
           <iframe
             key={tab.id}
             src={tab.url}
             className={`w-full h-full border-none absolute inset-0 ${activeTabId === tab.id ? 'block' : 'hidden'}`}
             sandbox="allow-scripts allow-same-origin allow-forms"
           />
         ))}
      </div>
    </div>
  );
}

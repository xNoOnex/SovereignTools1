import React, { useEffect } from 'react';
import { ToolFooter } from './ToolFooter';

export function PrivacyBrowser() {
  useEffect(() => {
    if (window.AndroidNative && window.AndroidNative.launchNativeBrowser) {
      window.AndroidNative.launchNativeBrowser("https://duckduckgo.com");
    }
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto text-center pb-28 select-none">
      <div className="bg-zinc-900/90 p-6 rounded-3xl border border-cyan-500/40 space-y-3">
        <span className="text-4xl">🌐</span>
        <h2 className="text-lg font-bold text-white">Native Edge-to-Edge Browser Active</h2>
        <p className="text-xs text-zinc-300">
          The zero-telemetry browser is running in native full-screen overlay mode.
        </p>
        <button
          onClick={() => {
            if (window.AndroidNative && window.AndroidNative.launchNativeBrowser) {
              window.AndroidNative.launchNativeBrowser("https://duckduckgo.com");
            }
          }}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg"
        >
          🌐 Open Fullscreen Browser
        </button>
      </div>

      <ToolFooter
        title="Native Standalone Browser Engine"
        details="Operates in a 100% isolated Android WebView overlay with zero cookie persistence or ad tracking."
        disclaimer="Bypasses iframe security blocks completely."
      />
    </div>
  );
}

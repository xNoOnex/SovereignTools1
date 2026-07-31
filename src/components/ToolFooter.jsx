import React from 'react';

export function ToolFooter({ title, details, disclaimer }) {
  return (
    <div className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-400 space-y-2 text-left w-full">
      <div>
        <span className="font-bold text-zinc-200">ℹ️ About {title}: </span>
        <span>{details}</span>
      </div>
      <div className="bg-amber-950/30 border border-amber-800/40 p-2 rounded text-amber-300/80">
        <span className="font-bold">⚠️ Disclaimer: </span>
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}

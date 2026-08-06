import React, { useState, useEffect } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

export function UniversalExplorer({ onNavigate }) {
  const [currentPath, setCurrentPath] = useState('/storage/emulated/0');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const exec = async (cmd) => {
    try {
      if (ShizukuRunner.executeCommand) return await ShizukuRunner.executeCommand({ command: cmd });
      if (ShizukuRunner.execute) return await ShizukuRunner.execute({ command: cmd });
      return { output: '', error: 'Plugin execution unavailable.' };
    } catch (e) {
      return { output: '', error: e.message || String(e) };
    }
  };

  const loadDirectory = async (targetPath) => {
    setLoading(true);
    setStatusMsg('');
    const cleanPath = targetPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    setCurrentPath(cleanPath);

    // Use Shizuku shell to list files with full permissions (bypasses Scoped Storage)
    const res = await exec(`ls -1p "${cleanPath}"`);
    
    if (res.error && !res.output) {
      setStatusMsg('Access Denied: ' + res.error);
      setItems([]);
      setLoading(false);
      return;
    }

    const lines = (res.output || '').split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(name => {
      const isDir = name.endsWith('/');
      const cleanName = isDir ? name.slice(0, -1) : name;
      const ext = cleanName.includes('.') ? cleanName.split('.').pop().toLowerCase() : '';
      return { name: cleanName, isDir, ext, fullPath: `${cleanPath}/${cleanName}` };
    });

    // Sort: Directories first, then files alphabetically
    parsed.sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name));
    setItems(parsed);
    setLoading(false);
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const getIcon = (item) => {
    if (item.isDir) return '📁';
    if (['pdf'].includes(item.ext)) return '📄';
    if (['doc', 'docx'].includes(item.ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(item.ext)) return '📊';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(item.ext)) return '🖼️';
    if (['mp3', 'aac', 'flac', 'wav', 'ogg'].includes(item.ext)) return '🎵';
    if (['mp4', 'mkv', 'webm', 'avi'].includes(item.ext)) return '🎬';
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(item.ext)) return '📦';
    if (['apk'].includes(item.ext)) return '🤖';
    if (['txt', 'log', 'json', 'js', 'jsx', 'py', 'sh', 'md', 'html', 'css'].includes(item.ext)) return '📄';
    return '📑';
  };

  const getMimeType = (ext) => {
    const mimeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain',
      json: 'application/json',
      apk: 'application/vnd.android.package-archive',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4'
    };
    return mimeMap[ext] || '*/*';
  };

  const handleItemClick = async (item) => {
    if (item.isDir) {
      loadDirectory(item.fullPath);
      return;
    }

    const textExts = ['txt', 'log', 'json', 'js', 'jsx', 'py', 'sh', 'md', 'html', 'css', 'conf', 'ini'];
    const imgExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

    // 1. Text/Code Preview
    if (textExts.includes(item.ext)) {
      setLoading(true);
      const res = await exec(`head -n 200 "${item.fullPath}"`);
      setPreviewContent(res.output || '[Empty or Unreadable File]');
      setPreviewFile(item);
      setLoading(false);
      return;
    }

    // 2. Image Preview
    if (imgExts.includes(item.ext)) {
      const safeUrl = Capacitor.convertFileSrc(item.fullPath);
      setPreviewContent(safeUrl);
      setPreviewFile(item);
      return;
    }

    // 3. Document/PDF/Excel/APK Native Android Launch
    setStatusMsg(`Opening ${item.name} in system viewer...`);
    const mime = getMimeType(item.ext);
    
    // Launch via Android system intent through Shizuku shell
    const launchCmd = `am start -a android.intent.action.VIEW -d "file://${item.fullPath}" -t "${mime}" --grant-read-uri-permission`;
    const res = await exec(launchCmd);

    if (res.error && res.error.includes('Error')) {
      setStatusMsg(`Launch error: ${res.error}`);
    } else {
      setStatusMsg(`Sent open command for ${item.name}`);
    }
  };

  const navigateUp = () => {
    if (currentPath === '/' || currentPath === '') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parent = '/' + parts.join('/');
    loadDirectory(parent);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4 pb-36">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📁</span>
          <div>
            <h2 className="text-lg font-black tracking-widest text-cyan-400 uppercase">Universal Explorer</h2>
            <span className="text-[10px] text-zinc-400 font-mono">Full Storage Access</span>
          </div>
        </div>
        <button onClick={() => typeof onNavigate === 'function' ? onNavigate('home') : null} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 active:scale-95 text-zinc-400 font-black">✕</button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl mb-3 shrink-0 shadow-lg">
          <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Details</h3>
          <p className="text-[11px] text-zinc-300 mb-4 leading-relaxed">Navigates the raw Android filesystem using Shizuku shell privileges, bypassing standard Android Scoped Storage restrictions.</p>
          <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Disclaimer</h3>
          <p className="text-[11px] text-rose-400/80 leading-relaxed font-mono">You are viewing files at the system shell level. Executing or modifying unknown configuration files in root directories can cause system instability.</p>
      </div>

      {/* Path Bar */}
      <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 mb-3 shrink-0">
        <button onClick={navigateUp} className="bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-black active:scale-95 shrink-0">
          ⬆ UP
        </button>
        <input 
          type="text" 
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
          className="w-full bg-black border border-zinc-800 rounded-lg p-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {statusMsg && (
        <div className="bg-cyan-950/40 border border-cyan-800/50 text-cyan-400 p-2 rounded-lg text-[11px] font-mono mb-3 shrink-0">
          {statusMsg}
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {loading ? (
          <div className="text-center text-cyan-500 font-mono text-xs mt-10 animate-pulse tracking-widest">READING DIRECTORY...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-zinc-600 font-mono text-xs mt-10">DIRECTORY IS EMPTY</div>
        ) : (
          items.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => handleItemClick(item)}
              className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 p-3 rounded-xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <span className="text-xl shrink-0">{getIcon(item)}</span>
                <span className={`text-xs font-mono truncate ${item.isDir ? 'text-cyan-300 font-bold' : 'text-zinc-300'}`}>
                  {item.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">
                {item.isDir ? 'DIR' : item.ext.toUpperCase() || 'FILE'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-[10000] p-4 flex flex-col backdrop-blur-md">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
            <div className="truncate flex-1 mr-4">
              <span className="text-xs font-bold text-cyan-400 font-mono block truncate">{previewFile.name}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{previewFile.fullPath}</span>
            </div>
            <button onClick={() => setPreviewFile(null)} className="bg-rose-950/60 text-rose-400 border border-rose-900/50 px-3 py-1 rounded-lg text-xs font-black">
              CLOSE
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(previewFile.ext) ? (
              <img src={previewContent} alt="Preview" className="max-w-full h-auto mx-auto rounded-lg object-contain" />
            ) : (
              <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap break-all leading-relaxed">{previewContent}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UniversalExplorer;

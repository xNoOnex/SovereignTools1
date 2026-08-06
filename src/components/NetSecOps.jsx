import React, { useState } from 'react';
import { registerPlugin } from '@capacitor/core';

const ShizukuRunner = registerPlugin('ShizukuRunner');

const sysTools = [
  {
    id: 'subnet', name: 'Subnet Mapping', icon: '🌐',
    details: "Performs a rapid, asynchronous ping sweep across a target subnet to identify active devices, completely bypassing Android's interface permission blocks.",
    disclaimer: "Because this uses ICMP ping requests, devices with strict network firewalls configured to ignore pings may not appear in this scan. Requires manual input of your network prefix.",
    needsInput: true, inputPlaceholder: 'Target Subnet Prefix (e.g., 192.168.1)',
    getCmd: (input) => {
        const p = input.replace(/\.$/, '').trim();
        return 'echo "> Initiating Ping Sweep on ' + p + '.0/24...\n"; for i in $(seq 1 254); do ping -c 1 -W 1 ' + p + '.$i >/dev/null 2>&1 && echo "[ACTIVE HOST] ' + p + '.$i" & done; wait; echo "\n> Sweep Complete."';
    }
  },
  {
    id: 'wifi', name: 'Wi-Fi Telemetry', icon: '📶',
    details: "Extracts a detailed data dump from your device's wireless interfaces. It reveals metrics like BSSID, signal attenuation, link speed, and hidden network configurations.",
    disclaimer: "BSSID and telemetry data can be used to accurately geolocate your device even if standard GPS services are disabled.",
    needsInput: false, inputPlaceholder: '',
    getCmd: () => 'dumpsys wifi | grep -E "mNetworkInfo|BSSID|LinkSpeed|SSID"'
  },
  {
    id: 'leak', name: 'Leak Shield Audit', icon: '🛡️',
    details: "Tests how your device routes ICMP (ping) packets. This is typically used to ensure that a VPN connection is correctly tunneling traffic and that DNS/IP requests aren't leaking over the standard ISP connection.",
    disclaimer: "Active pinging leaves traces in the destination server's network logs, revealing your IP address if the tunnel is indeed leaking.",
    needsInput: false, inputPlaceholder: '',
    getCmd: () => 'ping -c 4 1.1.1.1'
  },
  {
    id: 'sockets', name: 'Listening Sockets', icon: '🔌',
    details: "Audits open ports on your device (similar to netstat or ss), showing you which background services or apps are actively waiting for incoming network connections.",
    disclaimer: "Misinterpreting this data can cause unnecessary alarm; many local services listen on standard ports solely for internal device communication, not external internet exposure.",
    needsInput: false, inputPlaceholder: '',
    getCmd: () => 'ss -tunlp || echo "\\n> [STDERR]: Netlink socket blocked. Standard ports shown above. Full Root (UID 0) required for PID mapping."'
  },
  {
    id: 'appops', name: 'AppOps List', icon: '📦',
    details: 'Scans and manages "App Operations." AppOps is Android\'s hidden, granular permission management system that controls what apps can do (e.g., run in background, access clipboard) beyond standard user-facing permissions.',
    disclaimer: "Revoking critical AppOps from certain applications can cause them to crash silently or break core functionalities without giving you an explicit error message.",
    needsInput: true, inputPlaceholder: 'Target Package (Leave blank for all)',
    getCmd: (input) => input ? `appops get ${input}` : 'appops read'
  },
  {
    id: 'assassin', name: 'Process Assassin', icon: '🔪',
    details: "Force-stops running packages, effectively mimicking the system's am force-stop shell command. It forcefully terminates an app's background processes and services.",
    disclaimer: "Using this on critical system services can lead to device instability, freezing, or a reboot loop. Unsaved data in targeted apps will be lost.",
    needsInput: true, inputPlaceholder: 'Target Package (e.g., com.android.chrome)',
    getCmd: (input) => `am force-stop --user 0 ${input} && echo "> Sequence sent."`
  },
  {
    id: 'logcat', name: 'Logcat Inspector', icon: '📋',
    details: "Reads the native Android system log (logcat). This is primarily used by developers to debug crashes, track system events, and monitor app behavior in real-time.",
    disclaimer: "System logs frequently capture highly sensitive personal information, including location data, authentication tokens, and private messages, depending on how verbose third-party apps are.",
    needsInput: false, inputPlaceholder: '',
    getCmd: () => 'logcat -d -t 50'
  },
  {
    id: 'downgrader', name: 'APK Downgrader', icon: '⬇️',
    details: "Bypasses Android's native version-blocking protocol (using the pm install -d flag), allowing you to install an older version of an application directly over a newer version without uninstalling it first.",
    disclaimer: "Downgrading an app often corrupts its local SQLite databases because the older app version cannot read the newer database schema, resulting in immediate crashes upon launch. It also re-exposes you to patched security vulnerabilities.",
    needsInput: true, inputPlaceholder: 'Absolute APK Path (/storage/emulated/0/...)',
    getCmd: (input) => `pm install -d --user 0 "${input}"`
  },
  {
    id: 'terminal', name: 'Raw Local Terminal', icon: '⌨️',
    details: "Provides a command-line interface that executes shell commands at the Shizuku (ADB) privilege level.",
    disclaimer: "This is highly powerful and unforgiving. Executing arbitrary or blindly copied commands can soft-brick your device, wipe data partitions, or compromise your network configuration.",
    needsInput: true, inputPlaceholder: 'Shell Command',
    getCmd: (input) => input
  }
];

export function NetSecOps({ onNavigate }) {
  const [activeTool, setActiveTool] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const exec = async (cmd) => {
    try {
      if (ShizukuRunner.executeCommand) return await ShizukuRunner.executeCommand({ command: cmd });
      if (ShizukuRunner.execute) return await ShizukuRunner.execute({ command: cmd });
      return { output: '', error: 'Plugin missing.' };
    } catch (e) {
      return { output: '', error: String(e) };
    }
  };

  const handleExecute = async () => {
    if (activeTool.needsInput && !inputVal && activeTool.id !== 'appops') {
        setLogs('> Error: Target input required.');
        return;
    }
    
    setIsRunning(true);
    const cmd = activeTool.getCmd(inputVal);
    setLogs(`> Executing [${activeTool.name}]...\n> Command: ${cmd}\n\n`);
    
    const res = await exec(cmd);
    
    let resultLog = '';
    if (res.output) resultLog += `[STDOUT]:\n${res.output.trim()}\n`;
    if (res.error) resultLog += `[STDERR]:\n${res.error.trim()}\n`;
    if (!res.output && !res.error) resultLog += '> Command completed with no output.';
    
    setLogs(prev => prev + resultLog);
    setIsRunning(false);
  };

  const closeTool = () => {
      setActiveTool(null);
      setInputVal('');
      setLogs('');
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4 pb-32">
      <div className="flex justify-between items-center mb-4 shrink-0 mt-2">
         <div className="flex items-center gap-3">
             <span className="text-3xl">{activeTool ? activeTool.icon : '⚡'}</span>
             <div>
                 <h2 className="text-lg font-black tracking-widest text-orange-500 uppercase">{activeTool ? activeTool.name : 'NetSec & SysOps'}</h2>
                 <span className="text-[10px] text-orange-500 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/50 uppercase">Shizuku Shell Bridge</span>
             </div>
         </div>
         <button onClick={() => activeTool ? closeTool() : (typeof onNavigate === 'function' ? onNavigate('home') : null)} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700 active:scale-95 text-zinc-400 font-black">
             {activeTool ? '←' : '✕'}
         </button>
      </div>

      {!activeTool ? (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-10">
              {sysTools.map(tool => (
                  <button key={tool.id} onClick={() => setActiveTool(tool)} className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 active:scale-[0.98] transition-transform">
                      <span className="text-3xl mb-1">{tool.icon}</span>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">{tool.name}</span>
                  </button>
              ))}
          </div>
      ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl mb-3 shrink-0 shadow-lg overflow-y-auto max-h-48">
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Details</h3>
                  <p className="text-[11px] text-zinc-300 mb-4 leading-relaxed">{activeTool.details}</p>
                  
                  <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Disclaimer</h3>
                  <p className="text-[11px] text-rose-400/80 leading-relaxed font-mono">{activeTool.disclaimer}</p>
              </div>

              {activeTool.needsInput && (
                  <input 
                      type="text" 
                      placeholder={activeTool.inputPlaceholder} 
                      className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-xs font-mono text-cyan-400 focus:outline-none focus:border-orange-500 mb-3 shrink-0"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                  />
              )}

              <button 
                  onClick={handleExecute}
                  disabled={isRunning}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest border mb-3 shrink-0 transition-all ${isRunning ? 'bg-zinc-900 text-zinc-500 border-zinc-800' : 'bg-orange-600/20 text-orange-500 border-orange-500/50 hover:bg-orange-600/40 active:scale-[0.98]'}`}
              >
                  {isRunning ? 'Executing Sequence...' : 'Execute Sequence'}
              </button>

              <div className="flex-1 bg-black border border-zinc-800 rounded-xl p-4 overflow-y-auto font-mono text-[10px] text-zinc-400 whitespace-pre-wrap shadow-inner">
                  {logs || '> Standby...'}
              </div>
          </div>
      )}
    </div>
  );
}

export default NetSecOps;

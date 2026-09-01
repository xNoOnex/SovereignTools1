import React, { useState, useRef, useEffect } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';
import CryptoJS from 'crypto-js';

const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; 
const UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; 

export function TacticalRadio({ onNavigate }) {
  const [radioStatus, setRadioStatus] = useState('OFFLINE'); 
  const [deviceId, setDeviceId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionPin, setSessionPin] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initRadioLink = async () => {
    setRadioStatus('SCANNING');
    try {
      await BleClient.initialize();
      const device = await BleClient.requestDevice({
        services: [UART_SERVICE],
        optionalServices: [UART_SERVICE]
      });
      setDeviceId(device.deviceId);
      await BleClient.connect(device.deviceId);
      await BleClient.startNotifications(
        device.deviceId, UART_SERVICE, UART_TX, 
        (value) => handleIncomingRadio(value)
      );
      setIsSimulated(false);
      setRadioStatus('LINKED');
      setMessages(prev => [...prev, { sender: 'system', text: '📡 Hardware Antenna Linked. Radio waves are live.' }]);
    } catch (error) {
      // DEV MODE FALLBACK
      setTimeout(() => {
        setIsSimulated(true);
        setRadioStatus('LINKED');
        setMessages(prev => [...prev, { sender: 'system', text: '⚠️ SIMULATION MODE: Hardware bypassed. Virtual antenna linked.' }]);
      }, 1500);
    }
  };

  const disconnectRadio = async () => {
    if (deviceId && !isSimulated) {
      try { await BleClient.disconnect(deviceId); } catch (e) {}
    }
    setRadioStatus('OFFLINE');
    setDeviceId(null);
    setIsSimulated(false);
    setMessages(prev => [...prev, { sender: 'system', text: '🔌 Antenna Disconnected.' }]);
  };

  const handleIncomingRadio = (dataView) => {
    try {
      const decoder = new TextDecoder('utf-8');
      const rawText = decoder.decode(dataView);

      if (sessionPin.trim()) {
        const bytes = CryptoJS.AES.decrypt(rawText, sessionPin);
        const decryptedMsg = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedMsg) {
          setMessages(prev => [...prev, { sender: 'radio', text: decryptedMsg }]);
          return;
        }
      }
      setMessages(prev => [...prev, { sender: 'radio', text: rawText }]);
    } catch (e) {
      console.log("Radio parsing error", e);
    }
  };

  const broadcastPayload = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || radioStatus !== 'LINKED') return;

    let finalPayload = inputText.trim();
    if (sessionPin.trim()) {
      finalPayload = CryptoJS.AES.encrypt(finalPayload, sessionPin).toString();
    }

    if (isSimulated) {
      setMessages(prev => [...prev, { sender: 'self', text: inputText.trim() }]);
      setInputText('');
      
      // Simulate radio echo
      setTimeout(() => {
        let echoText = finalPayload;
        if (sessionPin.trim()) {
          const bytes = CryptoJS.AES.decrypt(finalPayload, sessionPin);
          echoText = bytes.toString(CryptoJS.enc.Utf8);
        }
        setMessages(prev => [...prev, { sender: 'radio', text: `[ECHO] ${echoText}` }]);
      }, 2000);
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(finalPayload);
      await BleClient.write(deviceId, UART_SERVICE, UART_RX, new DataView(data.buffer));
      setMessages(prev => [...prev, { sender: 'self', text: inputText.trim() }]);
      setInputText('');
    } catch (error) {
      alert("Transmission failed. Antenna may have dropped connection.");
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen animate-fadeIn">
      <div className="border-b border-zinc-900 pb-3 pt-2 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Long-Range Radio</h2>
          <p className="text-xs text-zinc-400 mt-1">External Hardware Bridge</p>
        </div>
        <button onClick={() => onNavigate('home')} className="bg-zinc-900 border border-zinc-700 text-xs font-bold px-4 py-2 rounded-full hover:border-white transition-all">
          Exit
        </button>
      </div>

      <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-2xl flex flex-col gap-2 shadow-lg">
        <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="text-sm">📖</span> OPSEC 101: Hardware Radios
        </h3>
        <p className="text-[10px] leading-relaxed text-zinc-300">
          When cell towers go down, you can connect this app to an external pocket radio. The app sends your typed message to the board via Bluetooth. The board then blasts it out over raw radio frequencies, bouncing over miles of terrain to reach other nodes. <b>No internet or cell service required.</b>
        </p>
      </div>

      {radioStatus === 'OFFLINE' && (
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-6 shadow-xl text-center">
          <div className="w-20 h-20 bg-black border-4 border-zinc-800 rounded-full mx-auto flex items-center justify-center text-3xl">📻</div>
          <div className="space-y-2">
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Link Antenna</h3>
            <p className="text-[10px] text-zinc-400 px-4">Power on your external radio board. Tap below to pair it with your terminal.</p>
          </div>
          <button onClick={initRadioLink} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow uppercase tracking-widest active:scale-95 transition-all">
            Scan for Hardware
          </button>
        </div>
      )}

      {radioStatus === 'SCANNING' && (
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest animate-pulse">Searching Frequencies...</p>
        </div>
      )}

      {radioStatus === 'LINKED' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Optional: Airwave Encryption</h4>
            <p className="text-[9px] text-zinc-400">Radio waves can be heard by anyone listening on the same frequency. Enter a PIN below to scramble your text before it hits the air.</p>
            <input 
              type="password" 
              placeholder="Leave blank for public broadcast..." 
              value={sessionPin} 
              onChange={(e) => setSessionPin(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs font-mono text-amber-500 focus:outline-none focus:border-amber-500 tracking-widest"
            />
          </div>

          <div className="bg-zinc-900 p-3 rounded-3xl border border-emerald-900/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] space-y-3 flex flex-col h-[50vh]">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 px-2">
              <span className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hardware Linked
              </span>
              <button onClick={disconnectRadio} className="text-[9px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-md uppercase font-bold active:scale-95">Disconnect</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'self' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-2.5 rounded-xl text-xs font-mono leading-relaxed ${
                    msg.sender === 'self' ? 'bg-emerald-600 text-white font-bold rounded-br-sm' : 
                    msg.sender === 'system' ? 'bg-black border border-zinc-800 text-[9px] text-zinc-500 rounded-lg py-1 px-3 text-center' : 
                    'bg-black border border-zinc-700 text-zinc-300 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={broadcastPayload} className="flex gap-2 pt-2">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type transmission..." className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500" />
              <button type="submit" disabled={!inputText.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 rounded-xl active:scale-95 transition-all disabled:opacity-50 tracking-widest uppercase shadow-lg">TX</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

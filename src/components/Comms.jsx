import React, { useState, useRef, useEffect } from 'react';

export function Comms() {
  const [localSDP, setLocalSDP] = useState('');
  const [remoteSDP, setRemoteSDP] = useState('');
  const [status, setStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection({ iceServers: [] }); // 100% Offline Local Mesh
    
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate === null) {
        setLocalSDP(JSON.stringify(peerConnection.current.localDescription));
      }
    };

    peerConnection.current.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => setMessages(prev => [...prev, { sender: 'peer', text: e.data }]);
      receiveChannel.onopen = () => setStatus('CONNECTED');
      receiveChannel.onclose = () => setStatus('DISCONNECTED');
    };

    return () => peerConnection.current.close();
  }, []);

  const createOffer = async () => {
    dataChannel.current = peerConnection.current.createDataChannel('sovereign_mesh');
    dataChannel.current.onmessage = (e) => setMessages(prev => [...prev, { sender: 'peer', text: e.data }]);
    dataChannel.current.onopen = () => setStatus('CONNECTED');
    dataChannel.current.onclose = () => setStatus('DISCONNECTED');

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    setStatus('GENERATING OFFER...');
  };

  const acceptRemoteSDP = async () => {
    if (!remoteSDP) return;
    const desc = JSON.parse(remoteSDP);
    await peerConnection.current.setRemoteDescription(desc);
    
    if (desc.type === 'offer') {
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      setStatus('GENERATING ANSWER...');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || status !== 'CONNECTED') return;
    dataChannel.current.send(inputMsg);
    setMessages(prev => [...prev, { sender: 'user', text: inputMsg }]);
    setInputMsg('');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28 select-none font-sans text-white bg-black min-h-screen flex flex-col">
      <div className="border-b border-zinc-900 pb-3 pt-2 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📡 Encrypted Comms</h2>
        <p className="text-xs text-zinc-400 mt-1">True serverless WebRTC manual SDP mesh.</p>
        <span className={`text-[10px] font-bold px-2 py-1 rounded mt-2 inline-block ${status === 'CONNECTED' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'}`}>
          STATUS: {status}
        </span>
      </div>

      {status !== 'CONNECTED' ? (
        <div className="flex-1 space-y-4 overflow-y-auto">
          <button onClick={createOffer} className="w-full py-3 theme-accent-bg text-black font-bold text-xs rounded-xl shadow active:scale-95">
            1. Generate Local Offer
          </button>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold theme-accent-text uppercase">Your Handshake (Copy & Share)</label>
            <textarea readOnly value={localSDP} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[9px] text-zinc-400 font-mono h-24 focus:outline-none" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold theme-accent-text uppercase">Remote Handshake (Paste Here)</label>
            <textarea value={remoteSDP} onChange={(e) => setRemoteSDP(e.target.value)} placeholder="Paste peer SDP block here..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[9px] text-zinc-400 font-mono h-24 focus:outline-none" />
          </div>

          <button onClick={acceptRemoteSDP} className="w-full py-3 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl active:scale-95">
            2. Accept Remote Handshake
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-3xl p-4 overflow-y-auto space-y-3 min-h-[300px]">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'theme-accent-bg text-black font-semibold' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 font-mono'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 shrink-0 pt-1">
            <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} placeholder="Type P2P payload..." className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none" />
            <button type="submit" className="theme-accent-bg text-black font-extrabold text-xs px-5 py-3 rounded-2xl shadow">SEND</button>
          </form>
        </>
      )}
    </div>
  );
}

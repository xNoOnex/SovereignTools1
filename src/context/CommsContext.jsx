
// --- INJECTED GOSSIP ENGINE ---
const syncSwarms = (channel) => {
    if (!channel) return;
    const ledgers = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('swarm_ledger_')) {
            ledgers[key] = localStorage.getItem(key);
        }
    }
    const count = Object.keys(ledgers).length;
    window.dispatchEvent(new CustomEvent('gossip_log', { detail: `TRANSMITTED ${count} ENCRYPTED BLOCKS.` }));
    if (count > 0) {
        channel.send(JSON.stringify({ type: 'SWARM_SYNC', data: ledgers }));
    }
};

const handleGossip = (payloadData) => {
    let updated = 0;
    Object.keys(payloadData).forEach(key => {
        const localData = localStorage.getItem(key);
        const incomingData = payloadData[key];
        if (!localData || incomingData.length > localData.length) {
            localStorage.setItem(key, incomingData);
            updated++;
        }
    });
    window.dispatchEvent(new CustomEvent('gossip_log', { detail: `RECEIVED ${Object.keys(payloadData).length} BLOCKS. ${updated} UPDATED.` }));
};
// -----------------------------

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const CommsContext = createContext();

export function CommsProvider({ children }) {
  const [localSDP, setLocalSDP] = useState('');
  const [remoteSDP, setRemoteSDP] = useState('');
  const [status, setStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState([]);
  
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  // Hardware Audio Synthesizer for offline notification beep
  const playPing = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitched A5 note
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Low volume
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15); // Quick 150ms beep
    } catch (e) {
      console.warn("Audio hardware ping failed.");
    }
  };

  const initWebRTC = () => {
    if (peerConnection.current) return; // Prevent duplicate connections

    peerConnection.current = new RTCPeerConnection({ iceServers: [] });
    
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate === null) {
        setLocalSDP(JSON.stringify(peerConnection.current.localDescription));
      }
    };

    peerConnection.current.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      dataChannel.current = receiveChannel;
      
      receiveChannel.onmessage = (e) => {
            if (typeof e.data === 'string' && e.data.includes('"type":"SWARM_SYNC"')) {
                try {
                    const parsed = JSON.parse(e.data);
                    handleGossip(parsed.data);
                } catch(err) {}
                return;
            }
            
        setMessages(prev => [...prev, { sender: 'peer', text: e.data }]);
        playPing(); // Trigger sound on receive
      
        };
      receiveChannel.onopen = () => setStatus('CONNECTED');
      receiveChannel.onclose = () => setStatus('DISCONNECTED');
    };
  };

  useEffect(() => {
    initWebRTC();
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, []);

  const createOffer = async () => {
    initWebRTC();
    const dc = peerConnection.current.createDataChannel('sovereign_mesh');
    dataChannel.current = dc;
    
    dc.onmessage = (e) => {
            if (typeof e.data === 'string' && e.data.includes('"type":"SWARM_SYNC"')) {
                try {
                    const parsed = JSON.parse(e.data);
                    handleGossip(parsed.data);
                } catch(err) {}
                return;
            }
            
      setMessages(prev => [...prev, { sender: 'peer', text: e.data }]);
      playPing(); // Trigger sound on receive
    
        };
    dc.onopen = () => setStatus('CONNECTED');
    dc.onclose = () => setStatus('DISCONNECTED');

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    setStatus('GENERATING OFFER...');
  };

  const acceptRemoteSDP = async (sdpString) => {
    if (!sdpString) return;
    setRemoteSDP(sdpString);
    try {
      const desc = JSON.parse(sdpString);
      await peerConnection.current.setRemoteDescription(desc);
      
      if (desc.type === 'offer') {
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        setStatus('GENERATING ANSWER...');
      }
    } catch (e) {
      alert("Invalid Handshake Payload.");
    }
  };

  const sendMessage = (msg) => {
    if (!msg.trim() || status !== 'CONNECTED' || !dataChannel.current) return;
    dataChannel.current.send(msg);
    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
  };

  const disconnect = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setLocalSDP('');
    setRemoteSDP('');
    setMessages([]);
    setStatus('DISCONNECTED');
    initWebRTC(); // Prep for new connection
  };

  return (
    <CommsContext.Provider value={{ 
      localSDP, remoteSDP, status, messages, 
      createOffer, acceptRemoteSDP, sendMessage, disconnect 
    }}>
      {children}
    </CommsContext.Provider>
  );
}

export const useComms = () => useContext(CommsContext);

// --- INJECTED GOSSIP ENGINE ---
const syncSwarms = (channel) => {
  if (!channel) return;
  const Ledgers = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('swarm_Ledger_')) {
      Ledgers[key] = localStorage.getItem(key);
    }
  }
  const count = Object.keys(Ledgers).length;
  window.dispatchEvent(new CustomEvent('gossip_log', { detail: `TRANSMITTED ${count} ENCRYPTED BLOCKS.` }));
  if (count > 0) {
    channel.send(JSON.stringify({ type: 'SWARM_SYNC', data: Ledgers }));
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
// --------------------------------

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { BleScout } from '../services/BleMeshEngine';

const CommsContext = createContext();

export function CommsProvider({ children }) {
  const [localSDP, setLocalSDP] = useState('');
  const [remoteSDP, setRemoteSDP] = useState('');
  const [status, setStatus] = useState('DISCONNECTED');
  
  const myNodeId = React.useMemo(() => {
    let id = localStorage.getItem('sovereign_node_id');
    if (!id) { id = Math.random().toString(36).substring(2, 10); localStorage.setItem('sovereign_node_id', id); }
    return id;
  }, []);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('swarm_Ledger_mesh');
    return saved ? JSON.parse(saved) : [];
  });

  // Keep WebRTC messages in sync
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('swarm_Ledger_mesh', JSON.stringify(messages));
    }
  }, [messages]);

  // Instantly refresh UI when BLE Scout updates the Ledger in the background
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('swarm_Ledger_mesh');
      if (saved) setMessages(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // --- AMBIENT MESH DAEMON ---
  useEffect(() => {
    const sessionState = sessionStorage.getItem('RAW_SESSION_STATE');
    const autoMeshEnabled = localStorage.getItem('sovereign_auto_mesh') !== 'false';

    if (sessionState === 'ARMED' && autoMeshEnabled) {
      // Ignite the radio automatically
      BleScout.deployScout((msg) => {
        window.dispatchEvent(new CustomEvent('gossip_log', { detail: msg }));
      });
    } else if (sessionState === 'DECOY') {
      // Enforce strict radio silence
      BleScout.killScout();
    }

    return () => {
      // Do not kill the scout on unmount to keep the background daemon alive
    };
  }, []);
  // ---------------------------

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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio hardware ping failed.");
    }
  };

  const initWebRTC = () => {
    if (peerConnection.current) return;
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
        playPing();
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
      playPing();
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
    if (!msg.trim()) return;
    const newMsg = { sender: 'me', text: msg, device: myNodeId, id: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    
    if (status === "CONNECTED" && dataChannel.current) {
      try { dataChannel.current.send(msg); } catch(e) {}
    }
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
    initWebRTC();
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

import React, { useState } from 'react';
import './App.css';
import { runOnDeviceAi } from './services/aiEngine';

function App() {
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState([
    { sender: 'ai', text: 'Sovereign Local AI Engine ready. Zero cloud telemetry.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleAiQuery = async () => {
    if (!aiInput.trim()) return;
    const query = aiInput;
    setAiInput('');
    setAiLogs(prev => [...prev, { sender: 'user', text: query }]);
    setAiLoading(true);
    setStatusMsg('Initializing on-device neural model...');

    try {
      const responseText = await runOnDeviceAi(
        query, 
        (progress) => setStatusMsg(progress)
      );
      setAiLogs(prev => [...prev, { sender: 'ai', text: responseText }]);
    } catch (err) {
      setAiLogs(prev => [...prev, { 
        sender: 'ai', 
        text: `❌ AI Execution Error: ${err.message}` 
      }]);
    }

    setAiLoading(false);
    setStatusMsg('');
  };

  return (
    <div className="app-root dark" style={{ padding: '20px', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h2>Local Neural Assistant</h2>
      <div style={{ minHeight: '250px', maxHeight: '400px', overflowY: 'auto', marginBottom: '15px' }}>
        {aiLogs.map((log, i) => (
          <div key={i} style={{ 
            padding: '10px', 
            margin: '8px 0', 
            borderRadius: '6px',
            background: log.sender === 'user' ? '#1b4d3e' : '#1e1e1e',
            color: log.sender === 'user' ? '#00ffcc' : '#e0e0e0',
            borderLeft: log.sender === 'ai' ? '3px solid #00ffcc' : 'none'
          }}>
            <strong>{log.sender === 'user' ? 'You' : 'Local AI'}:</strong> {log.text}
          </div>
        ))}
      </div>

      {statusMsg && (
        <p style={{ color: '#00ffcc', fontSize: '12px' }}>⚡ {statusMsg}</p>
      )}

      <input 
        style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', background: '#1e1e1e', color: '#fff', border: '1px solid #333' }}
        value={aiInput} 
        onChange={e => setAiInput(e.target.value)} 
        placeholder="Ask local model..." 
        onKeyDown={e => e.key === 'Enter' && handleAiQuery()}
      />
      
      <button 
        style={{ width: '100%', padding: '12px', background: '#00cc66', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px' }}
        onClick={handleAiQuery} 
        disabled={aiLoading}
      >
        {aiLoading ? 'Processing on GPU...' : 'Process Query Locally'}
      </button>
    </div>
  );
}

export default App;

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sovereign_ai_config';

export const getAIConfig = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      mode: 'local', // 'local' or 'remote'
      localEndpoint: 'http://127.0.0.1:8080/v1/chat/completions',
      remoteEndpoint: 'http://192.168.1.100:11434/api/generate',
      remoteModel: 'llama3.2:1b'
    };
  } catch (e) {
    return { mode: 'local', localEndpoint: 'http://127.0.0.1:8080/v1/chat/completions' };
  }
};

export const saveAIConfig = async (config) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const querySovereignAI = async (userPrompt) => {
  const config = await getAIConfig();
  const isLocal = config.mode === 'local';

  const url = isLocal ? config.localEndpoint : config.remoteEndpoint;
  
  const body = isLocal ? {
    messages: [
      { role: "system", content: "You are the Sovereign Tools assistant. Concise, technical, zero telemetry." },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3
  } : {
    model: config.remoteModel,
    prompt: userPrompt,
    stream: false
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (isLocal) {
      return data.choices?.[0]?.message?.content || "No response received.";
    } else {
      return data.response || "No response received.";
    }
  } catch (err) {
    return `[!] Unable to connect to local AI engine: ${err.message}`;
  }
};

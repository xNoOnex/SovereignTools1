import { CreateMLCEngine } from "@mlc-ai/web-llm";

const LOCAL_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
let engineInstance = null;

export const loadLocalAiEngine = async (onProgress) => {
  if (engineInstance) return engineInstance;
  engineInstance = await CreateMLCEngine(LOCAL_MODEL, {
    initProgressCallback: (progress) => {
      if (onProgress) {
        onProgress(progress.text || "Loading on-device model parameters...");
      }
    }
  });
  return engineInstance;
};

export const runOnDeviceAi = async (userPrompt, onProgress, fallbackEndpoint) => {
  try {
    const engine = await loadLocalAiEngine(onProgress);
    const response = await engine.chat.completions.create({
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.7,
      max_tokens: 512,
    });
    return response.choices[0].message.content;
  } catch (webGpuError) {
    console.warn("WebGPU engine error, falling back to local server...", webGpuError);
    try {
      const res = await fetch(fallbackEndpoint || "http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "tinyllama",
          prompt: userPrompt,
          stream: false
        })
      });
      const data = await res.json();
      return data.response || data.text || "Query completed via local server.";
    } catch (fallbackError) {
      throw new Error(`GPU engine initialization failed: ${webGpuError.message}`);
    }
  }
};

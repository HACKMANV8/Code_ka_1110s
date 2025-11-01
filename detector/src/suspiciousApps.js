export const SUSPICIOUS_PROCESS_SIGNATURES = [
  // AI/LLM Tools - HIGH PRIORITY
  {
    label: "ChatGPT Desktop",
    patterns: ["chatgpt", "openai", "gpt"],
  },
  {
    label: "Claude Desktop",
    patterns: ["claude", "anthropic"],
  },
  {
    label: "Ollama (Local LLM)",
    patterns: ["ollama", "llama"],
  },
  {
    label: "LM Studio",
    patterns: ["lmstudio", "lm-studio", "lmstudio.exe"],
  },
  {
    label: "GPT4All",
    patterns: ["gpt4all", "gpt-4-all"],
  },
  {
    label: "Oobabooga Text Generation",
    patterns: ["oobabooga", "text-generation-webui"],
  },
  {
    label: "KoboldAI",
    patterns: ["koboldai", "kobold"],
  },
  {
    label: "AI Browser Extensions",
    patterns: ["monica", "merlin", "chatgpt-writer", "textblaze", "compose.ai"],
  },
  
  // Calculator Apps
  {
    label: "Calculator",
    patterns: ["Calculator", "CalculatorApp", "CalculatorApp.exe", "calculator.exe", "calc"],
  },
  
  // Virtual Camera Software
  {
    label: "OBS Virtual Camera",
    patterns: ["obs64", "obs32", "obs", "obs-virtualcam"],
  },
  {
    label: "Snap Camera",
    patterns: ["snap camera", "snapcamera"],
  },
  {
    label: "ManyCam",
    patterns: ["manycam", "mcam"],
  },
  {
    label: "YouCam",
    patterns: ["youcam"],
  },
  {
    label: "CamTwist",
    patterns: ["camtwist"],
  },
  {
    label: "XSplit",
    patterns: ["xsplit", "xsplitvcam"],
  },
  {
    label: "vMix Video",
    patterns: ["vmix", "vmixvcam"],
  },
  {
    label: "AlterCam",
    patterns: ["altercam"],
  },
  {
    label: "Logitech Capture",
    patterns: ["logi capture", "logitechcapture", "logicapture"],
  },
  {
    label: "Virtual Webcam Generic",
    patterns: ["virtual camera", "virtualcam", "vcam", "fakecam"],
  },
  {
    label: "NDI Tools",
    patterns: ["ndi", "scanconverter"],
  },
];

export const DEFAULT_SCAN_CONFIG = {
  includeCommandLine: true,
  matchesRequired: 1,
  minimumConfidence: 0.5,
};

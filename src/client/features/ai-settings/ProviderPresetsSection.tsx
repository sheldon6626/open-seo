export type ProviderPreset = {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  icon: string;
  suggestedModels: string[];
};

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "minimax/minimax-m3",
    icon: "⚡",
    suggestedModels: [
      "minimax/minimax-m3",
      "deepseek/deepseek-chat",
      "deepseek/deepseek-reasoner",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.5-flash",
      "qwen/qwen-2.5-72b-instruct",
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek (深度求索)",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    icon: "🐋",
    suggestedModels: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    icon: "🤖",
    suggestedModels: ["gpt-4o-mini", "gpt-4o", "o3-mini", "o1"],
  },
  {
    id: "siliconflow",
    name: "硅基流动 (SiliconFlow)",
    baseUrl: "https://api.siliconflow.cn/v1",
    defaultModel: "deepseek-ai/DeepSeek-V3",
    icon: "🌊",
    suggestedModels: [
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen2.5-72B-Instruct",
    ],
  },
  {
    id: "ollama",
    name: "Ollama (本地/局域网)",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "qwen2.5",
    icon: "🦙",
    suggestedModels: ["qwen2.5", "llama3.2", "deepseek-r1"],
  },
  {
    id: "custom",
    name: "自定义 / OneAPI / 代理",
    baseUrl: "",
    defaultModel: "gpt-4o-mini",
    icon: "⚙️",
    suggestedModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "deepseek-chat",
    ],
  },
];

export function ProviderPresetsSection({
  selectedProvider,
  onSelectPreset,
}: {
  selectedProvider: string;
  onSelectPreset: (preset: ProviderPreset) => void;
}) {
  return (
    <section className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
        服务商快捷预设
      </label>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {PROVIDER_PRESETS.map((preset) => {
          const isSelected = selectedProvider === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary shadow-sm"
                  : "border-base-300 bg-base-200/50 text-base-content/75 hover:border-primary/50 hover:bg-base-200"
              }`}
            >
              <span className="text-xl">{preset.icon}</span>
              <span className="text-xs">{preset.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

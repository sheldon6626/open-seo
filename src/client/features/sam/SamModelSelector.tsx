import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  Cpu,
  Search,
  Settings,
} from "lucide-react";
import { getAvailableChatModels } from "@/serverFunctions/aiSettings";

const LOCAL_STORAGE_MODEL_KEY = "openseo-selected-ai-model";

export function getModelBadge(modelName: string): string {
  if (modelName.includes("deepseek")) return "🐋";
  if (modelName.includes("gpt") || modelName.includes("o1") || modelName.includes("o3")) return "🤖";
  if (modelName.includes("claude")) return "🧠";
  if (modelName.includes("minimax")) return "⚡";
  if (modelName.includes("gemini")) return "✨";
  if (modelName.includes("qwen")) return "🌐";
  if (modelName.includes("llama")) return "🦙";
  return "⚡";
}

export function useSelectedAiModel() {
  const modelsQuery = useQuery({
    queryKey: ["availableChatModels"],
    queryFn: () => getAvailableChatModels(),
    staleTime: 30 * 1000,
  });

  const defaultModel = modelsQuery.data?.defaultModel || "minimax/minimax-m3";
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
      if (saved) return saved;
    }
    return defaultModel;
  });

  useEffect(() => {
    if (modelsQuery.data?.defaultModel) {
      const saved = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
      if (!saved) {
        setSelectedModelState(modelsQuery.data.defaultModel);
      }
    }
  }, [modelsQuery.data?.defaultModel]);

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, model);
    }
  };

  return {
    selectedModel,
    setSelectedModel,
    availableModels: modelsQuery.data?.models || [defaultModel],
    defaultModel,
    isLoading: modelsQuery.isLoading,
  };
}

export function SamModelSelector({
  selectedModel,
  onSelectModel,
  compact = false,
}: {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modelsQuery = useQuery({
    queryKey: ["availableChatModels"],
    queryFn: () => getAvailableChatModels(),
    staleTime: 30 * 1000,
  });

  const models = modelsQuery.data?.models || [selectedModel];

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredModels = models.filter((m) =>
    m.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  const handleSelect = (model: string) => {
    onSelectModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, model);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 font-mono text-xs text-base-content/85 shadow-2xs transition-colors hover:border-primary/50 hover:bg-base-200/60 focus:outline-none focus:ring-1 focus:ring-primary ${
          compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5"
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="切换 AI 对话模型"
      >
        <span>{getModelBadge(selectedModel)}</span>
        <span className="max-w-[130px] truncate sm:max-w-[200px] font-medium">
          {selectedModel}
        </span>
        <ChevronDown className="size-3 text-base-content/50" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-1.5 z-50 w-72 origin-top-right rounded-xl border border-base-300 bg-base-100 p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-base-content/60 border-b border-base-300 pb-1.5 mb-1.5">
            <span>选择 AI 模型</span>
            <Link
              to="/ai-settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline font-normal"
            >
              <Settings className="size-3" />
              配置模型
            </Link>
          </div>

          {models.length > 5 ? (
            <div className="relative mb-2 px-1">
              <input
                type="text"
                placeholder="搜索模型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-xs input-bordered w-full pr-6 font-mono text-[11px]"
                autoFocus
              />
              <Search className="size-3 text-base-content/40 absolute right-3 top-2 pointer-events-none" />
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto space-y-0.5 px-1">
            {filteredModels.length === 0 ? (
              <p className="py-3 text-center text-xs text-base-content/40">
                未找到匹配的模型
              </p>
            ) : (
              filteredModels.map((model) => {
                const isSelected = model === selectedModel;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleSelect(model)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-mono text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-base-content/80 hover:bg-base-200 hover:text-base-content"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{getModelBadge(model)}</span>
                      <span className="truncate">{model}</span>
                    </div>
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-base-300 mt-2 pt-1.5 px-1">
            <Link
              to="/ai-settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-base-content/60 hover:bg-base-200 hover:text-primary transition-colors"
            >
              <Cpu className="size-3.5" />
              <span>添加更多自定义第三方模型...</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

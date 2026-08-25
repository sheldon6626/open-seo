import { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";

export function ModelManagementSection({
  defaultModel,
  setDefaultModel,
  customModels,
  setCustomModels,
  onResetDefaults,
}: {
  defaultModel: string;
  setDefaultModel: (model: string) => void;
  customModels: string[];
  setCustomModels: (models: string[]) => void;
  onResetDefaults: () => void;
}) {
  const [newModelInput, setNewModelInput] = useState("");

  const addCustomModel = () => {
    const trimmed = newModelInput.trim();
    if (!trimmed) return;
    if (!customModels.includes(trimmed)) {
      setCustomModels([...customModels, trimmed]);
      setNewModelInput("");
    }
  };

  const removeModel = (modelToRemove: string) => {
    const filtered = customModels.filter((m) => m !== modelToRemove);
    setCustomModels(filtered);
    if (defaultModel === modelToRemove && filtered.length > 0) {
      setDefaultModel(filtered[0]);
    }
  };

  return (
    <section className="space-y-5 rounded-xl border border-base-300 bg-base-200/40 p-5">
      <div className="flex items-center justify-between border-b border-base-300 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-base-content">
            模型配置与管理
          </h2>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs text-xs text-base-content/60 hover:text-base-content"
          onClick={onResetDefaults}
        >
          恢复推荐模型
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-base-content/70">
          默认使用模型 (Default Model)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={
              customModels.includes(defaultModel) ? defaultModel : "custom"
            }
            onChange={(e) => {
              if (e.target.value !== "custom") {
                setDefaultModel(e.target.value);
              }
            }}
            className="select select-sm select-bordered w-full sm:w-80 font-mono text-xs focus:select-primary"
          >
            {customModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {!customModels.includes(defaultModel) ? (
              <option value="custom">自定义: {defaultModel}</option>
            ) : null}
          </select>

          <input
            type="text"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder="或直接输入模型名称，例如 deepseek-chat"
            className="input input-sm input-bordered flex-1 font-mono text-xs focus:input-primary"
          />
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-base-content/70">
            对话可选模型列表 (共 {customModels.length} 个)
          </label>
          <span className="text-[11px] text-base-content/40">
            这些模型将在 AI 对话界面的下拉菜单中直接可选
          </span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto rounded-lg border border-base-300 bg-base-100 p-3">
          {customModels.length === 0 ? (
            <p className="text-xs text-base-content/40 py-2">
              暂无可用的模型列表。请点击上方「拉取可用模型」或在下方手动添加。
            </p>
          ) : (
            customModels.map((model) => {
              const isDefault = model === defaultModel;
              return (
                <span
                  key={model}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                    isDefault
                      ? "bg-primary text-primary-content font-medium shadow-xs"
                      : "bg-base-200 text-base-content/80 hover:bg-base-300"
                  }`}
                >
                  <span
                    className="cursor-pointer"
                    title={isDefault ? "当前默认模型" : "点击设为默认模型"}
                    onClick={() => setDefaultModel(model)}
                  >
                    {model}
                  </span>
                  {isDefault ? (
                    <span className="rounded bg-primary-content/20 px-1 py-0.2 text-[10px] text-primary-content uppercase">
                      默认
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeModel(model)}
                    className="btn btn-ghost btn-xs size-4 min-h-0 p-0 text-current/60 hover:text-current hover:bg-black/10"
                    aria-label={`Remove ${model}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newModelInput}
            onChange={(e) => setNewModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomModel();
              }
            }}
            placeholder="输入要添加的模型名称，如 claude-3-7-sonnet、deepseek-chat..."
            className="input input-sm input-bordered flex-1 font-mono text-xs focus:input-primary"
          />
          <button
            type="button"
            className="btn btn-outline btn-sm gap-1"
            disabled={!newModelInput.trim()}
            onClick={addCustomModel}
          >
            <Plus className="size-3.5" />
            添加模型
          </button>
        </div>
      </div>
    </section>
  );
}

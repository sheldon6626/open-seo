import { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";

export function ConnectionConfigSection({
  baseUrl,
  setBaseUrl,
  apiKey,
  setApiKey,
  onFetchModels,
  isFetchingModels,
  onTestConnection,
  isTestingConnection,
  fetchResult,
  testResult,
}: {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onFetchModels: () => void;
  isFetchingModels: boolean;
  onTestConnection: () => void;
  isTestingConnection: boolean;
  fetchResult: { success: boolean; message: string } | null;
  testResult: { success: boolean; message: string } | null;
}) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <section className="space-y-4 rounded-xl border border-base-300 bg-base-200/40 p-5">
      <div className="flex items-center gap-2 border-b border-base-300 pb-3">
        <Globe className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-base-content">
          接口连接配置
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-base-content/70">
            第三方接口地址 (Base URL)
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1 或 https://openrouter.ai/api/v1"
            className="input input-sm input-bordered w-full font-mono text-xs focus:input-primary"
          />
          <p className="text-[11px] text-base-content/50">
            兼容 OpenAI 规范的 API 端点。如留空将默认使用环境变量。
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-base-content/70">
            API Key / 接口密钥
          </label>
          <div className="relative flex items-center">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="input input-sm input-bordered w-full pr-9 font-mono text-xs focus:input-primary"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="btn btn-ghost btn-xs absolute right-1 size-7 p-0 text-base-content/40 hover:text-base-content"
              aria-label={showApiKey ? "Hide key" : "Show key"}
            >
              {showApiKey ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-base-content/50">
            密钥将安全存储在您的数据库中。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm gap-1.5 shadow-sm"
          disabled={isFetchingModels || !baseUrl.trim()}
          onClick={onFetchModels}
        >
          {isFetchingModels ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          拉取可用模型
        </button>

        <button
          type="button"
          className="btn btn-neutral btn-sm gap-1.5"
          disabled={isTestingConnection || !baseUrl.trim()}
          onClick={onTestConnection}
        >
          {isTestingConnection ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4" />
          )}
          测试接口连通性
        </button>
      </div>

      {fetchResult ? (
        <div
          className={`rounded-lg border px-3.5 py-2.5 text-xs ${
            fetchResult.success
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          <div className="flex items-center gap-2">
            {fetchResult.success ? <Check className="size-4 shrink-0" /> : null}
            <span>{fetchResult.message}</span>
          </div>
        </div>
      ) : null}

      {testResult ? (
        <div
          className={`rounded-lg border px-3.5 py-2.5 text-xs ${
            testResult.success
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? <Check className="size-4 shrink-0" /> : null}
            <span>{testResult.message}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

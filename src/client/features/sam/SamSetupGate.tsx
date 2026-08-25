import { Link } from "@tanstack/react-router";
import { Cpu, ShieldAlert } from "lucide-react";

export function SamSetupGate({
  errorMessage,
  isRefetching,
  onRetry,
}: {
  errorMessage: string | null;
  isRefetching: boolean;
  onRetry: () => void;
}) {
  return (
    <section>
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 md:p-7 space-y-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-primary/15 p-2.5 text-primary shrink-0">
            <Cpu className="size-5" />
          </div>
          <div className="max-w-3xl space-y-1.5">
            <h2 className="text-xl font-semibold">
              启用 AI 智能助手与对话功能
            </h2>
            <div className="text-sm text-base-content/75 leading-relaxed">
              SAM（OpenSEO 内置 SEO 智能助手）需要配置 AI 模型接口与 API Key。
              支持配置自定义第三方接口（如 OpenAI、DeepSeek、硅基流动、本地
              Ollama 或 OpenRouter 等）。
            </div>
            <div className="text-xs text-base-content/50">
              您可以直接在系统设置中的「AI 设置」页面配置 API
              Key，或在服务器环境变量中设置 <code>OPENROUTER_API_KEY</code>。
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/ai-settings" className="btn btn-primary gap-1.5">
            <Cpu className="size-4" />
            前往 AI 设置页面配置
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onRetry}
            disabled={isRefetching}
          >
            {isRefetching ? "正在检查..." : "检查连接状态"}
          </button>
        </div>

        {errorMessage ? (
          <div className="alert alert-warning text-xs">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

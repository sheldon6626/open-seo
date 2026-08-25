import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";
import { AiSettingsRepository } from "@/server/features/sam/AiSettingsRepository";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";

export const DEFAULT_POPULAR_MODELS = [
  "minimax/minimax-m3",
  "deepseek/deepseek-chat",
  "deepseek/deepseek-reasoner",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.5-flash",
  "qwen/qwen-2.5-72b-instruct",
];

const saveAiSettingsSchema = z.object({
  provider: z.string().optional(),
  baseUrl: z.string().nullable().optional(),
  apiKey: z.string().nullable().optional(),
  defaultModel: z.string().optional(),
  customModels: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const fetchModelsSchema = z.object({
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
});

const testConnectionSchema = z.object({
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

function parseHttpErrorDetail(
  errorText: string,
  defaultStatus: string,
): string {
  if (!errorText) return defaultStatus;
  try {
    const parsed: unknown = JSON.parse(errorText);
    if (parsed && typeof parsed === "object") {
      if (
        "error" in parsed &&
        parsed.error &&
        typeof parsed.error === "object" &&
        "message" in parsed.error
      ) {
        return `${defaultStatus}: ${String((parsed.error as { message: unknown }).message)}`;
      }
      if ("message" in parsed) {
        return `${defaultStatus}: ${String(parsed.message)}`;
      }
    }
  } catch {
    return `${defaultStatus}: ${errorText.slice(0, 150)}`;
  }
  return defaultStatus;
}

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    const record = await AiSettingsRepository.getAiSettings(
      context.organizationId,
    );
    const envApiKey = await getOptionalEnvValue("OPENROUTER_API_KEY");
    const envBaseUrl = await getOptionalEnvValue("OPENROUTER_BASE_URL");
    const envModel = await getOptionalEnvValue("OPENROUTER_MODEL");

    const hasEnvKey = Boolean(envApiKey);
    const hasDbKey = Boolean(record?.apiKey);
    const effectiveApiKey = record?.apiKey || (hasEnvKey ? "••••••••" : "");

    return {
      provider:
        record?.provider ??
        (hasDbKey ? "custom" : hasEnvKey ? "openrouter" : "custom"),
      baseUrl: record?.baseUrl ?? envBaseUrl ?? "",
      apiKey: effectiveApiKey,
      hasApiKey: hasDbKey || hasEnvKey,
      isEnvConfigured: hasEnvKey,
      defaultModel: record?.defaultModel ?? envModel ?? "minimax/minimax-m3",
      customModels: record?.customModels ?? [],
      isActive: record?.isActive ?? true,
      updatedAt: record?.updatedAt ?? null,
    };
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(saveAiSettingsSchema)
  .handler(async ({ data, context }) => {
    let apiKeyToSave = data.apiKey;
    if (apiKeyToSave === "••••••••") {
      const existing = await AiSettingsRepository.getAiSettings(
        context.organizationId,
      );
      apiKeyToSave = existing?.apiKey ?? null;
    }

    const saved = await AiSettingsRepository.saveAiSettings({
      organizationId: context.organizationId,
      provider: data.provider,
      baseUrl: data.baseUrl,
      apiKey: apiKeyToSave,
      defaultModel: data.defaultModel,
      customModels: data.customModels,
      isActive: data.isActive,
    });

    return {
      success: true,
      settings: {
        provider: saved.provider,
        baseUrl: saved.baseUrl ?? "",
        apiKey: saved.apiKey ? "••••••••" : "",
        hasApiKey: Boolean(saved.apiKey),
        defaultModel: saved.defaultModel,
        customModels: saved.customModels,
        isActive: saved.isActive,
      },
    };
  });

export const fetchAvailableModels = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(fetchModelsSchema)
  .handler(async ({ data, context }) => {
    let baseUrl = data.baseUrl?.trim();
    let apiKey = data.apiKey?.trim();

    const existing = await AiSettingsRepository.getAiSettings(
      context.organizationId,
    );
    if (!baseUrl) {
      baseUrl =
        existing?.baseUrl ||
        (await getOptionalEnvValue("OPENROUTER_BASE_URL")) ||
        "https://openrouter.ai/api/v1";
    }
    if (!apiKey || apiKey === "••••••••") {
      apiKey =
        existing?.apiKey ||
        (await getOptionalEnvValue("OPENROUTER_API_KEY")) ||
        "";
    }

    if (!baseUrl) {
      return { success: false, error: "请提供接口地址 (Base URL)" };
    }

    try {
      let targetUrl = baseUrl.replace(/\/+$/, "");
      if (!targetUrl.endsWith("/models")) {
        targetUrl = targetUrl + "/models";
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const statusText = `HTTP ${response.status} ${response.statusText}`;
        const errorDetail = parseHttpErrorDetail(errorText, statusText);
        return { success: false, error: `请求失败: ${errorDetail}` };
      }

      const json: unknown = await response.json();
      let modelList: string[] = [];

      if (json && typeof json === "object") {
        if ("data" in json && Array.isArray(json.data)) {
          modelList = json.data
            .map((item: unknown) => {
              if (typeof item === "string") return item;
              if (
                item &&
                typeof item === "object" &&
                "id" in item &&
                typeof item.id === "string"
              ) {
                return item.id;
              }
              return null;
            })
            .filter((id): id is string => Boolean(id));
        } else if ("models" in json && Array.isArray(json.models)) {
          modelList = json.models
            .map((item: unknown) => {
              if (typeof item === "string") return item;
              if (
                item &&
                typeof item === "object" &&
                "name" in item &&
                typeof item.name === "string"
              ) {
                return item.name;
              }
              if (
                item &&
                typeof item === "object" &&
                "id" in item &&
                typeof item.id === "string"
              ) {
                return item.id;
              }
              return null;
            })
            .filter((id): id is string => Boolean(id));
        }
      } else if (Array.isArray(json)) {
        modelList = json
          .map((item: unknown) => {
            if (typeof item === "string") return item;
            if (
              item &&
              typeof item === "object" &&
              "id" in item &&
              typeof item.id === "string"
            ) {
              return item.id;
            }
            return null;
          })
          .filter((id): id is string => Boolean(id));
      }

      modelList = Array.from(new Set(modelList)).toSorted((a, b) =>
        a.localeCompare(b),
      );

      return {
        success: true,
        models: modelList,
        count: modelList.length,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `拉取模型失败: ${message}`,
      };
    }
  });

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(testConnectionSchema)
  .handler(async ({ data, context }) => {
    let baseUrl = data.baseUrl?.trim();
    let apiKey = data.apiKey?.trim();

    const existing = await AiSettingsRepository.getAiSettings(
      context.organizationId,
    );
    if (!baseUrl) {
      baseUrl =
        existing?.baseUrl ||
        (await getOptionalEnvValue("OPENROUTER_BASE_URL")) ||
        "https://openrouter.ai/api/v1";
    }
    if (!apiKey || apiKey === "••••••••") {
      apiKey =
        existing?.apiKey ||
        (await getOptionalEnvValue("OPENROUTER_API_KEY")) ||
        "";
    }

    if (!baseUrl) {
      return { success: false, message: "接口地址 (Base URL) 不能为空" };
    }

    try {
      let targetUrl = baseUrl.replace(/\/+$/, "");
      if (!targetUrl.endsWith("/models")) {
        targetUrl = targetUrl + "/models";
      }

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        return { success: true, message: "接口连接成功！认证与端点响应正常。" };
      } else {
        const statusText = response.statusText || `HTTP ${response.status}`;
        return {
          success: false,
          message: `接口连接异常: ${response.status} ${statusText}`,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `连接失败: ${msg}` };
    }
  });

export const getAvailableChatModels = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    const record = await AiSettingsRepository.getAiSettings(
      context.organizationId,
    );
    const envModel = await getOptionalEnvValue("OPENROUTER_MODEL");

    const defaultModel =
      record?.defaultModel || envModel || "minimax/minimax-m3";
    const customModels = record?.customModels || [];

    const allModels = Array.from(
      new Set([defaultModel, ...customModels, ...DEFAULT_POPULAR_MODELS]),
    ).filter(Boolean);

    return {
      defaultModel,
      models: allModels,
      customModels,
      hasCustomConfig: Boolean(record?.apiKey || record?.baseUrl),
    };
  });

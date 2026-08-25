import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";
import { AiSettingsRepository } from "@/server/features/sam/AiSettingsRepository";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";
import {
  DEFAULT_POPULAR_MODELS,
  isMaskedKey,
  parseHttpErrorDetail,
  parseModelListFromJson,
} from "@/server/features/sam/aiSettingsHelpers";

export { DEFAULT_POPULAR_MODELS };

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

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    try {
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
    } catch (err: unknown) {
      console.error("Failed in getAiSettings:", err);
      return {
        provider: "custom",
        baseUrl: "",
        apiKey: "",
        hasApiKey: false,
        isEnvConfigured: false,
        defaultModel: "minimax/minimax-m3",
        customModels: [],
        isActive: true,
        updatedAt: null,
      };
    }
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(saveAiSettingsSchema)
  .handler(async ({ data, context }) => {
    try {
      let apiKeyToSave: string | null | undefined = data.apiKey?.trim();
      if (isMaskedKey(apiKeyToSave)) {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed in saveAiSettings:", err);
      return {
        success: false,
        error: msg,
        settings: null,
      };
    }
  });

export const fetchAvailableModels = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(fetchModelsSchema)
  .handler(async ({ data, context }) => {
    try {
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
      if (!apiKey || isMaskedKey(apiKey)) {
        apiKey =
          existing?.apiKey ||
          (await getOptionalEnvValue("OPENROUTER_API_KEY")) ||
          "";
      }

      if (!baseUrl) {
        return { success: false, error: "请提供接口地址 (Base URL)" };
      }

      let targetUrl = baseUrl.replace(/\/+$/, "");
      if (!targetUrl.endsWith("/models")) {
        targetUrl = targetUrl + "/models";
      }

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = "Bearer " + apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch(targetUrl, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
      } catch (fetchErr: unknown) {
        const msg =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        return {
          success: false,
          error: "无法连接至目标端点 (" + targetUrl + "): " + msg,
        };
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const statusDesc =
          "HTTP " +
          response.status +
          " (" +
          (response.statusText || "Error") +
          ")";
        const detail = parseHttpErrorDetail(errorText, statusDesc);
        return {
          success: false,
          error: "接口返回错误: " + detail,
        };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return {
          success: false,
          error: "接口响应内容不是有效的 JSON 格式",
        };
      }

      const modelList = parseModelListFromJson(json);

      if (modelList.length === 0) {
        return {
          success: true,
          models: [],
          count: 0,
          message: "接口返回了 0 个模型，请确认该端点支持 /models 查询。",
        };
      }

      return {
        success: true,
        models: modelList,
        count: modelList.length,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: "拉取模型异常: " + message,
      };
    }
  });

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(testConnectionSchema)
  .handler(async ({ data, context }) => {
    try {
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
      if (!apiKey || isMaskedKey(apiKey)) {
        apiKey =
          existing?.apiKey ||
          (await getOptionalEnvValue("OPENROUTER_API_KEY")) ||
          "";
      }

      if (!baseUrl) {
        return { success: false, message: "接口地址 (Base URL) 不能为空" };
      }

      let targetUrl = baseUrl.replace(/\/+$/, "");
      if (!targetUrl.endsWith("/models")) {
        targetUrl = targetUrl + "/models";
      }

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = "Bearer " + apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let response: Response;
      try {
        response = await fetch(targetUrl, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
      } catch (fetchErr: unknown) {
        const msg =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        return {
          success: false,
          message: "无法连接至目标端点 (" + targetUrl + "): " + msg,
        };
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        return {
          success: true,
          message: "接口连接成功！认证与端点响应正常。",
        };
      } else {
        const errorText = await response.text().catch(() => "");
        const statusDesc =
          "HTTP " +
          response.status +
          " (" +
          (response.statusText || "Error") +
          ")";
        const detail = parseHttpErrorDetail(errorText, statusDesc);
        return {
          success: false,
          message: "接口连接异常: " + detail,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: "连接失败: " + msg };
    }
  });

export const getAvailableChatModels = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) => {
    try {
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
    } catch (err: unknown) {
      console.error("Failed in getAvailableChatModels:", err);
      return {
        defaultModel: "minimax/minimax-m3",
        models: DEFAULT_POPULAR_MODELS,
        customModels: [],
        hasCustomConfig: false,
      };
    }
  });

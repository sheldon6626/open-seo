import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getOptionalEnvValue,
  isHostedServerAuthMode,
} from "@/server/lib/runtime-env";
import { requireProjectContext } from "@/serverFunctions/middleware";
import { AiSettingsRepository } from "@/server/features/sam/AiSettingsRepository";

const OPENROUTER_KEY_MISSING_MESSAGE =
  "未检测到 AI API Key。请在左侧导航「AI 设置」中配置第三方 API Key，或在环境配置中设置 OPENROUTER_API_KEY。";

const projectScopedSchema = z.object({ projectId: z.string().min(1) });

type SamAccessStatus = {
  enabled: boolean;
  errorMessage: string | null;
};

// Gates the in-app AI agent (SAM) on an OpenRouter key or custom AI setting being configured.
export const getSamAccessSetupStatus = createServerFn({ method: "GET" })
  .middleware(requireProjectContext)
  .validator(projectScopedSchema)
  .handler(async ({ context }): Promise<SamAccessStatus> => {
    if (await isHostedServerAuthMode()) {
      return { enabled: true, errorMessage: null };
    }

    const envKey = Boolean(await getOptionalEnvValue("OPENROUTER_API_KEY"));
    if (envKey) {
      return { enabled: true, errorMessage: null };
    }

    const customSettings = await AiSettingsRepository.getAiSettings(
      context.organizationId,
    );
    if (customSettings?.apiKey) {
      return { enabled: true, errorMessage: null };
    }

    return {
      enabled: false,
      errorMessage: OPENROUTER_KEY_MISSING_MESSAGE,
    };
  });

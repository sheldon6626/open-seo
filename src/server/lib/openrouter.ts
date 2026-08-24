import {
  createOpenRouter,
  type LanguageModelV3,
} from "@openrouter/ai-sdk-provider";
import {
  getOptionalEnvValue,
  getRequiredEnvValue,
} from "@/server/lib/runtime-env";

// Default model slug used for the in-app chat agents (onboarding + SAM).
// Override with OPENROUTER_MODEL to swap models without a code change.
const DEFAULT_CHAT_AGENT_MODEL = "minimax/minimax-m3";

export async function getChatAgentModel(): Promise<LanguageModelV3> {
  const apiKey = await getRequiredEnvValue("OPENROUTER_API_KEY");
  const modelId = await getOptionalEnvValue("OPENROUTER_MODEL");
  const baseURL = await getOptionalEnvValue("OPENROUTER_BASE_URL");
  return buildChatAgentModel(apiKey, modelId, baseURL);
}

/**
 * Synchronous variant for callers that already hold the env values. Think's
 * `getModel()` hook is sync and runs on every turn, so the SAM agent reads the
 * key/model/baseURL from its DO env and builds the model here.
 */
export function buildChatAgentModel(
  apiKey: string,
  modelId?: string,
  baseURL?: string,
): LanguageModelV3 {
  const isCustomBaseURL = !!baseURL && !baseURL.includes("openrouter.ai");
  const provider = createOpenRouter({
    apiKey,
    baseURL: baseURL || undefined,
    compatibility: isCustomBaseURL ? "compatible" : undefined,
  });

  return provider(
    modelId ?? DEFAULT_CHAT_AGENT_MODEL,
    isCustomBaseURL
      ? {
          usage: { include: true },
        }
      : {
          usage: { include: true },
          reasoning: { effort: "medium" },
          provider: {
            order: ["together", "atlas-cloud/fp8"],
            zdr: true,
            allow_fallbacks: true,
          },
        },
  );
}

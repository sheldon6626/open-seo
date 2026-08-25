import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";

type AiSettingsRecord = {
  id: string;
  organizationId: string;
  provider: string;
  baseUrl: string | null;
  apiKey: string | null;
  defaultModel: string;
  customModels: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type SaveAiSettingsInput = {
  organizationId: string;
  provider?: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  defaultModel?: string | null;
  customModels?: string[] | null;
  isActive?: boolean;
};

function parseCustomModels(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (m: unknown): m is string =>
            typeof m === "string" && m.trim().length > 0,
        )
      : [];
  } catch {
    return [];
  }
}

async function getAiSettings(
  organizationId: string,
): Promise<AiSettingsRecord | null> {
  try {
    const [row] = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.organizationId, organizationId))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organizationId,
      provider: row.provider,
      baseUrl: row.baseUrl,
      apiKey: row.apiKey,
      defaultModel: row.defaultModel,
      customModels: parseCustomModels(row.customModels),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (err: unknown) {
    console.warn("[AiSettingsRepository] Table or query error:", err);
    return null;
  }
}

async function saveAiSettings(
  input: SaveAiSettingsInput,
): Promise<AiSettingsRecord> {
  const existing = await getAiSettings(input.organizationId);
  const now = new Date().toISOString();

  const customModelsJson =
    input.customModels !== undefined
      ? JSON.stringify(input.customModels || [])
      : existing
        ? JSON.stringify(existing.customModels)
        : "[]";

  if (existing) {
    const updatedValues: Partial<typeof aiSettings.$inferInsert> = {
      updatedAt: now,
    };

    if (input.provider !== undefined) updatedValues.provider = input.provider;
    if (input.baseUrl !== undefined)
      updatedValues.baseUrl = input.baseUrl ? input.baseUrl.trim() : null;
    if (input.apiKey !== undefined)
      updatedValues.apiKey = input.apiKey ? input.apiKey.trim() : null;
    if (input.defaultModel !== undefined && input.defaultModel)
      updatedValues.defaultModel = input.defaultModel.trim();
    if (input.customModels !== undefined)
      updatedValues.customModels = customModelsJson;
    if (input.isActive !== undefined) updatedValues.isActive = input.isActive;

    try {
      await db
        .update(aiSettings)
        .set(updatedValues)
        .where(eq(aiSettings.id, existing.id));
    } catch (err: unknown) {
      console.error(
        "[AiSettingsRepository] Failed to update ai_settings:",
        err,
      );
    }

    const updated = await getAiSettings(input.organizationId);
    return (
      updated || {
        id: existing.id,
        organizationId: input.organizationId,
        provider: input.provider || existing.provider,
        baseUrl: input.baseUrl !== undefined ? input.baseUrl : existing.baseUrl,
        apiKey: input.apiKey !== undefined ? input.apiKey : existing.apiKey,
        defaultModel: input.defaultModel || existing.defaultModel,
        customModels:
          input.customModels !== undefined
            ? input.customModels || []
            : existing.customModels,
        isActive:
          input.isActive !== undefined ? input.isActive : existing.isActive,
        createdAt: existing.createdAt,
        updatedAt: now,
      }
    );
  }

  const id = crypto.randomUUID();
  const insertValues = {
    id,
    organizationId: input.organizationId,
    provider: input.provider || "custom",
    baseUrl: input.baseUrl ? input.baseUrl.trim() : null,
    apiKey: input.apiKey ? input.apiKey.trim() : null,
    defaultModel: input.defaultModel?.trim() || "minimax/minimax-m3",
    customModels: customModelsJson,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const [inserted] = await db
      .insert(aiSettings)
      .values(insertValues)
      .returning();

    if (inserted) {
      return {
        id: inserted.id,
        organizationId: inserted.organizationId,
        provider: inserted.provider,
        baseUrl: inserted.baseUrl,
        apiKey: inserted.apiKey,
        defaultModel: inserted.defaultModel,
        customModels: parseCustomModels(inserted.customModels),
        isActive: Boolean(inserted.isActive),
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
      };
    }
  } catch (err: unknown) {
    console.error("[AiSettingsRepository] Failed to insert ai_settings:", err);
  }

  return {
    id,
    organizationId: input.organizationId,
    provider: insertValues.provider,
    baseUrl: insertValues.baseUrl,
    apiKey: insertValues.apiKey,
    defaultModel: insertValues.defaultModel,
    customModels: parseCustomModels(customModelsJson),
    isActive: insertValues.isActive,
    createdAt: now,
    updatedAt: now,
  };
}

export const AiSettingsRepository = {
  getAiSettings,
  saveAiSettings,
} as const;

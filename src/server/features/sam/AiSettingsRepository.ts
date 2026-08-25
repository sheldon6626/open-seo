import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";

export type AiSettingsRecord = {
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

export type SaveAiSettingsInput = {
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

    await db
      .update(aiSettings)
      .set(updatedValues)
      .where(eq(aiSettings.id, existing.id));

    const updated = await getAiSettings(input.organizationId);
    return updated!;
  }

  const id = crypto.randomUUID();
  const [inserted] = await db
    .insert(aiSettings)
    .values({
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
    })
    .returning();

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

export const AiSettingsRepository = {
  getAiSettings,
  saveAiSettings,
} as const;

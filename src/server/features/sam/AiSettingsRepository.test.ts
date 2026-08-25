import { describe, expect, it, beforeEach, vi } from "vitest";

type MockRow = {
  id?: string;
  organizationId?: string;
  provider?: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  defaultModel?: string;
  customModels?: string;
  isActive?: number | boolean;
  createdAt?: string;
  updatedAt?: string;
};

const mocks = vi.hoisted(() => ({
  selectRows: [] as MockRow[],
  updatedRows: [] as unknown[],
  insertedRows: [] as unknown[],
}));

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockImplementation(() => Promise.resolve(mocks.selectRows)),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((vals: unknown) => {
        mocks.updatedRows.push(vals);
        return {
          where: vi.fn().mockResolvedValue([]),
        };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((vals: unknown) => {
        mocks.insertedRows.push(vals);
        return {
          returning: vi.fn().mockResolvedValue([vals]),
        };
      }),
    })),
  },
}));

import { AiSettingsRepository } from "./AiSettingsRepository";

describe("AiSettingsRepository", () => {
  beforeEach(() => {
    mocks.selectRows = [];
    mocks.updatedRows = [];
    mocks.insertedRows = [];
  });

  it("returns null when no settings are found", async () => {
    mocks.selectRows = [];
    const result = await AiSettingsRepository.getAiSettings("org-1");
    expect(result).toBeNull();
  });

  it("returns mapped AI settings when record exists", async () => {
    mocks.selectRows = [
      {
        id: "ai-1",
        organizationId: "org-1",
        provider: "deepseek",
        baseUrl: "https://api.deepseek.com/v1",
        apiKey: "sk-test",
        defaultModel: "deepseek-chat",
        customModels: '["deepseek-chat","deepseek-reasoner"]',
        isActive: 1,
        createdAt: "2026-08-25T00:00:00Z",
        updatedAt: "2026-08-25T00:00:00Z",
      },
    ];

    const result = await AiSettingsRepository.getAiSettings("org-1");
    expect(result).not.toBeNull();
    expect(result?.provider).toBe("deepseek");
    expect(result?.baseUrl).toBe("https://api.deepseek.com/v1");
    expect(result?.apiKey).toBe("sk-test");
    expect(result?.defaultModel).toBe("deepseek-chat");
    expect(result?.customModels).toEqual(["deepseek-chat", "deepseek-reasoner"]);
    expect(result?.isActive).toBe(true);
  });

  it("inserts new record when none exists", async () => {
    mocks.selectRows = [];
    const saved = await AiSettingsRepository.saveAiSettings({
      organizationId: "org-1",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-openai-key",
      defaultModel: "gpt-4o",
      customModels: ["gpt-4o", "gpt-4o-mini"],
      isActive: true,
    });

    expect(mocks.insertedRows.length).toBe(1);
    expect(saved.organizationId).toBe("org-1");
    expect(saved.provider).toBe("openai");
    expect(saved.defaultModel).toBe("gpt-4o");
    expect(saved.customModels).toEqual(["gpt-4o", "gpt-4o-mini"]);
  });
});

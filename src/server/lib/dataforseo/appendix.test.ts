import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/lib/runtime-env", () => ({
  getRequiredEnvValue: vi.fn(async () => "test-api-key"),
  getOptionalEnvValue: vi.fn(async () => "test-api-key"),
}));

import { fetchUserData } from "@/server/lib/dataforseo/appendix";

describe("DataForSEO appendix endpoints", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches user data including balance and rates", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status_code: 20000,
        tasks: [
          {
            status_code: 20000,
            path: ["v3", "appendix", "user_data"],
            cost: 0,
            result_count: 1,
            result: [
              {
                login: "sheldon@example.com",
                timezone: "UTC",
                money: {
                  total: 100,
                  balance: 50.605734,
                  currency: "USD",
                },
              },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchUserData();

    expect(
      fetchMock.mock.calls.map(([url]) =>
        typeof url === "string" || url instanceof URL
          ? url.toString()
          : url.url,
      ),
    ).toEqual(["https://api.dataforseo.com/v3/appendix/user_data"]);
    expect(result?.login).toBe("sheldon@example.com");
    expect(result?.money?.balance).toBe(50.605734);
    expect(result?.money?.total).toBe(100);
  });

  it("handles empty result correctly", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status_code: 20000,
        tasks: [
          {
            status_code: 20000,
            path: ["v3", "appendix", "user_data"],
            cost: 0,
            result_count: 0,
            result: null,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchUserData();
    expect(result).toBeUndefined();
  });
});

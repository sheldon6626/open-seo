import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";
import { fetchUserData } from "@/server/lib/dataforseo/appendix";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";

export const getSeoApiKeyStatus = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async () => {
    const configured = Boolean(
      (await getOptionalEnvValue("DATAFORSEO_API_KEY"))?.trim() ||
      env.DATAFORSEO_API_KEY?.trim(),
    );
    return { configured };
  });

export const getDataforseoBalance = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async () => {
    const apiKey =
      (await getOptionalEnvValue("DATAFORSEO_API_KEY"))?.trim() ||
      env.DATAFORSEO_API_KEY?.trim();
    if (!apiKey) {
      return { configured: false, balance: null, login: null };
    }
    try {
      const userData = await fetchUserData();
      const rawBalance = userData?.money?.balance;
      const balance =
        typeof rawBalance === "number" && Number.isFinite(rawBalance)
          ? rawBalance
          : null;
      return { configured: true, balance, login: userData?.login ?? null };
    } catch {
      return { configured: true, balance: null, login: null };
    }
  });

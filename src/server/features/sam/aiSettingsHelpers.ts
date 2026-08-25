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

export function isMaskedKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return key.includes("•") || key.includes("*");
}

export function parseHttpErrorDetail(
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
        return (
          defaultStatus +
          ": " +
          String((parsed.error as { message: unknown }).message)
        );
      }
      if ("message" in parsed) {
        return defaultStatus + ": " + String(parsed.message);
      }
    }
  } catch {
    return defaultStatus + ": " + errorText.slice(0, 150);
  }
  return defaultStatus;
}

export function parseModelListFromJson(json: unknown): string[] {
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

  return Array.from(new Set(modelList)).toSorted((a, b) => a.localeCompare(b));
}

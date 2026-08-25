import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bot, Cpu, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getAiSettings,
  saveAiSettings,
  fetchAvailableModels,
  testAiConnection,
  DEFAULT_POPULAR_MODELS,
} from "@/serverFunctions/aiSettings";
import { getProjects } from "@/serverFunctions/projects";
import {
  ProviderPresetsSection,
  type ProviderPreset,
} from "./ProviderPresetsSection";
import { ConnectionConfigSection } from "./ConnectionConfigSection";
import { ModelManagementSection } from "./ModelManagementSection";

export function AiSettingsView() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["aiSettings"],
    queryFn: () => getAiSettings(),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });
  const firstProjectId = projectsQuery.data?.[0]?.id;

  const [provider, setProvider] = useState("custom");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("minimax/minimax-m3");
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fetchResult, setFetchResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      const data = settingsQuery.data;
      setProvider(data.provider || "custom");
      setBaseUrl(data.baseUrl || "");
      setApiKey(data.apiKey || "");
      setDefaultModel(data.defaultModel || "minimax/minimax-m3");
      const models = data.customModels && data.customModels.length > 0
        ? data.customModels
        : DEFAULT_POPULAR_MODELS;
      setCustomModels(models);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: {
      provider: string;
      baseUrl: string;
      apiKey: string;
      defaultModel: string;
      customModels: string[];
    }) =>
      saveAiSettings({
        data: {
          provider: values.provider,
          baseUrl: values.baseUrl || null,
          apiKey: values.apiKey || null,
          defaultModel: values.defaultModel,
          customModels: values.customModels,
          isActive: true,
        },
      }),
    onSuccess: () => {
      toast.success("AI 配置已保存并立即生效");
      void queryClient.invalidateQueries({ queryKey: ["aiSettings"] });
      void queryClient.invalidateQueries({ queryKey: ["availableChatModels"] });
      void queryClient.invalidateQueries({ queryKey: ["samAccessStatus"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "保存设置失败");
    },
  });

  const fetchModelsMutation = useMutation({
    mutationFn: () =>
      fetchAvailableModels({
        data: {
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
        },
      }),
    onSuccess: (res) => {
      if (res.success && res.models) {
        setFetchResult({
          success: true,
          message: `成功从接口拉取到 ${res.count} 个可用模型！已加入模型列表。`,
        });
        const merged = Array.from(new Set([...customModels, ...res.models]));
        setCustomModels(merged);
        if (res.models.length > 0 && !res.models.includes(defaultModel)) {
          setDefaultModel(res.models[0]);
        }
        toast.success(`成功拉取到 ${res.count} 个可用模型`);
      } else {
        setFetchResult({
          success: false,
          message: res.error || "拉取模型失败，请检查 Base URL 和 API Key 是否正确。",
        });
        toast.error(res.error || "拉取模型失败");
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "请求失败";
      setFetchResult({ success: false, message: msg });
      toast.error(msg);
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () =>
      testAiConnection({
        data: {
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
          model: defaultModel,
        },
      }),
    onSuccess: (res) => {
      setTestResult(res);
      if (res.success) {
        toast.success("接口连接测试成功");
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "测试连接失败";
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    },
  });

  const applyPreset = (preset: ProviderPreset) => {
    setProvider(preset.id);
    if (preset.baseUrl) {
      setBaseUrl(preset.baseUrl);
    }
    setDefaultModel(preset.defaultModel);
    if (preset.suggestedModels.length > 0) {
      const combined = Array.from(new Set([...preset.suggestedModels, ...customModels]));
      setCustomModels(combined);
    }
    toast.info(`已切换为 ${preset.name} 预设`);
  };

  const handleSave = () => {
    saveMutation.mutate({
      provider,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      defaultModel: defaultModel.trim(),
      customModels,
    });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-base-300 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">AI 模型与接口设置</h1>
            </div>
            <p className="mt-1.5 text-sm text-base-content/65">
              配置第三方大模型接口（支持 OpenAI 格式、OpenRouter、DeepSeek、硅基流动、Ollama 等）与对话可选模型。
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {firstProjectId ? (
              <Link
                to="/p/$projectId/sam"
                params={{ projectId: firstProjectId }}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <Bot className="size-4" />
                进入 AI 对话
              </Link>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1.5 shadow-sm"
              disabled={saveMutation.isPending}
              onClick={handleSave}
            >
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              保存设置
            </button>
          </div>
        </div>

        <ProviderPresetsSection
          selectedProvider={provider}
          onSelectPreset={applyPreset}
        />

        <ConnectionConfigSection
          baseUrl={baseUrl}
          setBaseUrl={setBaseUrl}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onFetchModels={() => fetchModelsMutation.mutate()}
          isFetchingModels={fetchModelsMutation.isPending}
          onTestConnection={() => testConnectionMutation.mutate()}
          isTestingConnection={testConnectionMutation.isPending}
          fetchResult={fetchResult}
          testResult={testResult}
        />

        <ModelManagementSection
          defaultModel={defaultModel}
          setDefaultModel={setDefaultModel}
          customModels={customModels}
          setCustomModels={setCustomModels}
          onResetDefaults={() => setCustomModels(DEFAULT_POPULAR_MODELS)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
          <button
            type="button"
            className="btn btn-primary btn-md gap-2 px-6 shadow-md"
            disabled={saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            保存所有配置
          </button>
        </div>
      </div>
    </div>
  );
}

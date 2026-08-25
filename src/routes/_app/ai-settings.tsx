import { createFileRoute } from "@tanstack/react-router";
import { AiSettingsView } from "@/client/features/ai-settings/AiSettingsView";

export const Route = createFileRoute("/_app/ai-settings")({
  component: AiSettingsPage,
});

function AiSettingsPage() {
  return <AiSettingsView />;
}

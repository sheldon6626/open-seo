import {
  Bookmark,
  Bot,
  ClipboardCheck,
  Cpu,
  Globe,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { linkOptions } from "@tanstack/react-router";
import { GoogleGlyphMuted } from "@/client/features/gsc/GoogleGlyph";

const projectNavItems = [
  {
    to: "/p/$projectId" as const,
    label: "Overview",
    icon: LayoutDashboard,
    // Without exact matching, the index path is a prefix of every project
    // route and the Overview item would render active everywhere.
    activeOptions: { exact: true, includeSearch: false },
  },
  {
    to: "/p/$projectId/keywords" as const,
    label: "Keyword research",
    icon: Search,
  },
  {
    to: "/p/$projectId/saved" as const,
    label: "Saved keywords",
    icon: Bookmark,
  },
  {
    to: "/p/$projectId/domain" as const,
    label: "Domain overview",
    icon: Globe,
  },
  {
    to: "/p/$projectId/brand-lookup" as const,
    label: "Competitor analysis",
    icon: Sparkles,
  },
  {
    to: "/p/$projectId/backlinks" as const,
    label: "Backlinks & checks",
    icon: Link2,
  },
  {
    to: "/p/$projectId/rank-tracking" as const,
    label: "Rank tracking",
    icon: TrendingUp,
  },
  {
    to: "/p/$projectId/prompt-explorer" as const,
    label: "AI prompt tracking",
    icon: MessageSquare,
  },
  {
    to: "/p/$projectId/search-performance" as const,
    label: "Search performance",
    icon: GoogleGlyphMuted,
  },
  {
    to: "/p/$projectId/audit" as const,
    label: "Site audit",
    icon: ClipboardCheck,
  },
] as const;

const aiNavItem = linkOptions({
  to: "/ai" as const,
  label: "AI 与 MCP",
  icon: Bot,
});

const aiSettingsNavItem = linkOptions({
  to: "/ai-settings" as const,
  label: "AI 设置",
  icon: Cpu,
});

// Always-visible sidebar group (not project-scoped, unlike the groups below).
export const connectNavGroup = {
  label: "连接",
  items: [aiNavItem, aiSettingsNavItem],
};

function getProjectNavItems(projectId: string) {
  return linkOptions(
    projectNavItems.map((item) => ({
      ...item,
      params: { projectId },
      search: {},
    })),
  );
}

// Grouped by scope: "My Site" is the project's own domain (tracked data),
// "Research" is point-at-anything lookup tools.
export function getProjectNavGroups(projectId: string) {
  const all = getProjectNavItems(projectId);
  const byPath = (path: (typeof projectNavItems)[number]["to"]) =>
    all.find((i) => i.to === path)!;

  return [
    {
      label: "Overview",
      items: [byPath("/p/$projectId")],
    },
    {
      label: "Keyword research",
      items: [
        byPath("/p/$projectId/keywords"),
        byPath("/p/$projectId/saved"),
        byPath("/p/$projectId/domain"),
      ],
    },
    {
      label: "Competitive analysis",
      items: [byPath("/p/$projectId/brand-lookup")],
    },
    {
      label: "Backlinks",
      items: [byPath("/p/$projectId/backlinks")],
    },
    {
      label: "Rank tracking & AI visibility",
      items: [
        byPath("/p/$projectId/rank-tracking"),
        byPath("/p/$projectId/prompt-explorer"),
        byPath("/p/$projectId/search-performance"),
      ],
    },
    {
      label: "Site health",
      items: [byPath("/p/$projectId/audit")],
    },
  ];
}

export const dataforseoHelpLinkOptions = linkOptions({
  to: "/help/dataforseo-api-key",
});

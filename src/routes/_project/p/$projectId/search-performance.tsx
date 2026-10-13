import { createFileRoute } from "@tanstack/react-router";
import { SearchPerformanceWithAnalytics } from "@/client/features/search-performance/SearchPerformanceWithAnalytics";

export const Route = createFileRoute(
  "/_project/p/$projectId/search-performance",
)({
  component: SearchPerformanceRoute,
});

function SearchPerformanceRoute() {
  const { projectId } = Route.useParams();
  return <SearchPerformanceWithAnalytics projectId={projectId} />;
}

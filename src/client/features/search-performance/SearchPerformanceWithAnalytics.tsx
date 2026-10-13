import { useQuery } from "@tanstack/react-query";
import { Ga4Card } from "@/client/features/dashboard/Ga4Card";
import { SearchPerformancePage } from "./SearchPerformancePage";
import { getGa4Connection } from "@/serverFunctions/ga4";

export function SearchPerformanceWithAnalytics({
  projectId,
}: {
  projectId: string;
}) {
  const connectionQuery = useQuery({
    queryKey: ["ga4Connection", projectId],
    queryFn: () => getGa4Connection({ data: { projectId } }),
  });

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="mx-auto max-w-7xl">
          <Ga4Card
            projectId={projectId}
            connected={Boolean(connectionQuery.data?.connected)}
          />
        </div>
      </div>
      <SearchPerformancePage projectId={projectId} />
    </div>
  );
}

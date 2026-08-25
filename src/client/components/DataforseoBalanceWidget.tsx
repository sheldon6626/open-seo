import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Coins, ExternalLink, RotateCw } from "lucide-react";
import { dataforseoHelpLinkOptions } from "@/client/navigation/items";
import { getDataforseoBalance } from "@/serverFunctions/config";

interface DataforseoBalanceWidgetProps {
  onNavigate?: () => void;
}

function formatBalance(balance: number): string {
  if (balance >= 1 || balance === 0) {
    return `$${balance.toFixed(2)}`;
  }
  return `$${balance.toFixed(4)}`;
}

export function DataforseoBalanceWidget({
  onNavigate,
}: DataforseoBalanceWidgetProps) {
  const balanceQuery = useQuery({
    queryKey: ["dataforseoBalance"],
    queryFn: () => getDataforseoBalance(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data, isLoading, isError, isFetching, refetch } = balanceQuery;

  return (
    <div className="mx-2 mb-2 rounded-lg border border-base-300 bg-base-100 p-2.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/70">
          <Coins className="size-3.5 shrink-0 text-base-content/60" />
          <span>DataForSEO 余额</span>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content"
          aria-label="刷新余额"
          title="刷新余额"
        >
          <RotateCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-1.5">
        {isLoading ? (
          <div className="h-5 w-20 animate-pulse rounded bg-base-300/70" />
        ) : isError || (data?.configured && data.balance === null) ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-error/80">获取失败</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              重试
            </button>
          </div>
        ) : !data?.configured ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-base-content/50">未配置 API Key</span>
            <Link
              {...dataforseoHelpLinkOptions}
              onClick={onNavigate}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              去配置 →
            </Link>
          </div>
        ) : typeof data?.balance === "number" ? (
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono text-sm font-semibold tracking-tight text-base-content tabular-nums"
              title={`实际余额: $${data.balance.toFixed(6)}`}
            >
              {formatBalance(data.balance)}
            </span>
            <a
              href="https://app.dataforseo.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary/80 hover:text-primary hover:underline"
            >
              充值
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

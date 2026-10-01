export type DashboardMoneyCount = { amount: number; count: number };
export type DashboardOverview = {
  hasAnyQuote: boolean;
  volume: DashboardMoneyCount;
  decisions: { acceptedAmount: number; acceptedCount: number; rejectedCount: number };
  completed: { actualProfit: number; estimatedProfit: number; completedAmount: number; count: number };
  active: { count: number; volume: number; expectedProfit: number };
  lost: DashboardMoneyCount;
  pending: DashboardMoneyCount;
  funnel: { sent: number; viewed: number; accepted: number; rejected: number };
  statuses: { accepted: number; scheduled: number; inProgress: number; completed: number; cancelled: number };
  recentQuotes: Array<{ id: string; number: string; title: string; customer: string; amount: number; status: string; validUntil: string; date: string }>;
  activeJobs: Array<{ id: string; title: string; customer: string; amount: number; status: string; startedAt: string | null }>;
  topJobs: Array<{ id: string; title: string; customer: string; salePrice: number; profit: number; margin: number | null }>;
  reasons: Array<{ reason: string; count: number }>;
  activity: Array<{ type: string; at: string; id: string; customer: string; title: string }>;
};

export function deriveDashboardMetrics(data: Pick<DashboardOverview, "decisions" | "completed" | "active">) {
  const resolved = data.decisions.acceptedCount + data.decisions.rejectedCount;
  return {
    acceptanceRate: resolved ? data.decisions.acceptedCount / resolved * 100 : null,
    profitVariance: data.completed.count ? Math.round((data.completed.actualProfit - data.completed.estimatedProfit) * 100) / 100 : null,
    activeCount: data.active.count,
  };
}

export function isDashboardOverview(value: unknown): value is DashboardOverview {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const required = ["volume", "decisions", "completed", "active", "lost", "pending", "funnel", "statuses"];
  return typeof row.hasAnyQuote === "boolean" && required.every((key) => !!row[key] && typeof row[key] === "object") &&
    ["recentQuotes", "activeJobs", "topJobs", "reasons", "activity"].every((key) => Array.isArray(row[key]));
}

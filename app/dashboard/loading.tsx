import { StatCardSkeleton, RowSkeleton, Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <Skeleton width="220px" height="28px" style={{ marginBottom: "var(--space-6)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Skeleton width="140px" height="20px" style={{ marginBottom: "var(--space-4)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}

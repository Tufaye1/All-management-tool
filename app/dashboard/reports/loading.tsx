import { Skeleton, StatCardSkeleton, RowSkeleton } from "@/components/skeleton";

export default function ReportsLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: "960px" }}>
      <Skeleton width="100px" height="28px" />

      {/* Period tabs */}
      <Skeleton width="400px" height="36px" borderRadius="var(--radius-md)" />

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "var(--space-4)",
      }}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* P&L table */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Skeleton width="120px" height="20px" />
        {Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={`pnl-${i}`} />
        ))}
      </div>

      {/* Invoice stats */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Skeleton width="90px" height="20px" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    </div>
  );
}

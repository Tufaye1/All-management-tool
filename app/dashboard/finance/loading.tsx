import { Skeleton, StatCardSkeleton, RowSkeleton } from "@/components/skeleton";

export default function FinanceLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Skeleton width="100px" height="28px" />
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Skeleton width="100px" height="36px" borderRadius="var(--radius-md)" />
          <Skeleton width="80px" height="36px" borderRadius="var(--radius-md)" />
          <Skeleton width="90px" height="36px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "var(--space-4)",
      }}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* P&L Section */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Skeleton width="120px" height="20px" />
        {Array.from({ length: 4 }).map((_, i) => (
          <RowSkeleton key={`pnl-${i}`} />
        ))}
      </div>

      {/* Invoices Section */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Skeleton width="90px" height="20px" />
        {Array.from({ length: 3 }).map((_, i) => (
          <RowSkeleton key={`inv-${i}`} />
        ))}
      </div>

      {/* Transactions Section */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Skeleton width="160px" height="20px" />
        {Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={`tx-${i}`} />
        ))}
      </div>
    </div>
  );
}

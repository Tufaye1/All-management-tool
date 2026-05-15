import { Skeleton, RowSkeleton } from "@/components/skeleton";

export default function ClientDetailLoading() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <Skeleton width="100px" height="12px" style={{ marginBottom: "var(--space-4)" }} />
      <Skeleton width="200px" height="28px" style={{ marginBottom: "var(--space-6)" }} />
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        <Skeleton width="80px" height="32px" borderRadius="var(--radius-md)" />
        <Skeleton width="80px" height="32px" borderRadius="var(--radius-md)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}

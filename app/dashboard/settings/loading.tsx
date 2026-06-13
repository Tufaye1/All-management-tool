import { Skeleton } from "@/components/skeleton";

export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <Skeleton width="100px" height="28px" />

      {/* Tabs */}
      <Skeleton width="360px" height="36px" borderRadius="var(--radius-md)" />

      {/* Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <Skeleton width="120px" height="20px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <Skeleton width="100px" height="14px" />
          <Skeleton width="320px" height="36px" borderRadius="var(--radius-md)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <Skeleton width="80px" height="14px" />
          <Skeleton width="280px" height="14px" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <Skeleton width="60px" height="14px" />
          <Skeleton width="320px" height="36px" borderRadius="var(--radius-md)" />
        </div>
        <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}

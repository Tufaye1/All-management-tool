import styles from "./skeleton.module.css";

type SkeletonProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ width = "100%", height = "16px", borderRadius, style }: SkeletonProps) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width,
        height,
        borderRadius: borderRadius ?? "var(--radius-md)",
        ...style,
      }}
    />
  );
}

/** Pre-built skeleton layouts matching page content shapes */

export function StatCardSkeleton() {
  return (
    <div className={styles.statCard}>
      <Skeleton width="80px" height="12px" />
      <Skeleton width="40px" height="28px" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className={styles.row}>
      <div className={styles.rowLeft}>
        <Skeleton width="60%" height="14px" />
        <Skeleton width="40%" height="12px" />
      </div>
      <div className={styles.rowRight}>
        <Skeleton width="60px" height="22px" borderRadius="var(--radius-full)" />
        <Skeleton width="50px" height="12px" />
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Skeleton width="120px" height="28px" />
        <Skeleton width="100px" height="36px" borderRadius="var(--radius-md)" />
      </div>
      <div className={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

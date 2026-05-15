"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import styles from "./breadcrumbs.module.css";

export type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  crumbs: Crumb[];
};

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  if (crumbs.length <= 1) return null;

  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className={styles.item}>
              {i > 0 && <ChevronRight size={14} className={styles.separator} />}
              {isLast || !crumb.href ? (
                <span className={styles.current}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className={styles.link}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

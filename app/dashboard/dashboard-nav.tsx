"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CheckSquare, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./nav.module.css";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

type DashboardNavProps = {
  email: string;
};

export function DashboardNav({ email }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/clients", label: "Clients", icon: Users, exact: false },
    { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare, exact: false },
  ];

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className={`glass-bar ${styles.nav}`}>
      <Link href="/dashboard" className={styles.logo}>Agency OS</Link>
      <div className={styles.links}>
        {links.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${isActive(href, exact) ? styles.linkActive : ""}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
      <div className={styles.right}>
        <span className={styles.avatar}>{getInitials(email)}</span>
        <button className={styles.signOutButton} onClick={handleSignOut} aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

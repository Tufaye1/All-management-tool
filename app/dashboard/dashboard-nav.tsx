"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, CheckSquare, Target, Users, DollarSign, BarChart3, Settings, LogOut, Menu, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { canSeeNavItem } from "@/lib/permissions";
import { NotificationBell } from "@/components/notifications";
import { useTheme } from "@/components/theme-provider";
import type { WorkspaceRole } from "@/lib/types";
import styles from "./nav.module.css";

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, key: "dashboard" },
  { href: "/dashboard/clients", label: "Clients", icon: Building2, exact: false, key: "clients" },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare, exact: false, key: "tasks" },
  { href: "/dashboard/leads", label: "Leads", icon: Target, exact: false, key: "leads" },
  { href: "/dashboard/team", label: "Team", icon: Users, exact: false, key: "team" },
  { href: "/dashboard/finance", label: "Finance", icon: DollarSign, exact: false, key: "finance" },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, exact: false, key: "reports" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false, key: "settings" },
];

type DashboardNavProps = {
  email: string;
  role: WorkspaceRole;
  fullName: string | null;
  userId: string;
  workspaceId: string;
};

export function DashboardNav({ email, role, fullName, userId, workspaceId }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Heartbeat: update last_seen on every dashboard page load so the team
  // page can show a live green-dot indicator. Fire-and-forget — no UI block.
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("touch_last_seen").then(() => {
      /* noop — fire and forget */
    });
  }, [pathname]);

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
    <>
      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoArea}>
          <Link href="/dashboard" className={styles.logo} onClick={() => setSidebarOpen(false)}>
            Agency OS
          </Link>
          <NotificationBell userId={userId} workspaceId={workspaceId} role={role} />
        </div>

        <nav className={styles.links}>
          {NAV_ITEMS
            .filter(({ key }) => canSeeNavItem(role, key))
            .map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${isActive(href, exact) ? styles.linkActive : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.userArea}>
          <span className={styles.avatar}>{fullName ? getInitials(fullName) : getInitials(email)}</span>
          <div className={styles.userInfo}>
            {fullName && <span className={styles.userName}>{fullName}</span>}
            <span className={styles.userEmail}>{email}</span>
          </div>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className={styles.signOutButton} onClick={handleSignOut} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

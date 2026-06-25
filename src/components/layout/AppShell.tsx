"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderOpen,
  LogOut,
  PlusCircle,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";

interface AppShellProps {
  userEmail: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/profile", icon: User, labelKey: "nav.profile" as const },
  { href: "/jobs/new", icon: PlusCircle, labelKey: "nav.newJob" as const },
  { href: "/applications", icon: FolderOpen, labelKey: "nav.applications" as const },
] as const;

/**
 * Authenticated app layout with persistent sidebar navigation.
 */
export function AppShell({ userEmail, children }: AppShellProps) {
  const t = useT();
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-[var(--color-card-border)] bg-[var(--color-card)]">
        <div className="border-b border-[var(--color-card-border)] p-4">
          <Link href="/profile" className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--color-accent)]" />
            <span className="text-sm font-bold">AI Job Agent</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--color-card-border)] p-3">
          <p className="mb-2 truncate px-3 text-xs text-[var(--color-muted)]">
            {userEmail}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-danger)]"
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.signOut")}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-56">
        <header className="sticky top-0 z-20 flex justify-end border-b border-[var(--color-card-border)] bg-[var(--color-background)]/80 px-6 py-3 backdrop-blur">
          <LanguageSwitch />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  PlusCircle,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Button } from "@/components/ui/Button";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[var(--color-background)]">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-[var(--color-card-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] transition-transform duration-200 ease-in-out",
          menuOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="border-b border-[var(--color-card-border)] p-4">
          <Link href="/profile" className="group flex flex-col gap-0.5 transition-opacity hover:opacity-90">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--color-accent)] transition-transform duration-200 group-hover:scale-105" />
              <span className="font-display text-sm font-bold">{t("app.name")}</span>
            </span>
            <span className="pl-7 text-[10px] font-medium uppercase tracking-widest text-[var(--color-muted)]">
              {t("app.tagline")}
            </span>
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
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[color-mix(in_srgb,var(--color-accent)_12%,white)] text-[var(--color-accent)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]"
                    : "text-[var(--color-muted)] hover:-translate-y-px hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)]"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start hover:text-[var(--color-danger)]"
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.signOut")}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-56">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-card-border)] bg-[color-mix(in_srgb,var(--color-background)_85%,white)] px-4 py-3 backdrop-blur-md md:justify-end md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <LanguageSwitch />
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

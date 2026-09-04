"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ACCOUNT_NAV, CASINO_NAV, LIBRARY_NAV, type NavItem } from "@/components/casino/nav-items";
import { Logo } from "@/components/casino/logo";
import { TopUpButton } from "@/components/wallet/top-up-button";
import { Badge } from "@/components/ui/badge";
import { useCasino } from "@/store/casino";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  onNavigate,
  count,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  count?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 -z-10 rounded-xl border border-primary/30 bg-primary/[0.14]"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon
        className={cn(
          "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
          active ? "text-primary" : "",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <Badge variant="danger" className="px-1.5 py-0 text-[9px]">
          {item.badge}
        </Badge>
      )}
      {typeof count === "number" && count > 0 && (
        <span className="tabular rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const favorites = useCasino((state) => state.favorites);
  const recent = useCasino((state) => state.recent);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <Section title="Casino">
          {CASINO_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </Section>

        <Section title="Deine Spiele">
          {LIBRARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
              count={item.href.includes("favorites") ? favorites.length : recent.length}
            />
          ))}
        </Section>

        <Section title="Konto">
          {ACCOUNT_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </Section>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <TopUpButton className="w-full" size="sm" label="Guthaben auffüllen" />
        <p className="mt-2.5 text-center text-[10px] leading-relaxed text-muted-foreground/70">
          Virtual demo currency only. No deposits, withdrawals or real-money prizes.
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.06] bg-surface/80 backdrop-blur-xl lg:block">
      <SidebarContent />
    </aside>
  );
}

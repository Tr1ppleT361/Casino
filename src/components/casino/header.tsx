"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  Volume2,
  VolumeX,
  Wallet,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "@/components/casino/sidebar";
import { SearchCommand } from "@/components/casino/search-command";
import { Avatar } from "@/components/casino/avatar";
import { Logo } from "@/components/casino/logo";
import { BalanceDisplay } from "@/components/wallet/balance-display";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { useSettings } from "@/store/settings";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";
import { toast } from "@/store/toast";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const username = useSettings((state) => state.username);
  const avatar = useSettings((state) => state.avatar);
  const sound = useSettings((state) => state.sound);
  const toggle = useSettings((state) => state.toggle);
  const resetAll = useCasino((state) => state.resetAll);
  const hydrated = useHydrated();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="lg:hidden">
          <Logo compact />
        </div>

        <SearchCommand className="ml-auto lg:ml-0 lg:w-64" />

        <div className="ml-auto flex items-center gap-2">
          <BalanceDisplay className="hidden sm:flex" />
          <CurrencySelector />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggle("sound")}
            aria-label={sound ? "Ton ausschalten" : "Ton einschalten"}
            title={sound ? "Ton aus" : "Ton an"}
          >
            {hydrated && !sound ? (
              <VolumeX className="h-4.5 w-4.5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4.5 w-4.5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Profilmenü"
            >
              <Avatar avatar={avatar} size={36} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="normal-case">
                <span className="flex items-center gap-2.5 py-1">
                  <Avatar avatar={avatar} size={34} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-foreground">
                      {hydrated ? username : "DemoPlayer"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                      Demo-Konto
                    </span>
                  </span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/wallet">
                  <Wallet className="h-4 w-4" /> Demo-Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <BarChart3 className="h-4 w-4" /> Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="h-4 w-4" /> Profil &amp; Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/fairness">
                  <ShieldCheck className="h-4 w-4" /> Fairness
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => {
                  resetAll();
                  toast("Demo-Konto zurückgesetzt", {
                    description: "Guthaben, Historie und Statistiken sind neu.",
                    variant: "danger",
                  });
                }}
              >
                <LogOut className="h-4 w-4" /> Demo-Konto zurücksetzen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-white/[0.05] px-3 py-2 sm:hidden">
        <BalanceDisplay className="w-full justify-center" />
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          hideClose
          className="left-0 top-0 h-[100dvh] max-w-[17rem] translate-x-0 translate-y-0 rounded-none rounded-r-2xl p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}

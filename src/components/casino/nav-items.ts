import {
  BarChart3,
  Bomb,
  CircleDollarSign,
  Clock3,
  Dices,
  Gem,
  Home,
  Rocket,
  ScrollText,
  ShieldCheck,
  Spade,
  Sparkles,
  Star,
  User,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: string;
}

export const CASINO_NAV: NavItem[] = [
  { href: "/", label: "Lobby", icon: Home },
  { href: "/game/crash", label: "Crash", icon: Rocket, badge: "HOT" },
  { href: "/category/originals", label: "Originals", icon: Sparkles },
  { href: "/category/slots", label: "Slots", icon: Gem },
  { href: "/category/blackjack", label: "Table Games", icon: Spade },
  { href: "/category/dice", label: "Dice & Limbo", icon: Dices },
  { href: "/category/mines", label: "Mines", icon: Bomb },
];

export const LIBRARY_NAV: NavItem[] = [
  { href: "/category/favorites", label: "Favorites", icon: Star },
  { href: "/category/recent", label: "Recently Played", icon: Clock3 },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/wallet", label: "Demo-Wallet", icon: Wallet },
  { href: "/history", label: "Historie", icon: ScrollText },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/fairness", label: "Fairness", icon: ShieldCheck },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Lobby", icon: Home },
  { href: "/category/originals", label: "Originals", icon: Sparkles },
  { href: "/game/crash", label: "Crash", icon: Rocket },
  { href: "/wallet", label: "Wallet", icon: CircleDollarSign },
  { href: "/profile", label: "Profil", icon: User },
];

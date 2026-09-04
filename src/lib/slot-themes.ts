import type { SlotTheme } from "@/lib/slots";

/**
 * Six original demo machines. Every symbol is an emoji glyph over a generated
 * gradient - no licensed artwork, no real-world slot brands.
 */
export const SLOT_THEMES: SlotTheme[] = [
  {
    slug: "neon-fruits",
    name: "Neon Fruits",
    subtitle: "Klassische Früchte in Neonlicht",
    background:
      "radial-gradient(70% 70% at 50% 0%, hsl(320 90% 40% / 0.35), transparent 70%), linear-gradient(180deg, hsl(280 40% 12%), hsl(240 26% 6%))",
    symbols: [
      { id: "cherry", glyph: "🍒", tier: "low", color: "hsl(356 82% 58%)" },
      { id: "lemon", glyph: "🍋", tier: "low", color: "hsl(52 96% 58%)" },
      { id: "plum", glyph: "🫐", tier: "low", color: "hsl(265 80% 62%)" },
      { id: "melon", glyph: "🍉", tier: "low", color: "hsl(152 72% 45%)" },
      { id: "grape", glyph: "🍇", tier: "mid", color: "hsl(280 80% 62%)" },
      { id: "bell", glyph: "🔔", tier: "mid", color: "hsl(44 96% 58%)" },
      { id: "seven", glyph: "7️⃣", tier: "high", color: "hsl(20 90% 55%)" },
      { id: "bar", glyph: "🟨", tier: "high", color: "hsl(44 96% 50%)" },
      { id: "wild", glyph: "🌟", tier: "wild", color: "hsl(44 96% 58%)" },
      { id: "scatter", glyph: "💠", tier: "scatter", color: "hsl(190 95% 55%)" },
    ],
  },
  {
    slug: "golden-vault",
    name: "Golden Vault",
    subtitle: "Knacke den Tresor",
    background:
      "radial-gradient(70% 70% at 50% 0%, hsl(44 90% 40% / 0.35), transparent 70%), linear-gradient(180deg, hsl(30 40% 12%), hsl(240 26% 6%))",
    symbols: [
      { id: "coin", glyph: "🪙", tier: "low", color: "hsl(44 96% 58%)" },
      { id: "key", glyph: "🗝️", tier: "low", color: "hsl(38 80% 55%)" },
      { id: "lock", glyph: "🔒", tier: "low", color: "hsl(220 20% 65%)" },
      { id: "bag", glyph: "💰", tier: "low", color: "hsl(44 90% 52%)" },
      { id: "bars", glyph: "🧱", tier: "mid", color: "hsl(30 70% 50%)" },
      { id: "gem", glyph: "💎", tier: "mid", color: "hsl(190 95% 55%)" },
      { id: "vault", glyph: "🔐", tier: "high", color: "hsl(44 96% 58%)" },
      { id: "crown", glyph: "👑", tier: "high", color: "hsl(38 96% 55%)" },
      { id: "wild", glyph: "🌟", tier: "wild", color: "hsl(44 96% 58%)" },
      { id: "scatter", glyph: "🧨", tier: "scatter", color: "hsl(356 82% 58%)" },
    ],
  },
  {
    slug: "cyber-gems",
    name: "Cyber Gems",
    subtitle: "Edelsteine aus dem Grid",
    background:
      "radial-gradient(70% 70% at 50% 0%, hsl(190 90% 40% / 0.35), transparent 70%), linear-gradient(180deg, hsl(220 50% 12%), hsl(240 26% 6%))",
    symbols: [
      { id: "chip", glyph: "🔷", tier: "low", color: "hsl(205 95% 62%)" },
      { id: "node", glyph: "🔶", tier: "low", color: "hsl(30 95% 58%)" },
      { id: "core", glyph: "🟣", tier: "low", color: "hsl(280 90% 65%)" },
      { id: "pulse", glyph: "🟢", tier: "low", color: "hsl(152 72% 45%)" },
      { id: "shard", glyph: "🔺", tier: "mid", color: "hsl(356 82% 58%)" },
      { id: "prism", glyph: "🟦", tier: "mid", color: "hsl(190 95% 55%)" },
      { id: "gem", glyph: "💎", tier: "high", color: "hsl(190 95% 62%)" },
      { id: "matrix", glyph: "🧿", tier: "high", color: "hsl(265 90% 65%)" },
      { id: "wild", glyph: "⚡", tier: "wild", color: "hsl(52 96% 58%)" },
      { id: "scatter", glyph: "🛰️", tier: "scatter", color: "hsl(190 95% 55%)" },
    ],
  },
  {
    slug: "lucky-sevens",
    name: "Lucky Sevens",
    subtitle: "Retro-Walzen, große Sevens",
    background:
      "radial-gradient(70% 70% at 50% 0%, hsl(356 80% 40% / 0.35), transparent 70%), linear-gradient(180deg, hsl(0 40% 12%), hsl(240 26% 6%))",
    symbols: [
      { id: "cherry", glyph: "🍒", tier: "low", color: "hsl(356 82% 58%)" },
      { id: "clover", glyph: "🍀", tier: "low", color: "hsl(152 72% 45%)" },
      { id: "horseshoe", glyph: "🧲", tier: "low", color: "hsl(220 20% 65%)" },
      { id: "dice", glyph: "🎲", tier: "low", color: "hsl(0 0% 92%)" },
      { id: "bell", glyph: "🔔", tier: "mid", color: "hsl(44 96% 58%)" },
      { id: "star", glyph: "⭐", tier: "mid", color: "hsl(52 96% 58%)" },
      { id: "seven", glyph: "7️⃣", tier: "high", color: "hsl(356 82% 58%)" },
      { id: "jackpot", glyph: "🎰", tier: "high", color: "hsl(44 96% 58%)" },
      { id: "wild", glyph: "🃏", tier: "wild", color: "hsl(265 90% 65%)" },
      { id: "scatter", glyph: "💫", tier: "scatter", color: "hsl(190 95% 55%)" },
    ],
  },
  {
    slug: "space-riches",
    name: "Space Riches",
    subtitle: "Reichtum im Orbit",
    background:
      "radial-gradient(70% 70% at 50% 0%, hsl(265 90% 40% / 0.4), transparent 70%), linear-gradient(180deg, hsl(245 55% 10%), hsl(240 30% 4%))",
    symbols: [
      { id: "star", glyph: "✨", tier: "low", color: "hsl(52 96% 58%)" },
      { id: "moon", glyph: "🌙", tier: "low", color: "hsl(220 30% 78%)" },
      { id: "comet", glyph: "☄️", tier: "low", color: "hsl(20 90% 55%)" },
      { id: "orbit", glyph: "🪐", tier: "low", color: "hsl(38 80% 58%)" },
      { id: "astro", glyph: "👨‍🚀", tier: "mid", color: "hsl(205 95% 62%)" },
      { id: "rocket", glyph: "🚀", tier: "mid", color: "hsl(356 82% 58%)" },
      { id: "ufo", glyph: "🛸", tier: "high", color: "hsl(152 72% 45%)" },
      { id: "galaxy", glyph: "🌌", tier: "high", color: "hsl(265 90% 65%)" },
      { id: "wild", glyph: "🌟", tier: "wild", color: "hsl(44 96% 58%)" },
      { id: "scatter", glyph: "🌠", tier: "scatter", color: "hsl(190 95% 55%)" },
    ],
  },
  {
    slug: "diamond-empire",
    name: "Diamond Empire",
    subtitle: "Hochkarätige Walzen",
    background:
      "radial-gradient(70% 70% at 50% 0%, hsl(205 90% 40% / 0.35), transparent 70%), linear-gradient(180deg, hsl(225 45% 12%), hsl(240 26% 6%))",
    symbols: [
      { id: "spade", glyph: "♠️", tier: "low", color: "hsl(0 0% 92%)" },
      { id: "heart", glyph: "♥️", tier: "low", color: "hsl(356 82% 58%)" },
      { id: "club", glyph: "♣️", tier: "low", color: "hsl(0 0% 92%)" },
      { id: "diamondSuit", glyph: "♦️", tier: "low", color: "hsl(356 82% 58%)" },
      { id: "ring", glyph: "💍", tier: "mid", color: "hsl(205 95% 72%)" },
      { id: "gold", glyph: "🥇", tier: "mid", color: "hsl(44 96% 58%)" },
      { id: "diamond", glyph: "💎", tier: "high", color: "hsl(205 95% 68%)" },
      { id: "crown", glyph: "👑", tier: "high", color: "hsl(44 96% 58%)" },
      { id: "wild", glyph: "🤴", tier: "wild", color: "hsl(280 90% 65%)" },
      { id: "scatter", glyph: "🏛️", tier: "scatter", color: "hsl(190 95% 55%)" },
    ],
  },
];

export const SLOT_THEME_BY_SLUG = new Map(
  SLOT_THEMES.map((theme) => [theme.slug, theme]),
);

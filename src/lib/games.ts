import type { GameCategory, GameDefinition } from "@/types";

/**
 * Central game registry. The lobby, the sidebar, the search and the
 * `/game/[slug]` route all read from here, so adding a game means adding one
 * entry plus its component in `components/games`.
 */
export const GAMES: GameDefinition[] = [
  {
    slug: "crash",
    name: "Crash",
    tagline: "Cash out bevor die Kurve bricht",
    categories: ["popular", "originals", "crash"],
    art: { from: "265 90% 62%", to: "320 90% 55%", glyph: "🚀", pattern: "waves" },
    rtp: 99,
    maxWin: "1.000x",
    featured: true,
  },
  {
    slug: "mines",
    name: "Mines",
    tagline: "Felder aufdecken, Minen meiden",
    categories: ["popular", "originals", "mines"],
    art: { from: "356 82% 58%", to: "20 90% 55%", glyph: "💣", pattern: "grid" },
    rtp: 99,
    maxWin: "24.750x",
    featured: true,
  },
  {
    slug: "plinko",
    name: "Plinko",
    tagline: "Der Ball entscheidet",
    categories: ["popular", "originals", "plinko"],
    art: { from: "190 95% 55%", to: "265 90% 62%", glyph: "🔻", pattern: "bubbles" },
    rtp: 99,
    maxWin: "1.000x",
    featured: true,
  },
  {
    slug: "dice",
    name: "Dice",
    tagline: "Roll over oder roll under",
    categories: ["popular", "originals", "dice"],
    art: { from: "152 72% 45%", to: "190 95% 55%", glyph: "🎲", pattern: "diamonds" },
    rtp: 99,
    maxWin: "9.900x",
  },
  {
    slug: "limbo",
    name: "Limbo",
    tagline: "Wie hoch traust du dich?",
    categories: ["popular", "originals", "limbo"],
    art: { from: "44 96% 58%", to: "356 82% 58%", glyph: "📈", pattern: "rays" },
    rtp: 99,
    maxWin: "1.000.000x",
  },
  {
    slug: "wheel",
    name: "Wheel",
    tagline: "Dreh das Multiplikator-Rad",
    categories: ["popular", "originals", "wheel"],
    art: { from: "280 90% 65%", to: "190 95% 55%", glyph: "🎡", pattern: "rays" },
    rtp: 99,
    maxWin: "50x",
  },
  {
    slug: "towers",
    name: "Towers",
    tagline: "Ebene für Ebene nach oben",
    categories: ["originals", "towers"],
    art: { from: "205 95% 62%", to: "265 90% 62%", glyph: "🗼", pattern: "grid" },
    rtp: 99,
    maxWin: "2.500x",
  },
  {
    slug: "coinflip",
    name: "Coinflip",
    tagline: "Heads oder Tails, 50/50",
    categories: ["originals", "coinflip"],
    art: { from: "44 96% 58%", to: "38 95% 48%", glyph: "🪙", pattern: "bubbles" },
    rtp: 99,
    maxWin: "1,98x",
  },
  {
    slug: "blackjack",
    name: "Blackjack",
    tagline: "Schlag den Dealer auf 21",
    categories: ["popular", "blackjack"],
    art: { from: "152 72% 38%", to: "160 70% 24%", glyph: "🂡", pattern: "cards" },
    rtp: 99.5,
    maxWin: "3:2",
    featured: true,
  },
  {
    slug: "roulette",
    name: "Roulette",
    tagline: "Rot, Schwarz oder die eine Zahl",
    categories: ["popular", "roulette"],
    art: { from: "356 82% 50%", to: "240 30% 12%", glyph: "🎯", pattern: "rays" },
    rtp: 97.3,
    maxWin: "36x",
    featured: true,
  },
  {
    slug: "baccarat",
    name: "Baccarat",
    tagline: "Player, Banker oder Tie",
    categories: ["baccarat"],
    art: { from: "265 60% 40%", to: "240 40% 16%", glyph: "🂮", pattern: "cards" },
    rtp: 98.9,
    maxWin: "8x",
  },
  {
    slug: "neon-fruits",
    name: "Neon Fruits",
    tagline: "Klassische Früchte in Neon",
    categories: ["popular", "slots"],
    art: { from: "320 90% 60%", to: "190 95% 55%", glyph: "🍒", pattern: "bubbles" },
    rtp: 96.2,
    maxWin: "2.500x",
  },
  {
    slug: "golden-vault",
    name: "Golden Vault",
    tagline: "Knacke den Tresor",
    categories: ["popular", "slots"],
    art: { from: "44 96% 58%", to: "30 90% 42%", glyph: "🔐", pattern: "diamonds" },
    rtp: 96.5,
    maxWin: "5.000x",
    featured: true,
  },
  {
    slug: "cyber-gems",
    name: "Cyber Gems",
    tagline: "Edelsteine aus dem Grid",
    categories: ["slots"],
    art: { from: "190 95% 55%", to: "265 90% 62%", glyph: "💎", pattern: "grid" },
    rtp: 96.1,
    maxWin: "3.200x",
  },
  {
    slug: "lucky-sevens",
    name: "Lucky Sevens",
    tagline: "Retro-Walzen, große Sevens",
    categories: ["slots"],
    art: { from: "356 82% 58%", to: "44 96% 58%", glyph: "7️⃣", pattern: "rays" },
    rtp: 96.8,
    maxWin: "1.800x",
  },
  {
    slug: "space-riches",
    name: "Space Riches",
    tagline: "Reichtum im Orbit",
    categories: ["slots"],
    art: { from: "240 60% 30%", to: "280 90% 60%", glyph: "🛸", pattern: "waves" },
    rtp: 96.0,
    maxWin: "4.000x",
  },
  {
    slug: "diamond-empire",
    name: "Diamond Empire",
    tagline: "Hochkarätige Walzen",
    categories: ["slots"],
    art: { from: "205 95% 62%", to: "240 60% 30%", glyph: "👑", pattern: "diamonds" },
    rtp: 96.4,
    maxWin: "6.000x",
  },
];

export const GAME_BY_SLUG = new Map(GAMES.map((game) => [game.slug, game]));

export function getGame(slug: string): GameDefinition | undefined {
  return GAME_BY_SLUG.get(slug);
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  popular: "Popular",
  slots: "Slots",
  crash: "Crash",
  roulette: "Roulette",
  blackjack: "Blackjack",
  baccarat: "Baccarat",
  dice: "Dice",
  mines: "Mines",
  plinko: "Plinko",
  wheel: "Wheel",
  limbo: "Limbo",
  towers: "Towers",
  coinflip: "Coinflip",
  originals: "Originals",
  favorites: "Favorites",
  recent: "Recently Played",
};

/** Order used for the lobby category rail and the /category pages. */
export const CATEGORY_ORDER: GameCategory[] = [
  "popular",
  "originals",
  "slots",
  "crash",
  "mines",
  "plinko",
  "dice",
  "limbo",
  "wheel",
  "towers",
  "coinflip",
  "roulette",
  "blackjack",
  "baccarat",
  "favorites",
  "recent",
];

export function gamesInCategory(category: GameCategory): GameDefinition[] {
  return GAMES.filter((game) => game.categories.includes(category));
}

export function searchGames(query: string): GameDefinition[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return GAMES.filter(
    (game) =>
      game.name.toLowerCase().includes(needle) ||
      game.tagline.toLowerCase().includes(needle) ||
      game.categories.some((category) => category.includes(needle)),
  );
}

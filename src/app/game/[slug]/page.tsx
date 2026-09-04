import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameRenderer } from "@/components/games/game-registry";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return { title: "Spiel nicht gefunden" };
  return {
    title: game.name,
    description: `${game.tagline} — Demo-Spiel ohne Echtgeld. Virtual demo currency only.`,
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getGame(slug)) notFound();
  return <GameRenderer slug={slug} />;
}

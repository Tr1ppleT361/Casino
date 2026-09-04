import confetti from "canvas-confetti";

const GOLD = ["#facc15", "#fbbf24", "#f59e0b", "#fde68a"];
const NEON = ["#a855f7", "#22d3ee", "#facc15", "#34d399", "#f472b6"];

let lastBurst = 0;

/** Celebration burst for a decent demo win. */
export function celebrate(intensity: "small" | "big" | "huge" = "small") {
  if (typeof window === "undefined") return;

  // Guard against animation spam during auto-play / turbo spins.
  const now = Date.now();
  if (now - lastBurst < 450) return;
  lastBurst = now;

  const base = {
    disableForReducedMotion: true,
    zIndex: 200,
    colors: intensity === "small" ? GOLD : NEON,
  };

  if (intensity === "small") {
    void confetti({ ...base, particleCount: 60, spread: 62, origin: { y: 0.7 } });
    return;
  }

  if (intensity === "big") {
    void confetti({ ...base, particleCount: 140, spread: 92, origin: { y: 0.62 } });
    void confetti({
      ...base,
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
    });
    void confetti({
      ...base,
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
    });
    return;
  }

  const end = now + 1800;
  const frame = () => {
    void confetti({
      ...base,
      particleCount: 8,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.62 },
    });
    void confetti({
      ...base,
      particleCount: 8,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.62 },
    });
    void confetti({
      ...base,
      particleCount: 14,
      spread: 110,
      startVelocity: 45,
      origin: { y: 0.5 },
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

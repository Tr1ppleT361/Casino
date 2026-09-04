/**
 * Monte-Carlo RTP check for the slot engine.
 *
 * Run with `npm run simulate:slots`. It plays whole rounds - base spin plus any
 * free-spin session including retriggers - and reports the measured return per
 * unit staked, so the paytable can be tuned against real numbers instead of
 * guesswork.
 */
import {
  FREE_SPIN_MULTIPLIER,
  FREE_SPINS_AWARDED,
  buildStrip,
  evaluateSpin,
  spinGrid,
} from "../src/lib/slots";
import { SLOT_THEMES } from "../src/lib/slot-themes";
import { RoundRandom } from "../src/lib/rng";

const ROUNDS = Number(process.argv[2] ?? 400_000);

function simulate(clientSeed: string, themeIndex = 0) {
  const theme = SLOT_THEMES[themeIndex];
  const strip = buildStrip(theme);
  const random = new RoundRandom("simulation-server-seed", clientSeed, 0, 4096);

  let staked = 0;
  let returned = 0;
  let triggers = 0;
  let best = 0;

  for (let round = 0; round < ROUNDS; round++) {
    staked += 1;
    let roundReturn = 0;

    const base = evaluateSpin(spinGrid(random, strip));
    roundReturn += base.totalMultiplier;

    let freeSpins = base.freeSpinsWon;
    if (freeSpins > 0) triggers += 1;

    let guard = 0;
    while (freeSpins > 0 && guard++ < 500) {
      freeSpins -= 1;
      const free = evaluateSpin(spinGrid(random, strip));
      roundReturn += free.totalMultiplier * FREE_SPIN_MULTIPLIER;
      if (free.freeSpinsWon > 0) freeSpins += FREE_SPINS_AWARDED;
    }

    returned += roundReturn;
    best = Math.max(best, roundReturn);
  }

  return {
    theme: theme.name,
    rtp: (returned / staked) * 100,
    triggerRate: (triggers / ROUNDS) * 100,
    best,
  };
}

const BATCHES = Number(process.argv[3] ?? 6);
const runs = Array.from({ length: BATCHES }, (_, i) => simulate(`batch-${i}`));
const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const rtps = runs.map((run) => run.rtp);
console.log(`Rounds:        ${ROUNDS.toLocaleString("de-DE")} x ${BATCHES} Batches`);
console.log(`Theme:         ${runs[0].theme} (maths is shared by all themes)`);
console.log(`Measured RTP:  ${mean(rtps).toFixed(2)}%`);
console.log(`  per batch:   ${rtps.map((value) => value.toFixed(2)).join(", ")}`);
console.log(`Free spins:    ${mean(runs.map((run) => run.triggerRate)).toFixed(3)}% der Spins`);
console.log(`Best round:    ${Math.max(...runs.map((run) => run.best)).toFixed(2)}x total stake`);

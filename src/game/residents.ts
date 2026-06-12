// Residents — Greenwood's townsfolk, derived deterministically from the
// current plots so they never need saving: the same cottages always raise the
// same families, and workplaces are assigned in stable order.

import { mulberry32 } from './world';
import { randomAppearance, randomName } from './customization';
import type { PlayerAppearance, Plot } from './types';

export interface Resident {
  id: string;
  name: string;
  appearance: PlayerAppearance;
  home: { x: number; z: number };
  /** workplace position, or null when unemployed */
  work: { x: number; z: number } | null;
  workLabel: string | null;
  /** stable per-resident variation 0..1 */
  seed: number;
}

const WORKPLACES = ['grocery', 'sugarbowl', 'workshop', 'bank', 'hotel', 'cultural_hall'];

/** residents housed by a cottage at a given level */
export function cottageCapacity(level: number): number {
  return 1 + level; // lv1 → 2, lv2 → 3, lv3 → 4
}

/** worker slots offered by a business at a given level */
export function jobCapacity(level: number): number {
  return 2 * level;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deriveResidents(plots: Plot[]): Resident[] {
  const residents: Resident[] = [];
  for (const p of plots) {
    if (p.building !== 'cottage' || p.construction > 0) continue;
    const n = cottageCapacity(p.level);
    for (let i = 0; i < n; i++) {
      const rng = mulberry32(hashId(`${p.id}:${i}`));
      const appearance = randomAppearance(rng);
      residents.push({
        id: `${p.id}_${i}`,
        name: randomName(rng),
        appearance,
        home: { x: p.x, z: p.z },
        work: null,
        workLabel: null,
        seed: rng(),
      });
    }
  }

  // assign jobs round-robin across open businesses, stable order
  let cursor = 0;
  for (const p of plots) {
    if (!p.building || p.construction > 0 || !WORKPLACES.includes(p.building)) continue;
    let slots = jobCapacity(p.level);
    while (slots > 0 && cursor < residents.length) {
      residents[cursor].work = { x: p.x, z: p.z };
      residents[cursor].workLabel = p.building;
      cursor++;
      slots--;
    }
  }
  return residents;
}

export function employmentStats(residents: Resident[]) {
  const employed = residents.filter((r) => r.work !== null).length;
  return {
    population: residents.length,
    employed,
    employedRatio: residents.length === 0 ? 0 : employed / residents.length,
  };
}

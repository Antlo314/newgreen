// Character creation data for New Greenwood 3D.
// Palettes, hairstyles, callings, and era-appropriate name pools celebrating
// the Black community of 1920s Greenwood.

import type { CallingDef, HairStyle, HatStyle, AccessoryStyle, BodyBuild, PlayerAppearance } from './types';

export const SKIN_TONES: { name: string; color: string }[] = [
  { name: 'Deep Ebony', color: '#3a241b' },
  { name: 'Mahogany', color: '#4d2e1e' },
  { name: 'Cocoa', color: '#5d3a26' },
  { name: 'Chestnut', color: '#6b4430' },
  { name: 'Warm Umber', color: '#7a4a2b' },
  { name: 'Sienna', color: '#8a5736' },
  { name: 'Caramel', color: '#9c6b3f' },
  { name: 'Honey Bronze', color: '#ab7c4c' },
];

export const HAIR_STYLES: { id: HairStyle; name: string; icon: string }[] = [
  { id: 'fade', name: 'Low Fade', icon: '▬' },
  { id: 'afro', name: 'Afro', icon: '●' },
  { id: 'locs', name: 'Locs', icon: '☰' },
  { id: 'braids', name: 'Braids', icon: '≋' },
  { id: 'puffs', name: 'Afro Puffs', icon: '••' },
  { id: 'waves', name: 'Waves', icon: '〰' },
  { id: 'bald', name: 'Clean Shave', icon: '○' },
];

export const HAIR_COLORS: { name: string; color: string }[] = [
  { name: 'Jet Black', color: '#15100c' },
  { name: 'Soft Black', color: '#241a12' },
  { name: 'Dark Brown', color: '#3a2417' },
  { name: 'Auburn', color: '#5a2e1a' },
  { name: 'Henna', color: '#7a3b22' },
  { name: 'Silver Crown', color: '#b8b2a8' },
];

export const HAT_STYLES: { id: HatStyle; name: string; icon: string }[] = [
  { id: 'none', name: 'No Hat', icon: '—' },
  { id: 'cap', name: 'Newsboy Cap', icon: '◗' },
  { id: 'bowler', name: 'Bowler', icon: '◓' },
  { id: 'tophat', name: 'Top Hat', icon: '⬓' },
  { id: 'headwrap', name: 'Headwrap', icon: '◠' },
];

export const HAT_COLORS: { name: string; color: string }[] = [
  { name: 'Coal', color: '#1c1a18' },
  { name: 'Mustard Gold', color: '#c9a227' },
  { name: 'Clay Orange', color: '#c9622f' },
  { name: 'Forest', color: '#2d5a3d' },
  { name: 'Oxblood', color: '#6e2b2b' },
  { name: 'Royal Plum', color: '#4a2d6e' },
];

export const SHIRT_COLORS: { name: string; color: string }[] = [
  { name: 'Sunday Ivory', color: '#ece4d0' },
  { name: 'Greenwood Emerald', color: '#1f6f50' },
  { name: 'Brick Red', color: '#a83a42' },
  { name: 'Tailor Plum', color: '#5d3a8e' },
  { name: 'Porter Indigo', color: '#2b4a6f' },
  { name: 'Mustard Vest', color: '#b8862b' },
  { name: 'Dusty Rose', color: '#b06a72' },
  { name: 'Slate Gray', color: '#5a6068' },
];

export const PANTS_COLORS: { name: string; color: string }[] = [
  { name: 'Charcoal', color: '#33302c' },
  { name: 'Midnight', color: '#23262e' },
  { name: 'Walnut Brown', color: '#4a3526' },
  { name: 'Faded Denim', color: '#3d4d63' },
  { name: 'Olive Drab', color: '#4a4d32' },
  { name: 'Cream Linen', color: '#cdc2a5' },
];

export const ACCESSORIES: { id: AccessoryStyle; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '—' },
  { id: 'glasses', name: 'Spectacles', icon: 'oo' },
  { id: 'earrings', name: 'Gold Earrings', icon: '◦◦' },
  { id: 'bowtie', name: 'Bowtie', icon: '⋈' },
];

export const BUILDS: { id: BodyBuild; name: string; desc: string }[] = [
  { id: 'broad', name: 'Broad', desc: 'Sturdy frame, built for the worksite.' },
  { id: 'slender', name: 'Slender', desc: 'Light on your feet, quick through the plaza.' },
];

export const CALLINGS: CallingDef[] = [
  {
    id: 'carpenter',
    name: 'Carpenter',
    icon: '🪚',
    desc: 'Raised on sawdust and gospel. You can read a grain of pine like scripture.',
    bonusLabel: '+18 Lumber to start',
    bonus: { wood: 18 },
  },
  {
    id: 'mason',
    name: 'Stonemason',
    icon: '🧱',
    desc: 'Your hands learned stone in Alabama quarries. Walls you raise do not fall.',
    bonusLabel: '+18 Stone to start',
    bonus: { stone: 18 },
  },
  {
    id: 'merchant',
    name: 'Merchant',
    icon: '⚖️',
    desc: 'You kept the books for a general store and never lost a cent of anyone\'s trust.',
    bonusLabel: '+30 BSWX to start',
    bonus: { bswx: 30 },
  },
  {
    id: 'farmer',
    name: 'Farmer',
    icon: '🌾',
    desc: 'Sun-up to sun-down in the bottomland. The earth answers when you call.',
    bonusLabel: '+10 Lumber & +8 Clay to start',
    bonus: { wood: 10, clay: 8 },
  },
  {
    id: 'educator',
    name: 'Educator',
    icon: '📖',
    desc: 'You taught letters by lamplight. Folks already speak your name with respect.',
    bonusLabel: '+6 Reputation to start',
    bonus: { rep: 6 },
  },
  {
    id: 'nurse',
    name: 'Nurse',
    icon: '✚',
    desc: 'You tended a whole county through fever season without sitting down once.',
    bonusLabel: '+25 Max Stamina to start',
    bonus: { staminaMax: 25 },
  },
];

export const CALLING_BY_ID: Record<string, CallingDef> = Object.fromEntries(
  CALLINGS.map((c) => [c.id, c])
);

const FIRST_NAMES = [
  'Booker', 'Ada', 'Elijah', 'Mabel', 'Theodore', 'Ruby', 'Isaiah', 'Pearl',
  'Marcus', 'Viola', 'Solomon', 'Hattie', 'Amos', 'Cora', 'Ezekiel', 'Odessa',
  'Lena', 'Moses', 'Ida', 'Augustus', 'Bessie', 'Caleb', 'Zora', 'Langston',
  'Minnie', 'Silas', 'Geneva', 'Roscoe', 'Beulah', 'Percy',
];

const LAST_NAMES = [
  'Freeman', 'Banks', 'Washington', 'Wells', 'Carver', 'Tucker', 'Holloway',
  'Merriweather', 'Goodwin', 'Latimer', 'Bethune', 'Dubois', 'Granger',
  'Whitfield', 'Calloway', 'Pemberton', 'Abernathy', 'Vesey', 'Stokes', 'Mosely',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function randomAppearance(): PlayerAppearance {
  const hat = pick(HAT_STYLES).id;
  return {
    name: randomName(),
    calling: pick(CALLINGS).id,
    build: pick(BUILDS).id,
    skin: pick(SKIN_TONES).color,
    hair: pick(HAIR_STYLES).id,
    hairColor: pick(HAIR_COLORS).color,
    hat,
    hatColor: pick(HAT_COLORS).color,
    shirt: pick(SHIRT_COLORS).color,
    pants: pick(PANTS_COLORS).color,
    accessory: pick(ACCESSORIES).id,
  };
}

export const DEFAULT_APPEARANCE: PlayerAppearance = {
  name: 'Booker Freeman',
  calling: 'carpenter',
  build: 'broad',
  skin: '#7a4a2b',
  hair: 'fade',
  hairColor: '#15100c',
  hat: 'cap',
  hatColor: '#c9a227',
  shirt: '#1f6f50',
  pants: '#33302c',
  accessory: 'none',
};

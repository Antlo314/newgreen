// Emberwilds — character appearance model.
// Every visual option is an index into one of these palettes/lists, so a full
// character is just a small bag of integers — trivial to save, randomize, and
// feed to the procedural sprite renderer (see sprites.ts).

export interface Appearance {
  skin: number;
  hair: number; // style index into HAIR_STYLES
  hairColor: number;
  brow: number; // facial hair / brow style index
  top: number; // shirt color
  bottom: number; // pants color
  shoes: number;
  eyes: number;
  accessory: number; // hat / glasses style index into ACCESSORIES
  accessoryColor: number;
}

// Rich, deliberately broad skin range — honoring the same community the parent
// project celebrates, with lighter and fantasy tones included for full freedom.
export const SKIN_TONES: { name: string; hex: string }[] = [
  { name: 'Porcelain', hex: '#f6d3b0' },
  { name: 'Honey', hex: '#eab98a' },
  { name: 'Almond', hex: '#d99b6c' },
  { name: 'Caramel', hex: '#c07c4e' },
  { name: 'Umber', hex: '#a8633a' },
  { name: 'Chestnut', hex: '#8a4e2d' },
  { name: 'Mahogany', hex: '#6f3d22' },
  { name: 'Espresso', hex: '#522c18' },
  { name: 'Onyx', hex: '#3a2012' },
  { name: 'Olive', hex: '#c8a878' },
  { name: 'Rose', hex: '#f0c0a8' },
  { name: 'Moss Folk', hex: '#9fb87a' },
];

export const HAIR_STYLES: { id: string; name: string }[] = [
  { id: 'bald', name: 'Bald' },
  { id: 'short', name: 'Short' },
  { id: 'afro', name: 'Afro' },
  { id: 'puffs', name: 'Puffs' },
  { id: 'locs', name: 'Locs' },
  { id: 'braids', name: 'Cornrows' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'bun', name: 'Top Bun' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'long', name: 'Long' },
  { id: 'flattop', name: 'High-Top' },
  { id: 'curls', name: 'Curls' },
];

export const HAIR_COLORS: { name: string; hex: string }[] = [
  { name: 'Jet Black', hex: '#1b1b22' },
  { name: 'Soft Black', hex: '#2c2630' },
  { name: 'Dark Brown', hex: '#3e2a1c' },
  { name: 'Brown', hex: '#5a3a24' },
  { name: 'Auburn', hex: '#7a3b22' },
  { name: 'Chestnut', hex: '#8a5a32' },
  { name: 'Honey Blonde', hex: '#c79a4e' },
  { name: 'Platinum', hex: '#e8e0c8' },
  { name: 'Silver', hex: '#b9bcc4' },
  { name: 'Crimson', hex: '#a3262c' },
  { name: 'Teal', hex: '#1f8a82' },
  { name: 'Violet', hex: '#6e3aa0' },
  { name: 'Rose', hex: '#d05a86' },
  { name: 'Cobalt', hex: '#2f57b5' },
];

// Brow / facial-hair pass (subtle but adds a lot of identity).
export const BROWS: { id: string; name: string }[] = [
  { id: 'plain', name: 'Clean' },
  { id: 'stubble', name: 'Stubble' },
  { id: 'goatee', name: 'Goatee' },
  { id: 'full', name: 'Full Beard' },
  { id: 'mustache', name: 'Mustache' },
];

export const TOP_COLORS: { name: string; hex: string }[] = [
  { name: 'Ember', hex: '#e0712f' },
  { name: 'Crimson', hex: '#b83232' },
  { name: 'Rose', hex: '#d96a86' },
  { name: 'Gold', hex: '#d9a93a' },
  { name: 'Leaf', hex: '#4e9a4a' },
  { name: 'Forest', hex: '#2f6b46' },
  { name: 'Teal', hex: '#2a9d8f' },
  { name: 'Sky', hex: '#4a8fd0' },
  { name: 'Royal', hex: '#3a4fb0' },
  { name: 'Plum', hex: '#7a4596' },
  { name: 'Slate', hex: '#566073' },
  { name: 'Cream', hex: '#e8dcc0' },
  { name: 'Charcoal', hex: '#33333d' },
  { name: 'Kente Gold', hex: '#f2c14e' },
];

export const BOTTOM_COLORS: { name: string; hex: string }[] = [
  { name: 'Denim', hex: '#3a5277' },
  { name: 'Indigo', hex: '#2c3566' },
  { name: 'Walnut', hex: '#5a3f2a' },
  { name: 'Khaki', hex: '#a8915e' },
  { name: 'Olive', hex: '#5e6b35' },
  { name: 'Wine', hex: '#5e2a36' },
  { name: 'Slate', hex: '#414a59' },
  { name: 'Charcoal', hex: '#2b2b33' },
  { name: 'Forest', hex: '#2f5638' },
  { name: 'Sand', hex: '#c4a878' },
];

export const SHOE_COLORS: { name: string; hex: string }[] = [
  { name: 'Leather', hex: '#4a3120' },
  { name: 'Black', hex: '#26262e' },
  { name: 'Tan', hex: '#8a6a44' },
  { name: 'Oxblood', hex: '#5a2326' },
  { name: 'Forest', hex: '#2e4a32' },
  { name: 'Ash', hex: '#6a6a74' },
];

export const EYE_COLORS: { name: string; hex: string }[] = [
  { name: 'Brown', hex: '#4a2c18' },
  { name: 'Dark', hex: '#2a1c14' },
  { name: 'Hazel', hex: '#7a5a2a' },
  { name: 'Amber', hex: '#a5702a' },
  { name: 'Green', hex: '#2f7a4a' },
  { name: 'Blue', hex: '#2f6aa5' },
  { name: 'Grey', hex: '#5a6470' },
  { name: 'Violet', hex: '#6e3aa0' },
];

export const ACCESSORIES: { id: string; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'straw', name: 'Straw Hat' },
  { id: 'cap', name: 'Cap' },
  { id: 'beanie', name: 'Beanie' },
  { id: 'headband', name: 'Headband' },
  { id: 'glasses', name: 'Glasses' },
  { id: 'flowercrown', name: 'Flower Crown' },
  { id: 'bandana', name: 'Bandana' },
  { id: 'wizard', name: 'Pointed Hat' },
  { id: 'crown', name: 'Circlet' },
];

export const ACCESSORY_COLORS: { name: string; hex: string }[] = [
  { name: 'Straw', hex: '#d9b463' },
  { name: 'Red', hex: '#c23a3a' },
  { name: 'Blue', hex: '#3a6ec2' },
  { name: 'Green', hex: '#3a9a52' },
  { name: 'Purple', hex: '#7a3aa0' },
  { name: 'Black', hex: '#2a2a32' },
  { name: 'White', hex: '#ecebe4' },
  { name: 'Gold', hex: '#e6bd4a' },
  { name: 'Teal', hex: '#2aa090' },
  { name: 'Rose', hex: '#d96a86' },
];

export const DEFAULT_APPEARANCE: Appearance = {
  skin: 5,
  hair: 2,
  hairColor: 0,
  brow: 0,
  top: 0,
  bottom: 0,
  shoes: 0,
  eyes: 0,
  accessory: 0,
  accessoryColor: 0,
};

export function randomAppearance(rand: () => number = Math.random): Appearance {
  const pick = (n: number) => Math.floor(rand() * n);
  return {
    skin: pick(SKIN_TONES.length),
    hair: pick(HAIR_STYLES.length),
    hairColor: pick(HAIR_COLORS.length),
    brow: rand() < 0.7 ? 0 : pick(BROWS.length),
    top: pick(TOP_COLORS.length),
    bottom: pick(BOTTOM_COLORS.length),
    shoes: pick(SHOE_COLORS.length),
    eyes: pick(EYE_COLORS.length),
    accessory: rand() < 0.45 ? pick(ACCESSORIES.length) : 0,
    accessoryColor: pick(ACCESSORY_COLORS.length),
  };
}

/** Clamp a possibly-stale saved appearance back into valid index ranges. */
export function sanitizeAppearance(a: Partial<Appearance> | null | undefined): Appearance {
  const c = (v: unknown, n: number, d: number) => {
    const i = Math.floor(Number(v));
    return Number.isFinite(i) && i >= 0 && i < n ? i : d;
  };
  const d = DEFAULT_APPEARANCE;
  return {
    skin: c(a?.skin, SKIN_TONES.length, d.skin),
    hair: c(a?.hair, HAIR_STYLES.length, d.hair),
    hairColor: c(a?.hairColor, HAIR_COLORS.length, d.hairColor),
    brow: c(a?.brow, BROWS.length, d.brow),
    top: c(a?.top, TOP_COLORS.length, d.top),
    bottom: c(a?.bottom, BOTTOM_COLORS.length, d.bottom),
    shoes: c(a?.shoes, SHOE_COLORS.length, d.shoes),
    eyes: c(a?.eyes, EYE_COLORS.length, d.eyes),
    accessory: c(a?.accessory, ACCESSORIES.length, d.accessory),
    accessoryColor: c(a?.accessoryColor, ACCESSORY_COLORS.length, d.accessoryColor),
  };
}

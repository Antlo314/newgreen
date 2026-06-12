import type { BuildingConfig, BuildingId, NPCDef, QuestDef } from './types';

// ---------------------------------------------------------------------------
// BUILDINGS
// ---------------------------------------------------------------------------

export const BUILDINGS: Record<BuildingId, BuildingConfig> = {
  cottage: {
    id: 'cottage',
    name: 'Family Cottage',
    desc: 'A warm home for Greenwood families. Each cottage boosts ALL business income by +10%.',
    cost: { wood: 25, stone: 10 },
    income: 0,
    repReward: 6,
    xpReward: 20,
    repRequired: 0,
    footprint: 2.6,
  },
  grocery: {
    id: 'grocery',
    name: 'Greenwood Grocery',
    desc: 'Fresh cooperative food for the community. Steady, reliable income.',
    cost: { wood: 30, stone: 15 },
    income: 3,
    repReward: 10,
    xpReward: 30,
    repRequired: 0,
    footprint: 3,
  },
  sugarbowl: {
    id: 'sugarbowl',
    name: 'Williams Sugar Bowl',
    desc: 'A vibrant sweetshop fueling communal joy — and a healthy profit.',
    cost: { wood: 45, stone: 25, bswx: 20 },
    income: 6,
    repReward: 16,
    xpReward: 40,
    repRequired: 20,
    footprint: 3,
  },
  workshop: {
    id: 'workshop',
    name: "Crafts & Trades Workshop",
    desc: 'Skilled hands at work. Generates income and honors craft traditions.',
    cost: { wood: 60, stone: 30, clay: 10 },
    income: 8,
    repReward: 20,
    xpReward: 50,
    repRequired: 35,
    footprint: 3.2,
  },
  bank: {
    id: 'bank',
    name: 'Strap & Lock Safe Bank',
    desc: 'A secure repository of community wealth. Strong income, stronger trust.',
    cost: { wood: 70, stone: 60, bswx: 80 },
    income: 14,
    repReward: 30,
    xpReward: 70,
    repRequired: 50,
    questRequired: 'ledger_grows',
    footprint: 3.4,
  },
  hotel: {
    id: 'hotel',
    name: 'Stradford Grand Hotel',
    desc: '54 modern luxury suites — the landmark hospitality haven of Greenwood.',
    cost: { wood: 110, stone: 90, clay: 20, bswx: 150 },
    income: 24,
    repReward: 50,
    xpReward: 100,
    repRequired: 90,
    questRequired: 'banking_tomorrow',
    footprint: 3.8,
  },
  cultural_hall: {
    id: 'cultural_hall',
    name: 'Legacy Cultural Hall',
    desc: 'A grand assembly dedicated to sovereign cultural education. The heart of New Greenwood.',
    cost: { wood: 150, stone: 140, clay: 40, bswx: 250 },
    income: 30,
    repReward: 100,
    xpReward: 160,
    repRequired: 140,
    questRequired: 'banking_tomorrow',
    footprint: 4.2,
  },
  garden: {
    id: 'garden',
    name: 'Community Garden',
    desc: 'A green commons. Each garden adds +8 reputation and +5% income to everything.',
    cost: { wood: 20, stone: 5, clay: 5 },
    income: 1,
    repReward: 8,
    xpReward: 25,
    repRequired: 10,
    footprint: 2.6,
  },
};

export const UPGRADE_COST_MULT = 1.7;
export const MAX_BUILDING_LEVEL = 3;
export const COTTAGE_INCOME_BONUS = 0.1;
export const GARDEN_INCOME_BONUS = 0.05;

// ---------------------------------------------------------------------------
// NPCS
// ---------------------------------------------------------------------------

export const NPCS: NPCDef[] = [
  {
    id: 'gurley',
    name: 'O.W. Gurley',
    title: 'Founder & Visionary',
    x: 2,
    z: -3,
    color: '#8d5524',
    hat: 'tophat',
    bio: 'Purchased 40 acres in 1906, dedicating it to Black business empowerment.',
    gossip: [
      'I purchased 40 acres of land in 1906, explicitly dedicating it to Black business empowerment.',
      'Greenwood is a self-sufficient ecosystem — our own banks, groceries, and cafes, all cooperative.',
      'Family cottages strengthen every business in town. Homes first, then commerce thrives.',
      'The northern pines grow back quickly. Harvest with a steady rhythm and the forest provides forever.',
    ],
  },
  {
    id: 'rector',
    name: 'Sarah Rector',
    title: 'Oil Heiress & Investor',
    x: 14,
    z: 9,
    color: '#5d4037',
    hat: 'headwrap',
    bio: 'Her Creek Nation land allotment produced 2,500 barrels of oil daily.',
    gossip: [
      'In Taft, Oklahoma, my Creek Nation land allotment began producing 2,500 barrels of oil daily!',
      'I was declared one of the wealthiest of our era at age twelve. Wealth is a tool — use it well.',
      'The riverbank clay south of town is rich and red. Buildings made with it stand for generations.',
      'Watch the ledger, not the crowd. Steady income beats a loud promise every time.',
    ],
  },
  {
    id: 'stradford',
    name: 'J.B. Stradford',
    title: 'Hotelier & Advocate',
    x: -13,
    z: 8,
    color: '#3e2723',
    hat: 'bowler',
    bio: 'Built the famed Stradford Hotel — 54 luxury suites of Black excellence.',
    gossip: [
      'Pooling our resources is the ultimate path to complete financial freedom.',
      'The Stradford Hotel had 54 modern suites, a dining hall, and a fine pool parlor. We will build it again.',
      'Every family deserves a roof of their own. Cottages are the bedrock of this community.',
      'Quarry stone east of the river is dense and true. Worth every swing of the pick.',
    ],
  },
  {
    id: 'gerumba',
    name: 'Pharoah Gerumba',
    title: 'Keeper of Legacies',
    x: -4,
    z: 16,
    color: '#4e342e',
    hat: 'crown',
    bio: 'Holds the interwoven indigenous and sovereign Black legacies of this land.',
    gossip: [
      'This land holds indigenous and sovereign Black legacies, interwoven on Creek territory.',
      'Vernon AME and Mount Zion were built through community dime drives and cooperative hands.',
      'The stars favor Greenwood tonight. Walk the streets after dusk and feel the lamplight warm.',
      'A community garden feeds more than bodies — it feeds belonging.',
    ],
  },
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n]));

// ---------------------------------------------------------------------------
// QUESTS
// ---------------------------------------------------------------------------

export const QUESTS: QuestDef[] = [
  {
    id: 'first_foundations',
    title: 'First Foundations',
    giver: 'gurley',
    line: 'main',
    intro: [
      'Welcome to New Greenwood, friend. I bought this land so we could build something that belongs to US.',
      'But vision needs timber and stone. The pine forest lies north, the quarry across the river to the east.',
      'Bring me 20 lumber and 10 stone, and we will lay the first foundations together.',
    ],
    outro: [
      'Fine work! Feel that? That is the weight of a beginning.',
      'Take this seed money — and claim a plot. Greenwood rises one storefront at a time.',
    ],
    objectives: [
      { kind: 'gather', target: 'wood', amount: 20, label: 'Gather 20 Lumber' },
      { kind: 'gather', target: 'stone', amount: 10, label: 'Gather 10 Stone' },
    ],
    rewards: { bswx: 40, rep: 10, xp: 60, text: 'Build plots unlocked' },
  },
  {
    id: 'open_for_business',
    title: 'Open for Business',
    giver: 'gurley',
    line: 'main',
    requires: 'first_foundations',
    intro: [
      'A community that feeds itself cannot be starved out. Our first business must be a grocery.',
      'Find an open plot near the plaza — the golden markers — and raise the Greenwood Grocery.',
    ],
    outro: [
      'The shelves are stocked and the doors are open! Every coin spent here stays here.',
      'This is how a dollar circulates thirty-six times before it leaves Greenwood.',
    ],
    objectives: [{ kind: 'build', target: 'grocery', amount: 1, label: 'Build the Greenwood Grocery' }],
    rewards: { bswx: 30, rep: 15, xp: 80, wood: 15 },
  },
  {
    id: 'ledger_grows',
    title: 'The Ledger Grows',
    giver: 'rector',
    line: 'main',
    requires: 'open_for_business',
    intro: [
      'So you are the builder Gurley speaks of. Buildings are fine — but do you understand MONEY?',
      'Income must flow like oil from a well. Show me you can earn 120 BSWX from your enterprises and trades.',
    ],
    outro: [
      'Now THAT is a ledger worth reading. You have the instinct.',
      'Word of your acumen will reach the bank charter committee. Expect good news.',
    ],
    objectives: [{ kind: 'earn', amount: 120, label: 'Earn 120 BSWX (income & rewards)' }],
    rewards: { bswx: 60, rep: 20, xp: 100, text: 'Bank unlocked' },
  },
  {
    id: 'banking_tomorrow',
    title: 'Banking on Tomorrow',
    giver: 'rector',
    line: 'main',
    requires: 'ledger_grows',
    intro: [
      'A community without its own bank is a community renting its future.',
      'Raise the Strap & Lock Safe Bank, and grow your standing — 60 reputation, so depositors trust the vault.',
    ],
    outro: [
      'The vault door closes with a sound like thunder. Our wealth is OURS to keep now.',
      'The grandest works are unlocked to you: the hotel, and the Cultural Hall itself.',
    ],
    objectives: [
      { kind: 'build', target: 'bank', amount: 1, label: 'Build the Strap & Lock Safe Bank' },
      { kind: 'reputation', amount: 60, label: 'Reach 60 Reputation' },
    ],
    rewards: { bswx: 100, rep: 30, xp: 140, staminaMax: 20, text: 'Hotel & Cultural Hall unlocked' },
  },
  {
    id: 'legacy_restored',
    title: 'A Legacy Restored',
    giver: 'gerumba',
    line: 'main',
    requires: 'banking_tomorrow',
    intro: [
      'You have built wealth. Now build MEMORY. A people who forget are easily scattered.',
      'Raise the Legacy Cultural Hall in the plaza, so every child knows whose shoulders they stand on.',
    ],
    outro: [
      'The hall doors open and the drums speak. Greenwood is not just rebuilt — it is REBORN.',
      'You carry the legacy now, builder. Carry it far.',
    ],
    objectives: [{ kind: 'build', target: 'cultural_hall', amount: 1, label: 'Build the Legacy Cultural Hall' }],
    rewards: { bswx: 300, rep: 100, xp: 300, staminaMax: 20, text: 'Greenwood Reborn — main story complete!' },
  },
  // ---- side quests ----
  {
    id: 'clay_of_the_creek',
    title: 'Clay of the Creek',
    giver: 'rector',
    line: 'side',
    intro: [
      'The riverbank south of the plaza hides rich red clay — the same earth my fortune rose from.',
      'Bring me 15 clay and I will teach you what land is truly worth.',
    ],
    outro: [
      'Good red clay, well dug. Land remembers who works it with respect.',
      'Here — a stake from my portfolio. Invest it wisely.',
    ],
    objectives: [{ kind: 'gather', target: 'clay', amount: 15, label: 'Gather 15 Clay from the riverbank' }],
    rewards: { bswx: 50, rep: 10, xp: 60 },
  },
  {
    id: 'homes_for_all',
    title: 'Homes for All',
    giver: 'stradford',
    line: 'side',
    requires: 'first_foundations',
    intro: [
      'Before my hotel, before any of it — families need homes. A man defends what he OWNS.',
      'Build 2 family cottages, and watch how the whole town stands taller.',
    ],
    outro: [
      'Lamplight in the windows. Children in the yards. THAT is what we are defending.',
      'You have a hotelier’s eye, friend. Take this for your trouble.',
    ],
    objectives: [{ kind: 'build', target: 'cottage', amount: 2, label: 'Build 2 Family Cottages' }],
    rewards: { bswx: 40, rep: 20, xp: 80, stone: 20 },
  },
  {
    id: 'voices_of_greenwood',
    title: 'Voices of Greenwood',
    giver: 'gerumba',
    line: 'side',
    intro: [
      'A builder who does not listen builds walls, not communities.',
      'Walk the district. Speak with Gurley, Rector, and Stradford. Hear what this place means to each of them.',
    ],
    outro: [
      'Now you carry four stories instead of one. That is how legacies survive — voice to voice.',
    ],
    objectives: [
      { kind: 'talk', target: 'gurley', amount: 1, label: 'Speak with O.W. Gurley' },
      { kind: 'talk', target: 'rector', amount: 1, label: 'Speak with Sarah Rector' },
      { kind: 'talk', target: 'stradford', amount: 1, label: 'Speak with J.B. Stradford' },
    ],
    rewards: { bswx: 25, rep: 15, xp: 70, staminaMax: 10 },
  },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

// ---------------------------------------------------------------------------
// MUSIC
// ---------------------------------------------------------------------------

export const MUSIC = {
  menu: '/music/GreenWood Main Menu.m4a',
  day: '/music/GreenWood Founding Members.m4a',
  night: '/music/GreenWood Trade Academy.m4a',
  market: '/music/GreenWood Ledger & Market Hub.m4a',
  levelUp: '/music/GreenWood Level Up_Achievement.m4a',
};

// ---------------------------------------------------------------------------
// LEVELING
// ---------------------------------------------------------------------------

export const xpForLevel = (level: number) => Math.round(80 * Math.pow(level, 1.5));

export const RESOURCE_LABEL: Record<string, string> = {
  wood: 'Lumber',
  stone: 'Stone',
  clay: 'Clay',
  goods: 'Goods',
};

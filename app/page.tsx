'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Hammer, Axe, Coins, Crown, Compass, TrendingUp, User, Plus, 
  MapPin, Sparkles, Building2, Info, BatteryCharging,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Star, 
  ChevronRight, Check, PlayCircle, Lock, Volume2, VolumeX, HelpCircle, 
  RotateCw, AlertTriangle
} from 'lucide-react';

import RetroCharacter from '../components/RetroCharacter';
import RetroBusiness from '../components/RetroBusiness';
import MiniMap from '../components/MiniMap';
import splashImg from '../src/assets/images/new_greenwood_splash_1779631301817.png';

// Enhanced Visuals & Gameplay imports
import WeatherOverlay from '../components/WeatherOverlay';
import CrtFrame from '../components/CrtFrame';
import CraftingWorkshop from '../components/CraftingWorkshop';
import TradingDesk from '../components/TradingDesk';
import RestorationManager from '../components/RestorationManager';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

// --- TYPEWRITER SCI-FI RETRO EFFECT MODULE ---
const TypeWriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 12 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let active = true;
    let index = 0;
    const t = setTimeout(() => {
      if (active) setDisplayedText('');
    }, 0);
    const interval = setInterval(() => {
      if (!active) {
        clearInterval(interval);
        return;
      }
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => {
      active = false;
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

// --- CONFIG & CONSTANTS ---
const MAP_SIZE = 64;
const VIEWPORT_SIZE = 11;
const VIEW_HALF = 5;

interface BusinessConfig {
  id: string;
  name: string;
  woodCost: number;
  stoneCost: number;
  legacyCost: number;
  bswxReward: number;
  repReward: number;
  desc: string;
  ceramicsCost?: number;
}

const BUSINESS_CATALOG: Record<string, BusinessConfig> = {
  grocery: {
    id: 'grocery',
    name: 'Greenwood Grocery',
    woodCost: 50,
    stoneCost: 30,
    legacyCost: 50,
    bswxReward: 3,
    repReward: 10,
    desc: 'Provides fresh cooperative food assets.'
  },
  sugarbowl: {
    id: 'sugarbowl',
    name: 'Williams Sugar Bowl',
    woodCost: 80,
    stoneCost: 50,
    legacyCost: 75,
    bswxReward: 8,
    repReward: 20,
    desc: 'A vibrant sweetshop fueling communal joy.'
  },
  bank: {
    id: 'bank',
    name: 'Strap & Lock Safe Bank',
    woodCost: 120,
    stoneCost: 100,
    legacyCost: 150,
    bswxReward: 20,
    repReward: 40,
    desc: 'Wealth secure repository and safe deposits.'
  },
  hotel: {
    id: 'hotel',
    name: 'Gurley Luxury Hotel',
    woodCost: 200,
    stoneCost: 180,
    legacyCost: 250,
    bswxReward: 50,
    repReward: 90,
    desc: 'The landmark hospitality haven of Greenwood.'
  },
  cultural_hall: {
    id: 'cultural_hall',
    name: 'Legacy Cultural Hall',
    woodCost: 250,
    stoneCost: 250,
    legacyCost: 350,
    bswxReward: 120,
    repReward: 200,
    desc: 'Grand assembly dedicated to sovereign cultural education.',
    ceramicsCost: 8
  },
  garden: {
    id: 'garden',
    name: 'Community Garden',
    woodCost: 100,
    stoneCost: 40,
    legacyCost: 100,
    bswxReward: 0,
    repReward: 0,
    desc: 'Passively boosts Reputation gain of all adjacent businesses by +50% per level.'
  }
};

const NPC_GOSSIP_DATA: Record<string, string[]> = {
  gurley: [
    "O.W. Gurley: I purchased 40 acres of land in 1906, explicitly dedicating it to Black business empowerment!",
    "O.W. Gurley: The demand for timber is climbing! A perfect time to harvest some forest pine trees.",
    "O.W. Gurley: Greenwood is built as a self-sufficient ecosystem, fostering our own cooperative banks and cafes.",
    "O.W. Gurley: I hear Stradford's team is planning a grand lodge expansion. Make sure you polish raw planks!",
    "O.W. Gurley: Community Gardens boost the reputation of all adjacent businesses. Plant them next to storefronts!"
  ],
  rector: [
    "Sarah Rector: In Taft, Oklahoma, my Creek Nation land allotment began producing 2,500 barrels of oil daily!",
    "Sarah Rector: Speculators say BSWX market valuation is highly reactive to weather. Watch the misty mornings!",
    "Sarah Rector: I was declared wealthy of our era at age 12, receiving thousands of letters from across the globe.",
    "Sarah Rector: Our Apprentices can gather materials much faster if we fund tools at the Apprentice Guild!",
    "Sarah Rector: Raw clay is becoming very valuable. Refine clay into ceramics to satisfy high-paying contracts."
  ],
  stradford: [
    "J.B. Stradford: I strongly believe that pooling resources is the ultimate path to complete financial freedom.",
    "J.B. Stradford: Greenwood property is booming! Each built Cottage adds a compounding 1.5x output boost.",
    "J.B. Stradford: The Stradford Hotel featured 54 modern luxury suites, a dining hall, and a fine pool parlor.",
    "J.B. Stradford: O.W. Gurley always tracks northwest parcels. Leasehold plots are ripe for construction!",
    "J.B. Stradford: High-tier landmarks like monuments hold immense wisdom. Restore them to boost reputation!"
  ],
  gerumba: [
    "Pharoah Gerumba: Greenwood land holds indigenous and sovereign Black legacies interwoven on Creek territory.",
    "Pharoah Gerumba: The stars favor Greenwood's growth. Use the active Heritage Catalyst to multiply passive yields!",
    "Pharoah Gerumba: Vernon AME and Mount Zion were built through community dime drives and cooperative hands.",
    "Pharoah Gerumba: Ancient obelisk landmarks pulse with cosmic power in the haze. Discover and rebuild them for LP.",
    "Pharoah Gerumba: Refined polished planks and bricks are highly desired. Local merchants pay top dollar."
  ]
};

interface MapTile {
  x: number;
  y: number;
  type: 'grass' | 'forest_tree' | 'quarry_stone' | 'clay_deposit' | 'road_brick' | 'center_greenwood' | 'leasehold' | 'river' | 'built_business' | 'cottage' | 'landmark';
  isStump?: boolean;
  isRubble?: boolean;
  isSilt?: boolean;
  isDirt?: boolean;
  cooldownRemaining?: number;
  businessId?: string;
  constructionTimer?: number;
  isConstructing?: boolean;
  level?: number;
  specialization?: 'A' | 'B' | 'C' | null;
  landmarkId?: string;
  landmarkName?: string;
}

interface NPCState {
  id: string;
  name: string;
  x: number;
  y: number;
  npcType: 'gurley' | 'rector' | 'stradford' | 'gerumba';
  bio: string;
}

interface DigitalApprentice {
  id: number;
  x: number;
  y: number;
  type: 'wood' | 'stone' | 'clay';
  state: 'walking' | 'harvesting' | 'idle';
  targetX: number;
  targetY: number;
  actionTimer: number; // For the 3-second strike animation
  skin: string;
  hair: string;
  clothing: string;
  role?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
}

export interface CivicFavor {
  id: string;
  senderName: string;
  avatarIcon: string;
  title: string;
  desc: string;
  requiredItem: 'wood' | 'stone' | 'clay' | 'polishedPlank' | 'reinforcedBrick' | 'ceramics';
  requiredQty: number;
  bswxReward: number;
  repReward: number;
  legacyReward: number;
}

const GLOBAL_CIVIC_FAVORS_POOL: CivicFavor[] = [
  {
    id: 'f1',
    senderName: 'Williams Sugar Bowl',
    avatarIcon: '🍬 Williams',
    title: 'Rebuild counter deck',
    desc: 'Williams Sweetshop wants to rebuild their main sales counter before the weekend block rush. They need 5 Polished Planks.',
    requiredItem: 'polishedPlank',
    requiredQty: 5,
    bswxReward: 80,
    repReward: 30,
    legacyReward: 4
  },
  {
    id: 'f2',
    senderName: 'Pastor Jackson',
    avatarIcon: '⛪ Pastor',
    title: 'Repair church fireplace',
    desc: 'The Vernon AME community church needs safe foundations. Help supply 15 Raw Stone Ore for mortar repairs.',
    requiredItem: 'stone',
    requiredQty: 15,
    bswxReward: 50,
    repReward: 20,
    legacyReward: 3
  },
  {
    id: 'f3',
    senderName: 'Aunt Beatrice',
    avatarIcon: '🏺 Beatrice',
    title: 'Traditional Clay Pots',
    desc: 'Baking delicious baked sweet potatoes requires traditional oven clay. Help supply 12 units of Raw Silt Clay.',
    requiredItem: 'clay',
    requiredQty: 12,
    bswxReward: 60,
    repReward: 25,
    legacyReward: 3
  },
  {
    id: 'f4',
    senderName: 'Greenwood Printing Guild',
    avatarIcon: '📰 Printer',
    title: 'Co-op Paper Supplies',
    desc: 'The Greenwood Star is printing posters highlighting local black ownership. Supply 25 Raw Wood Logs for paper pulp.',
    requiredItem: 'wood',
    requiredQty: 25,
    bswxReward: 70,
    repReward: 25,
    legacyReward: 4
  },
  {
    id: 'f5',
    senderName: 'Sarah Rector Office',
    avatarIcon: '🛢️ Sarah',
    title: 'Reinforce oil pipe docks',
    desc: 'Sarah Rectors shipping crew needs to reinforce support docks using heavy building bricks. Supply 4 Reinforced Bricks.',
    requiredItem: 'reinforcedBrick',
    requiredQty: 4,
    bswxReward: 120,
    repReward: 50,
    legacyReward: 6
  },
  {
    id: 'f6',
    senderName: 'High School Art Club',
    avatarIcon: '🎨 Art Club',
    title: 'Communal History Murals',
    desc: 'The student cooperative wants to paint on glazed tiles explaining Greenwood history. Supply 3 Fine Ceramics containers.',
    requiredItem: 'ceramics',
    requiredQty: 3,
    bswxReward: 140,
    repReward: 60,
    legacyReward: 8
  }
];

// Fixed quest stages configurations
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUEST_QUIZZES: Record<string, Record<number, QuizQuestion>> = {
  gurley: {
    1: {
      question: "At what year did O.W. Gurley purchase the initial 40 acres of land in Tulsa?",
      options: ["1906", "1921", "1895"],
      correctIndex: 0,
      explanation: "In 1906, O.W. Gurley acquired 40 acres of land in Tulsa, creating a sanctuary restricted for sale only to Black entrepreneurs."
    },
    2: {
      question: "What was the initial occupancy scale of O.W. Gurley's pioneering boarding house in Greenwood?",
      options: ["A 50-room rooming house", "An oil refinery", "A stock brokerage"],
      correctIndex: 0,
      explanation: "Gurley began with a 50-room rooming house, which served as a staging ground for incoming Black citizens."
    },
    3: {
      question: "O.W. Gurley served in which official capacity under the Oklahoma Governor?",
      options: ["Deputy Sheriff / Peace Officer", "State Treasurer", "Supreme Court Justice"],
      correctIndex: 0,
      explanation: "He served as a Deputy Sheriff, maintaining security and civic sovereignty within the Greenwood borders."
    }
  },
  rector: {
    1: {
      question: "At age 11, what title was Sarah Rector given by national media due to her unexpected oil fortune?",
      options: ["Richest Black Girl in America", "Tulsa Cotton Queen", "Empress of Greenwood"],
      correctIndex: 0,
      explanation: "Rector became globally famous and was dubbed the 'Richest Black Girl in America' when oil was discovered on her land allotment."
    },
    2: {
      question: "Which native tribe or nation officially enrolled Sarah Rector as a citizen?",
      options: ["Creek Nation (Muscogee)", "Cherokee Nation", "Choctaw Tribe"],
      correctIndex: 0,
      explanation: "As a descendant of Creek Freedmen, she received her land allotment directly from the Creek Nation."
    },
    3: {
      question: "To protect her sovereignty, where did Sarah's family relocate to purchase a luxury mansion?",
      options: ["Kansas City, Missouri", "Chicago, Illinois", "Detroit, Michigan"],
      correctIndex: 0,
      explanation: "She purchased a historic stone mansion in Kansas City, Missouri, hosting notable figures like Joe Louis and Duke Ellington."
    }
  },
  stradford: {
    1: {
      question: "Which prestigious academic institution did J.B. Stradford obtain his law degree from in 1899?",
      options: ["Indiana Law School", "Howard University", "Harvard Law"],
      correctIndex: 0,
      explanation: "J.B. Stradford graduated from Indiana Law School, using his legal expertise to challenge segregation laws in courts."
    },
    2: {
      question: "How many luxury suites did J.B. Stradford's legendary Stradford Hotel feature in Greenwood?",
      options: ["54 rooms", "12 rooms", "100 rooms"],
      correctIndex: 0,
      explanation: "The magnificent Stradford Hotel boasted 54 suites, becoming a crowning cultural monument of luxury and elegance."
    },
    3: {
      question: "Following his wrongful arrest during the 1921 riot, where did Stradford escape to, building a new legacy?",
      options: ["Chicago, Illinois", "Los Angeles, California", "Philadelphia, Pennsylvania"],
      correctIndex: 0,
      explanation: "Stradford escaped to Chicago, Illinois, establishing a highly successful legal practice and continuing his battle for civil rights."
    }
  },
  gerumba: {
    1: {
      question: "Mansa Musa of Mali distributed so much gold during his pilgrimage in 1324 that he shifted global economies. Which travel routes cooperatively benefited from his reserves?",
      options: ["Cairo, Medina, and Mecca", "Rome, Athens, and Constantinople", "Paris, London, and Madrid"],
      correctIndex: 0,
      explanation: "Mansa Musa distributed vast gold reserves to the poor and cooperatively enriched Cairo, Medina, and Mecca, causing gold value fluctuations!"
    },
    2: {
      question: "Which ancient Egyptian (Kemet) term represents cosmic order, truth, balance, and justice, which forms the bedrock of collective cooperative systems?",
      options: ["Ma'at", "Ka", "Ankh"],
      correctIndex: 0,
      explanation: "Ma'at represents truth, balance, and justice. When we construct cooperative districts in Greenwood under Ma'at, we are divinely sustained!"
    },
    3: {
      question: "The Moorish Science Temple of America, focused on sovereign cultural identity and commerce, was established by which influential modern oracle?",
      options: ["Noble Drew Ali", "Marcus Garvey", "Elijah Muhammad"],
      correctIndex: 0,
      explanation: "Noble Drew Ali established the Moorish Science Temple in 1913, advocating for cultural pride, moral sovereignty, and independent guilds for collective reliance."
    }
  }
};

const HISTORIC_SITES = [
  { id: 'ame_church', name: 'Vernon A.M.E. Church', x: 14, y: 11, desc: 'A beautiful spiritual sanctuary built in 1914. Its basement survived the 1921 Tulsa Riot and served as a crucial physical shelter for rebuilding Greenwood.', lpReward: 15 },
  { id: 'dreamland', name: 'Dreamland Theatre', x: 18, y: 11, desc: 'Loula Williams\' magnificent 750-seat modern cinema. A vibrant beacon of Black creative art, community pride, and social joy.', lpReward: 15 },
  { id: 'daily_star', name: 'Greenwood Daily Star Office', x: 11, y: 18, desc: 'The sovereign newspaper edited by A.J. Smitherman to promote communal autonomy, protect civic liberty, and spread local commercial intelligence.', lpReward: 15 },
  { id: 'mt_zion', name: 'Mount Zion Baptist Church', x: 21, y: 18, desc: 'A beautiful temple of hope funded entirely by its local congregation. Planners spent $85,000 to construct its sacred pillars before its tragic destruction and triumph.', lpReward: 15 },
  { id: 'gurley_office', name: "Gurley Civic Land Office", x: 26, y: 14, desc: 'The central administration and registry designed by O.W. Gurley to map and sell dapper commercial parcels to Black entrepreneurs, laying the foundations of Greenwood’s independence.', lpReward: 20 },
  { id: 'rector_manor', name: "Rector Sovereign Estate", x: 58, y: 15, desc: 'A magnificent manor built with Sarah Rector’s sovereign Creek oil allotment capital. Regarded as a wonder of independent luxury, it boasts a stone masonry parlor and oil administration lodge.', lpReward: 25 },
  { id: 'stradford_hotel', name: "Stradford Luxury Hotel & Lounge", x: 14, y: 38, desc: 'Greenwood’s premier, high-society guest house designed by J.B. Stradford. Features symmetric brick columns, a crystal chandelier tea room, and massive timber suites.', lpReward: 20 },
  { id: 'gerumba_temple', name: "Moorish Wisdom Hermitage", x: 42, y: 40, desc: 'A peaceful brick-and-clay sanctuary founded by Pharoah Gerumba. Dedicated to Moorish cosmic science, Kemetic scriptures, and collective economic sovereignty.', lpReward: 20 }
];

export default function HomeView() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [screen, setScreen] = useState<'splash' | 'creator' | 'game'>('splash');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeResourceTooltip, setActiveResourceTooltip] = useState<'bswx' | 'rep' | 'lp' | 'stamina' | 'weather' | 'heritage' | 'time' | null>(null);
  const [showFaintScreen, setShowFaintScreen] = useState(false);

  // --- CHIPTUNE SYNTH MUSIC BOX STATES ---
  const [chiptunePlaying, setChiptunePlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'ragtime' | 'blues' | 'none'>('none');
  const beatIndexRef = useRef<number>(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // --- CHARACTER CUSTOMIZATION ---
  const [charName, setCharName] = useState('Pioneer');
  const [charSkin, setCharSkin] = useState('espresso');
  const [charHair, setCharHair] = useState('afro');
  const [clothing, setClothing] = useState('gold');
  const [charAccessory, setCharAccessory] = useState<'none' | 'glasses' | 'chain' | 'cap'>('none');
  const [charGender, setCharGender] = useState<'Male' | 'Female'>('Male');
  const [charArchetype, setCharArchetype] = useState<'merchant' | 'organizer' | 'grit'>('merchant');
  const [charOrigin, setCharOrigin] = useState<'homestead' | 'academy' | 'stradford'>('homestead');
  const [charHeirloom, setCharHeirloom] = useState<'none' | 'brass_level' | 'thermos' | 'heritage_ledger'>('none');

  // --- CHATTERING TOWN GOSSIP ---
  const [activeGossipTick, setActiveGossipTick] = useState<number>(0);


  // --- PLAYER POSITION & NAVIGATION ---
  const [playerX, setPlayerX] = useState(16);
  const [playerY, setPlayerY] = useState(19);
  const playerXRef = useRef(16);
  const playerYRef = useRef(19);
  const [direction, setDirection] = useState<'N' | 'S' | 'E' | 'W'>('S');
  const [playerDirection, setPlayerDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('DOWN');
  const [isMoving, setIsMoving] = useState(false);
  const [collidedTile, setCollidedTile] = useState<{ x: number; y: number } | null>(null);

  // --- PERSISTENT LEDGER INVENTORIES ---
  const [wood, setWood] = useState(25);
  const [stone, setStone] = useState(25);
  const [clay, setClay] = useState(10);
  const [ceramics, setCeramics] = useState(2);
  const [polishedPlank, setPolishedPlank] = useState(5);
  const [reinforcedBrick, setReinforcedBrick] = useState(5);
  const [bswx, setBswx] = useState(200); // Currency
  const [reputation, setReputation] = useState(10);
  const [legacyPoints, setLegacyPoints] = useState(40);
  const [stamina, setStamina] = useState(100);
  const maxStamina = charArchetype === 'grit' ? 140 : 100;
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'foggy' | 'sunset_glow'>('sunny');
  const [weatherTimer, setWeatherTimer] = useState(45);

  // --- DYNAMIC MARKET PRICE ENGINE & FINANCIAL DESK ---
  const getDynamicMarketPrices = () => {
    let woodSpot = 12.5;
    let stoneSpot = 14.0;
    let claySpot = 18.5;
    
    // Refined items
    let plankSpot = 140.0;
    let brickSpot = 160.0;
    let ceramicsSpot = 210.0;

    // Apply weather modifiers
    if (weather === 'sunny') {
      woodSpot -= 2.0;    // wood abundant
      claySpot += 5.5;    // clay dried up, scarce
      plankSpot -= 15.0;
    } else if (weather === 'rainy') {
      claySpot -= 6.0;    // clay mud slides, super abundant
      stoneSpot += 3.5;   // slippery, risky quarrying
      woodSpot += 1.5;    // damp logs
      brickSpot += 20.0;  // brick drying slow
    } else if (weather === 'foggy') {
      woodSpot += 2.5;
      stoneSpot += 2.0;
      claySpot += 2.0;
      plankSpot += 15.0;
      brickSpot += 15.0;
      ceramicsSpot += 20.0;
    } else if (weather === 'sunset_glow') {
      plankSpot += 30.0;
      brickSpot += 30.0;
      ceramicsSpot += 45.0;
    }
    
    return {
      wood: Math.round(woodSpot * 10) / 10,
      stone: Math.round(stoneSpot * 10) / 10,
      clay: Math.round(claySpot * 10) / 10,
      polishedPlank: Math.round(plankSpot * 10) / 10,
      reinforcedBrick: Math.round(brickSpot * 10) / 10,
      ceramics: Math.round(ceramicsSpot * 10) / 10,
    };
  };

  const [visitedCoordinates, setVisitedCoordinates] = useState<string[]>([]);
  const [discoveredLandmarks, setDiscoveredLandmarks] = useState<string[]>([]);
  const [restoredLandmarks, setRestoredLandmarks] = useState<string[]>([]);

  // Upgraded Gameplay States
  const [sharesGurl, setSharesGurl] = useState(0);
  const [sharesShal, setSharesShal] = useState(0);
  const [sharesSreg, setSharesSreg] = useState(0);
  const [landmarkStages, setLandmarkStages] = useState<Record<string, number>>({});
  const [activeEvent, setActiveEvent] = useState<{ title: string; desc: string; timer: number; type: 'storm' | 'boom' | 'parade' | null } | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({
    wood: [12.5],
    stone: [14.0],
    clay: [18.5],
    polishedPlank: [140.0],
    reinforcedBrick: [160.0],
    ceramics: [210.0]
  });
  const [priceTick, setPriceTick] = useState(0);
  const [apprenticeSpeedLvl, setApprenticeSpeedLvl] = useState(1);
  const [apprenticeOutputLvl, setApprenticeOutputLvl] = useState(1);
  const [paidRespectsToday, setPaidRespectsToday] = useState<Record<string, number>>({});
  const [currentSystemTime, setCurrentSystemTime] = useState<number>(() => Date.now());
  const [activeLandmarkDetail, setActiveLandmarkDetail] = useState<{ id: string; name: string; desc: string; lpReward: number } | null>(null);

  // --- WORLD GRID & ENVIRONMENT ---
  const [mapGrid, setMapGrid] = useState<MapTile[][]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(480); // Start at 08:00 AM (480 minutes)
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [pauseMenuTab, setPauseMenuTab] = useState<'academy' | 'inventory' | 'crafting' | 'exchange' | 'legacy' | 'favors'>('academy');
  const [civicFavors, setCivicFavors] = useState<CivicFavor[]>([]);
  const [completedFavorNotice, setCompletedFavorNotice] = useState<CivicFavor | null>(null);
  const [selectedX, setSelectedX] = useState<number>(16);
  const [selectedY, setSelectedY] = useState<number>(19);
  const [gridContextMenu, setGridContextMenu] = useState<{
    x: number;
    y: number;
    tileX: number;
    tileY: number;
    tileType: string;
    businessId?: string;
  } | null>(null);
  const [showTileStats, setShowTileStats] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [leaderboardLogs, setLeaderboardLogs] = useState<string[]>([]);

  const handleOpenLeaderboard = () => {
    setIsLeaderboardOpen(true);
    setLeaderboardLoading(true);
    setLeaderboardLogs(["Establishing socket link to regional cooperative exchange..."]);
    
    playRetroTone('success', 0.5);

    const steps = [
      { delay: 400, msg: "🔒 Link established. Handshaking with Greenwood Bank Ledger..." },
      { delay: 800, msg: "📡 Synchronizing distributed state metrics across 5 regional sectors..." },
      { delay: 1250, msg: "🖧 Compiling individual player Legacy Points & civic contributions..." },
      { delay: 1600, msg: "📊 Validating cryptographic signatures on cooperative trust vaults..." },
      { delay: 2000, msg: "✨ Top 5 Pioneer rankings consolidated and verified. Loading table..." }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setLeaderboardLogs(prev => [...prev, step.msg]);
      }, step.delay);
    });

    setTimeout(() => {
      setLeaderboardLoading(false);
      playRetroTone('level', 0.6);
    }, 2400);
  };
  const [tileOutputHistory, setTileOutputHistory] = useState<Record<string, { time: string; bswx: number; rep: number }[]>>({});
  const [tickCounter, setTickCounter] = useState<number>(0);
  const [gameSystemLogs, setGameSystemLogs] = useState<string[]>(["Welcome to New Greenwood (Lumen Labs) landing hub."]);

  // --- CURRENCY & RESOURCE PULSE ANIMATIONS TRACKING ---
  const [prevBswx, setPrevBswx] = useState<number>(200);
  const [bswxPulseType, setBswxPulseType] = useState<'up' | 'down' | null>(null);

  const [prevRep, setPrevRep] = useState<number>(10);
  const [repPulseType, setRepPulseType] = useState<'up' | 'down' | null>(null);

  const [prevLp, setPrevLp] = useState<number>(40);
  const [lpPulseType, setLpPulseType] = useState<'up' | 'down' | null>(null);

  const [prevStamina, setPrevStamina] = useState<number>(100);
  const [staminaPulseType, setStaminaPulseType] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      const t = setTimeout(() => setPrevBswx(bswx), 0);
      return () => clearTimeout(t);
    }
    if (bswx !== prevBswx) {
      const direction = bswx > prevBswx ? 'up' : 'down';
      const t1 = setTimeout(() => {
        setBswxPulseType(direction);
        setPrevBswx(bswx);
      }, 0);
      const t2 = setTimeout(() => setBswxPulseType(null), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [bswx, prevBswx, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      const t = setTimeout(() => setPrevRep(reputation), 0);
      return () => clearTimeout(t);
    }
    if (reputation !== prevRep) {
      const direction = reputation > prevRep ? 'up' : 'down';
      const t1 = setTimeout(() => {
        setRepPulseType(direction);
        setPrevRep(reputation);
      }, 0);
      const t2 = setTimeout(() => setRepPulseType(null), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [reputation, prevRep, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      const t = setTimeout(() => setPrevLp(legacyPoints), 0);
      return () => clearTimeout(t);
    }
    if (legacyPoints !== prevLp) {
      const direction = legacyPoints > prevLp ? 'up' : 'down';
      const t1 = setTimeout(() => {
        setLpPulseType(direction);
        setPrevLp(legacyPoints);
      }, 0);
      const t2 = setTimeout(() => setLpPulseType(null), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [legacyPoints, prevLp, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      const t = setTimeout(() => setPrevStamina(stamina), 0);
      return () => clearTimeout(t);
    }
    if (stamina !== prevStamina) {
      const direction = stamina > prevStamina ? 'up' : 'down';
      const t1 = setTimeout(() => {
        setStaminaPulseType(direction);
        setPrevStamina(stamina);
      }, 0);
      const t2 = setTimeout(() => setStaminaPulseType(null), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [stamina, prevStamina, isHydrated]);

  // --- HARVEST ANIMATION & PARTICLE PHYSICS LAYER ---
  const [isHarvestingFreeze, setIsHarvestingFreeze] = useState(false);
  const [burstParticles, setBurstParticles] = useState<Particle[]>([]);
  const [harvestTargetCoords, setHarvestTargetCoords] = useState<{ x: number, y: number, type: 'tree' | 'stone' | 'clay' } | null>(null);
  const [harvestFlashFrame, setHarvestFlashFrame] = useState(0); // For alternate flash filters
  const [harvestBounceState, setHarvestBounceState] = useState(false); // For rock bounce translation

  // --- APPRENTICES LABORS & COTTAGES SYSTEM ---
  const [apprentices, setApprentices] = useState<DigitalApprentice[]>([]);
  const [cottagesCount, setCottagesCount] = useState(0);

  // --- MOBILE OPTIMIZATION STATES ---
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isMapConsoleCollapsed, setIsMapConsoleCollapsed] = useState(true); // Default collapsed on mobile, expandable
  const [isAutomationsCollapsed, setIsAutomationsCollapsed] = useState(true);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(true);
  const [mobileActiveTab, setMobileActiveTab] = useState<'play' | 'radar' | 'auto' | 'logs'>('play');

  // Automatically expand panels on larger desktop screens on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsMapConsoleCollapsed(false);
      setIsAutomationsCollapsed(false);
      setIsLogsCollapsed(false);
    }
  }, []);

  const spawnApprenticeParticles = (tx: number, ty: number, toolType: 'wood' | 'stone' | 'clay') => {
    const arr: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        id: Math.random() + i,
        x: tx * 24 + 12,
        y: ty * 24 + 12,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 4,
        color: toolType === 'wood' ? '#10b981' : (toolType === 'stone' ? '#ca8a04' : '#bc6c25'),
        size: Math.random() * 4 + 2,
        opacity: 1
      });
    }
    setBurstParticles(prev => [...prev, ...arr]);
  };

  const spawnFootstepDust = (tx: number, ty: number) => {
    const tile = mapGrid[ty]?.[tx];
    let dustColor = '#71717a'; // default grey
    if (tile) {
      if (tile.type === 'clay_deposit' || tile.type === 'road_brick') {
        dustColor = tile.isDirt ? '#78350f' : '#b45309'; // brown/terracotta dust
      } else if (tile.type === 'grass' || tile.type === 'forest_tree') {
        dustColor = '#3f6212'; // greenwood grass dust
      }
    }

    const list: Particle[] = [];
    for (let i = 0; i < 3; i++) {
      list.push({
        id: Math.random() + i,
        x: tx * 24 + 12 + (Math.random() - 0.5) * 8,
        y: ty * 24 + 22,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.2 - Math.random() * 0.8,
        color: dustColor,
        size: Math.random() * 3 + 2,
        opacity: 0.6
      });
    }
    setBurstParticles(prev => [...prev, ...list]);
  };

  const triggerLandmarkInspection = (landmarkId: string) => {
    const site = HISTORIC_SITES.find(s => s.id === landmarkId);
    if (!site) return;

    const alreadyVisited = discoveredLandmarks.includes(landmarkId);
    if (!alreadyVisited) {
      setDiscoveredLandmarks(prev => [...prev, landmarkId]);
      setLegacyPoints(lp => lp + site.lpReward);
      addLog(`✨ landmark DISCOVERED: You inspected '${site.name}' coordinates and reflected on its ancestral history. (+${site.lpReward} Legacy Points earned!)`);
      playRetroTone('level', 1.0);
    } else {
      addLog(`Historic Plaque Reflected: ${site.name}`);
      playRetroTone('strike', 0.5);
    }

    setActiveLandmarkDetail({
      id: site.id,
      name: site.name,
      desc: site.desc,
      lpReward: site.lpReward
    });
  };

  // --- QUEST STAGES & INTEL QUIZZES ---
  const [questStageGurley, setQuestStageGurley] = useState<number>(1);
  const [questStageRector, setQuestStageRector] = useState<number>(1);
  const [questStageStradford, setQuestStageStradford] = useState<number>(1);
  const [questStageGerumba, setQuestStageGerumba] = useState<number>(1);
  const [activeNPC, setActiveNPC] = useState<NPCState | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<{ nNPC: NPCState; stage: number; quiz: QuizQuestion } | null>(null);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);

  // --- CULTURAL HERITAGE TIMEOUT BOOST ---
  const [heritageCatalystTime, setHeritageCatalystTime] = useState(0); // Remaining seconds for +25% active buff

  // Audio Context reference for arcade Web Audio synth
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgMusicOscRef = useRef<OscillatorNode | null>(null);
  const bgMusicGainRef = useRef<GainNode | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (msg: string) => {
    setGameSystemLogs(prev => [msg, ...prev.slice(0, 8)]);
  };

  // Safe Web Audio Synthesizer
  const playRetroTone = (type: 'strike' | 'success' | 'fail' | 'level', volumeMult = 1) => {
    return; // Silenced completely - only background music plays
  };

  // --- RETRO CHIPTUNE MELODIES & SYNTH PLAYER ---
  const RAGTIME_TRACK = [
    261.63, 0, 329.63, 0, 392.00, 0, 523.25, 0,
    392.00, 0, 329.63, 0, 261.63, 392.00, 0, 0,
    293.66, 0, 349.23, 0, 392.00, 0, 587.33, 0,
    392.00, 0, 349.23, 0, 293.66, 392.00, 0, 0,
    329.63, 0, 392.00, 0, 440.00, 0, 659.25, 0,
    440.00, 0, 392.00, 0, 329.63, 440.00, 0, 0,
    261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 0,
    392.00, 0, 392.00, 0, 523.25, 0, 0, 0
  ];

  const BLUES_TRACK = [
    220.00, 0, 277.18, 0, 329.63, 0, 392.00, 0,
    440.00, 0, 392.00, 0, 329.63, 0, 277.18, 0,
    220.00, 0, 277.18, 0, 329.63, 0, 392.00, 0,
    440.00, 0, 392.00, 0, 329.63, 0, 277.18, 0,
    293.66, 0, 349.23, 0, 440.00, 0, 523.25, 0,
    587.33, 0, 523.25, 0, 440.00, 0, 349.23, 0,
    220.00, 0, 277.18, 0, 329.63, 0, 392.00, 0,
    329.63, 0, 293.66, 0, 220.00, 0, 0, 0
  ];

  const playMelodyNote = (freq: number, duration = 0.18, oscType: OscillatorType = 'triangle') => {
    return; // Silenced completely - only background music plays
  };

  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (chiptunePlaying && activeTrack !== 'none') {
      const melody = activeTrack === 'ragtime' ? RAGTIME_TRACK : BLUES_TRACK;
      const bpm = activeTrack === 'ragtime' ? 140 : 110;
      const stepDuration = 60 / bpm / 2;

      intervalIdRef.current = setInterval(() => {
        const idx = beatIndexRef.current;
        const freq = melody[idx];
        beatIndexRef.current = (idx + 1) % melody.length;
        if (freq > 0) {
          playMelodyNote(freq, stepDuration * 0.9, activeTrack === 'ragtime' ? 'triangle' : 'square');
        }
      }, stepDuration * 1000);

      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
    } else {
      if (bgAudioRef.current && !isMuted) {
        bgAudioRef.current.play().catch(() => {});
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [chiptunePlaying, activeTrack, masterVolume, isMuted]);

  // Format game time
  const gameHour = Math.floor(timeOfDay / 60);
  const gameMinute = Math.floor(timeOfDay % 60);
  const gameAmpm = gameHour >= 12 ? 'PM' : 'AM';
  const gameDisplayHour = gameHour % 12 === 0 ? 12 : gameHour % 12;
  const gameDisplayMinute = gameMinute.toString().padStart(2, '0');
  const gameFormattedTime = `${gameDisplayHour}:${gameDisplayMinute} ${gameAmpm}`;

  // Time-based emoji and name
  let timeIcon = '☀️';
  let timePeriodName = 'Day';
  if (timeOfDay >= 1260 || timeOfDay < 360) {
    timeIcon = '🌙';
    timePeriodName = 'Night';
  } else if (timeOfDay >= 360 && timeOfDay < 480) {
    timeIcon = '🌅';
    timePeriodName = 'Dawn';
  } else if (timeOfDay >= 1080 && timeOfDay < 1260) {
    timeIcon = '🌇';
    timePeriodName = 'Sunset';
  }

  // Ambient Looping Background Music & Fades
  let currentTrackUrl: string | null = null;
  if (chiptunePlaying && activeTrack !== 'none') {
    currentTrackUrl = null;
  } else if (screen === 'splash' || screen === 'creator' || screen === 'game') {
    currentTrackUrl = '/music/GreenWood Trade Academy.m4a';
  }

  const { playAchievementSfx } = useAudioPlayer(currentTrackUrl, masterVolume, isMuted, hasInteracted);

  const startBackgroundSoundtrack = () => {
    setHasInteracted(true);
  };

  useEffect(() => {
    if (bgMusicGainRef.current) {
      bgMusicGainRef.current.gain.setValueAtTime(isMuted ? 0 : masterVolume * 0.12, audioCtxRef.current?.currentTime || 0);
    }
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = isMuted ? 0 : masterVolume * 0.4;
    }
  }, [masterVolume, isMuted]);

  // --- INITIALIZE & PARSE PROCEDURAL 64x64 CRT MAP ---
  const initializeProceduralMap = (savedGrid?: MapTile[][]) => {
    if (savedGrid && savedGrid.length === MAP_SIZE) {
      setMapGrid(savedGrid);
      return;
    }

    const grid: MapTile[][] = [];
    const residentialPlots = [
      { x: 32, y: 12 }, { x: 34, y: 12 }, { x: 32, y: 14 }, { x: 34, y: 14 }
    ];
    const leaseholdPlots = [
      { x: 14, y: 13 }, { x: 18, y: 13 }, { x: 14, y: 19 }, { x: 18, y: 19 },
      { x: 12, y: 15 }, { x: 20, y: 15 }, { x: 12, y: 17 }, { x: 20, y: 17 }
    ];

    for (let y = 0; y < MAP_SIZE; y++) {
      const row: MapTile[] = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        let type: MapTile['type'] = 'grass';
        let isDirt = false;

        if (x >= 60) {
          type = 'river';
        } else if (x >= 10 && x <= 22 && y >= 10 && y <= 22) {
          if (x >= 15 && x <= 17 && y >= 15 && y <= 17) {
            type = 'center_greenwood';
          } else if (x === 16 || y === 16) {
            type = 'road_brick';
          } else if (leaseholdPlots.some(p => p.x === x && p.y === y)) {
            type = 'leasehold';
          }
        } else {
          // Highways
          if (x === 16 || y === 16 || x === 40 || y === 40) {
            type = 'road_brick';
            isDirt = true;
          } else if (residentialPlots.some(p => p.x === x && p.y === y)) {
            // Residential Zone blueprints
            type = 'leasehold';
          } else {
            // Deterministic scatter
            const val = Math.sin(x * 12.5 + y * 9.7) * 43758.5;
            const decimal = Math.abs(val) % 1;
            if (x >= 51 && x < 60 && decimal < 0.3) {
              type = 'clay_deposit';
            } else if (decimal < 0.08) {
              type = 'forest_tree';
            } else if (decimal < 0.13) {
              type = 'quarry_stone';
            } else if (decimal < 0.16) {
              type = 'clay_deposit';
            }
          }
        }

        const matchingSite = HISTORIC_SITES.find(site => site.x === x && site.y === y);
        if (matchingSite) {
          type = 'landmark';
        }

        row.push({
          x,
          y,
          type,
          isDirt,
          isStump: false,
          isRubble: false,
          isSilt: false,
          cooldownRemaining: 0,
          level: 1,
          landmarkId: matchingSite ? matchingSite.id : undefined,
          landmarkName: matchingSite ? matchingSite.name : undefined
        });
      }
      grid.push(row);
    }
    setMapGrid(grid);
  };

  // --- CIVIC COMMUNITY BOARD FAVOR SYSTEM ---
  const initializeCivicFavors = () => {
    const shuffled = [...GLOBAL_CIVIC_FAVORS_POOL].sort(() => 0.5 - Math.random());
    setCivicFavors(shuffled.slice(0, 3));
  };

  const fulfillCivicFavor = (favor: CivicFavor) => {
    let hasItem = false;
    if (favor.requiredItem === 'wood' && wood >= favor.requiredQty) hasItem = true;
    if (favor.requiredItem === 'stone' && stone >= favor.requiredQty) hasItem = true;
    if (favor.requiredItem === 'clay' && clay >= favor.requiredQty) hasItem = true;
    if (favor.requiredItem === 'polishedPlank' && polishedPlank >= favor.requiredQty) hasItem = true;
    if (favor.requiredItem === 'reinforcedBrick' && reinforcedBrick >= favor.requiredQty) hasItem = true;
    if (favor.requiredItem === 'ceramics' && ceramics >= favor.requiredQty) hasItem = true;

    if (!hasItem) {
      playRetroTone('fail', 0.5);
      addLog(`❌ Cannot fulfill favor. Missing required items for ${favor.senderName}.`);
      return;
    }

    if (favor.requiredItem === 'wood') setWood(prev => prev - favor.requiredQty);
    if (favor.requiredItem === 'stone') setStone(prev => prev - favor.requiredQty);
    if (favor.requiredItem === 'clay') setClay(prev => prev - favor.requiredQty);
    if (favor.requiredItem === 'polishedPlank') setPolishedPlank(prev => prev - favor.requiredQty);
    if (favor.requiredItem === 'reinforcedBrick') setReinforcedBrick(prev => prev - favor.requiredQty);
    if (favor.requiredItem === 'ceramics') setCeramics(prev => prev - favor.requiredQty);

    setBswx(prev => prev + favor.bswxReward);
    setReputation(prev => prev + favor.repReward);
    setLegacyPoints(prev => prev + favor.legacyReward);

    playRetroTone('success', 0.7);
    addLog(`🤝 Completed Favor: "${favor.title}" for ${favor.senderName}! Verified +${favor.bswxReward} Coins.`);

    setCompletedFavorNotice(favor);

    setCivicFavors(prevFavors => {
      const activeIds = prevFavors.map(f => f.id);
      const remainingPool = GLOBAL_CIVIC_FAVORS_POOL.filter(f => !activeIds.includes(f.id));
      const nextFavor = remainingPool.length > 0 
        ? remainingPool[Math.floor(Math.random() * remainingPool.length)]
        : GLOBAL_CIVIC_FAVORS_POOL[Math.floor(Math.random() * GLOBAL_CIVIC_FAVORS_POOL.length)];
      
      return prevFavors.map(f => f.id === favor.id ? nextFavor : f);
    });
  };

  // --- CRYPTO-SECURED REVOLVING LOCAL STORAGE AUTO-SAVE ---
  const handleManualSave = () => {
    try {
      const payload = {
        screen,
        charName, charSkin, charHair, clothing, charAccessory, charGender, charArchetype,
        charOrigin, charHeirloom,
        playerX: playerXRef.current, playerY: playerYRef.current, direction, playerDirection,
        wood, stone, clay, ceramics, polishedPlank, reinforcedBrick, bswx, reputation, legacyPoints, stamina,
        questStageGurley, questStageRector, questStageStradford, questStageGerumba,
        mapGrid, apprentices, cottagesCount, heritageCatalystTime,
        visitedCoordinates, discoveredLandmarks, paidRespectsToday,
        restoredLandmarks, apprenticeSpeedLvl, apprenticeOutputLvl,
        civicFavors,
        sharesGurl, sharesShal, sharesSreg, landmarkStages
      };
      localStorage.setItem('BWS_EMPIRE_SAVE_V2', JSON.stringify(payload));
      addLog("District saved to LocalStorage safely.");
    } catch {
      // Fallback
    }
  };

  const handleResetLedger = () => {
    localStorage.removeItem('BWS_EMPIRE_SAVE_V2');
    addLog("Cache cleared. Resetting browser view...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    // Mounting restoration checks
    const t = setTimeout(() => {
      setIsHydrated(true);
      try {
        const cache = localStorage.getItem('BWS_EMPIRE_SAVE_V2');
        if (cache) {
          const parsed = JSON.parse(cache);
          setCharName(parsed.charName ?? 'Pioneer');
          setCharSkin(parsed.charSkin ?? 'espresso');
          setCharHair(parsed.charHair ?? 'afro');
          setClothing(parsed.clothing ?? 'emerald');
          setCharAccessory(parsed.charAccessory ?? 'none');
          setCharGender(parsed.charGender ?? 'Male');
          setCharArchetype(parsed.charArchetype ?? 'merchant');
          setCharOrigin(parsed.charOrigin ?? 'homestead');
          setCharHeirloom(parsed.charHeirloom ?? 'none');
          setScreen(parsed.screen ?? 'splash');
          
          setPlayerX(parsed.playerX ?? 16);
          setPlayerY(parsed.playerY ?? 19);
          playerXRef.current = parsed.playerX ?? 16;
          playerYRef.current = parsed.playerY ?? 19;
          setDirection(parsed.direction ?? 'S');
          setPlayerDirection(parsed.playerDirection ?? 'DOWN');

          setWood(parsed.wood ?? 20);
          setStone(parsed.stone ?? 20);
          setClay(parsed.clay ?? 10);
          setCeramics(parsed.ceramics ?? 2);
          setPolishedPlank(parsed.polishedPlank ?? 0);
          setReinforcedBrick(parsed.reinforcedBrick ?? 0);
          setBswx(parsed.bswx ?? 200);
          setReputation(parsed.reputation ?? 10);
          setLegacyPoints(parsed.legacyPoints ?? 30);
          setStamina(parsed.stamina ?? 100);

          setQuestStageGurley(parsed.questStageGurley ?? 1);
          setQuestStageRector(parsed.questStageRector ?? 1);
          setQuestStageStradford(parsed.questStageStradford ?? 1);
          setQuestStageGerumba(parsed.questStageGerumba ?? 1);
          setApprentices(parsed.apprentices ?? []);
          setCottagesCount(parsed.cottagesCount ?? 0);
          setHeritageCatalystTime(parsed.heritageCatalystTime ?? 0);

          setVisitedCoordinates(parsed.visitedCoordinates ?? []);
          setDiscoveredLandmarks(parsed.discoveredLandmarks ?? []);
          setRestoredLandmarks(parsed.restoredLandmarks ?? []);
          setApprenticeSpeedLvl(parsed.apprenticeSpeedLvl ?? 1);
          setApprenticeOutputLvl(parsed.apprenticeOutputLvl ?? 1);
          setPaidRespectsToday(parsed.paidRespectsToday ?? {});
          
          setSharesGurl(parsed.sharesGurl ?? 0);
          setSharesShal(parsed.sharesShal ?? 0);
          setSharesSreg(parsed.sharesSreg ?? 0);
          setLandmarkStages(parsed.landmarkStages ?? {});

          if (parsed.civicFavors && parsed.civicFavors.length > 0) {
            setCivicFavors(parsed.civicFavors);
          } else {
            initializeCivicFavors();
          }

          initializeProceduralMap(parsed.mapGrid);
          addLog("Valid saving decrypted successfully. Welcome back to Greenwood.");
        } else {
          initializeProceduralMap();
          initializeCivicFavors();
        }
      } catch {
        initializeProceduralMap();
        initializeCivicFavors();
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Sync state loops to localStorage every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleManualSave();
    }, 10000);
    return () => clearInterval(timer);
  }, [
    screen, charName, charSkin, charHair, clothing, charAccessory, charGender, charArchetype, charOrigin, charHeirloom,
    wood, stone, clay, ceramics, polishedPlank, reinforcedBrick, bswx, reputation, legacyPoints, stamina,
    questStageGurley, questStageRector, questStageStradford, questStageGerumba, mapGrid, apprentices, cottagesCount, heritageCatalystTime,
    visitedCoordinates, discoveredLandmarks, paidRespectsToday, restoredLandmarks, apprenticeSpeedLvl, apprenticeOutputLvl,
    sharesGurl, sharesShal, sharesSreg, landmarkStages
  ]);

  // Custom static arrays of advisors
  const npcs: NPCState[] = [
    { id: 'gurley', name: 'O.W. Gurley', x: 26, y: 15, npcType: 'gurley', bio: 'Founder of Greenwood who created dapper parcels explicitly for cooperative Black business empowerment.' },
    { id: 'rector', name: 'Sarah Rector', x: 57, y: 15, npcType: 'rector', bio: 'Sovereign landowner details whose Creek Nation oil allotment gained high-society capital.' },
    { id: 'stradford', name: 'J.B. Stradford', x: 15, y: 38, npcType: 'stradford', bio: 'Indiana law graduate entrepreneur who designed Greenwood’s magnificent historical luxury hotel.' },
    { id: 'gerumba', name: 'Pharoah Gerumba', x: 42, y: 41, npcType: 'gerumba', bio: 'Male oracle of Kemetic history, Moorish science and community-cooperative sovereignty. "Ase\'" constitutes the flow of our cosmic legacy.' }
  ];

  // Helper arrays for AI Companion Generation
  const SPECIALIZED_APP_SKINS = ['espresso', 'umber', 'honey', 'caramel'];
  const SPECIALIZED_APP_HAIR = ['locs', 'fade', 'afro', 'braids'];
  const SPECIALIZED_APP_CLOTHING = ['emerald', 'gold', 'crimson', 'purple'];

  // --- CHATTERING TOWN GOSSIP AUTO-CYCLE TIMER ---
  useEffect(() => {
    if (screen !== 'game') return;
    const gossipInterval = setInterval(() => {
      setActiveGossipTick(prev => prev + 1);
    }, 7000);
    return () => clearInterval(gossipInterval);
  }, [screen]);

  // --- PROCEDURAL WEATHER SYSTEM ---
  useEffect(() => {
    if (screen !== 'game') return;
    const weatherInterval = setInterval(() => {
      setWeatherTimer(prev => {
        if (prev <= 1) {
          const options: ('sunny' | 'rainy' | 'foggy' | 'sunset_glow')[] = ['sunny', 'rainy', 'foggy', 'sunset_glow'];
          setWeather(current => {
            const filtered = options.filter(o => o !== current);
            const nextWeather = filtered[Math.floor(Math.random() * filtered.length)];
            
            let logMsg = '';
            if (nextWeather === 'sunny') {
              logMsg = "🌤 Weather Report: Bright sunshine breaks through high clouds! Solar rays warm New Greenwood. Energy levels feel standard.";
            } else if (nextWeather === 'rainy') {
              logMsg = "🌧 Weather Report: Gentle spring rain is falling across Greenwood, coating cedar paths with glistening moisture.";
            } else if (nextWeather === 'foggy') {
              logMsg = "🌫 Weather Report: Dynamic mist and deep fog banks roll in from Greenwood hills, giving a cinematic, low-visibility look.";
            } else if (nextWeather === 'sunset_glow') {
              logMsg = "🌇 Weather Report: Golden Hour is active! A warm violet-amber sunset glow bathes the coordinate grid.";
            }
            addLog(logMsg);
            return nextWeather;
          });
          return 60 + Math.floor(Math.random() * 45); // 60 To 105 seconds for next switch
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(weatherInterval);
  }, [screen]);

  // --- BACKGROUND TIME CLOCK TIMER (1s tick) ---
  useEffect(() => {
    const clock = setInterval(() => {
      // Update system timestamp
      setCurrentSystemTime(Date.now());

      // Increment game time of day (1 second = 10 minutes)
      setTimeOfDay(t => (t + 10) % 1440);

      // Decrement/trigger random events
      setActiveEvent(currentEvent => {
        if (currentEvent) {
          const nextTime = currentEvent.timer - 1;
          if (nextTime <= 0) {
            addLog(`🔔 Event Completed: "${currentEvent.title}" has ended.`);
            return null;
          }
          return { ...currentEvent, timer: nextTime };
        }
        if (Math.random() < 0.008) {
          const rolls = [
            { title: "Cooperative Economic Boom", desc: "Cooperative market trade surges! Passive business revenue yields +50% for 60s.", timer: 60, type: "boom" },
            { title: "Heavy Weather Windstorm", desc: "Gales sweep Greenwood! Double stamina cost to harvest, but logs salvage scattered around the map.", timer: 45, type: "storm" },
            { title: "Historic Commerce Parade", desc: "Parade day! Apprentice travel movement rates are doubled for 60s.", timer: 60, type: "parade" }
          ] as const;
          const selectedRoll = rolls[Math.floor(Math.random() * rolls.length)];
          addLog(`🔔 Event Triggered: "${selectedRoll.title}"! ${selectedRoll.desc}`);
          playRetroTone('level', 1.3);
          return selectedRoll;
        }
        return null;
      });

      // --- DYNAMIC WEATHER HAZARDS: LIGHTNING STRIKES ---
      if (weather === 'rainy' && Math.random() < 0.08) {
        const lx = Math.floor(Math.random() * MAP_SIZE);
        const ly = Math.floor(Math.random() * MAP_SIZE);
        setMapGrid(prevGrid => {
          if (!prevGrid || !prevGrid[ly]?.[lx]) return prevGrid;
          const targetTile = prevGrid[ly][lx];
          // Strike grass tiles, making them "quarry_stone" (obsidian deposit / smoldering ash)
          if (targetTile.type === 'grass') {
            const nextGrid = prevGrid.map((row, y) => row.map((tile, x) => {
              if (x === lx && y === ly) {
                return {
                  ...tile,
                  type: 'quarry_stone' as const,
                  cooldownRemaining: 0,
                  isRubble: false
                };
              }
              return tile;
            }));
            addLog(`⚡ LIGHTNING STRIKE! Lightning hits coordinates [${lx}, ${ly}], leaving behind a rare Obsidian / Smoldering Ash deposit!`);
            playRetroTone('strike', 1.8);
            return nextGrid;
          }
          return prevGrid;
        });
      }

      // Passive stamina restore from AME Church stages
      const churchLvl = landmarkStages.ame_church || 0;
      if (churchLvl > 0) {
        setStamina(st => Math.min(maxStamina, st + churchLvl * 0.3));
      }

      // 1. Heritage catalyst duration decrements
      if (heritageCatalystTime > 0) {
        setHeritageCatalystTime(prev => prev - 1);
      }

      // 2. Cooldown cycles
      setMapGrid(prevGrid => {
        if (!prevGrid || !prevGrid.length) return prevGrid;
        let gridChanged = false;
        const newGrid = prevGrid.map(row => {
          let rowChanged = false;
          const newRow = row.map(tile => {
            if ((tile.cooldownRemaining && tile.cooldownRemaining > 0) || (tile.isConstructing && tile.constructionTimer !== undefined)) {
              let updated = { ...tile };
              if (updated.cooldownRemaining && updated.cooldownRemaining > 0) {
                const nextCD = updated.cooldownRemaining - 1;
                if (nextCD <= 0) {
                  updated.cooldownRemaining = 0;
                  updated.isStump = false;
                  updated.isRubble = false;
                } else {
                  updated.cooldownRemaining = nextCD;
                }
              }
              if (updated.isConstructing && updated.constructionTimer !== undefined) {
                const nextTimer = updated.constructionTimer - 1;
                if (nextTimer <= 0) {
                  updated.isConstructing = false;
                  updated.constructionTimer = 0;
                  updated.type = updated.businessId === 'cottage' ? 'cottage' : 'built_business';
                  playRetroTone('level', 1.5);
                } else {
                  updated.constructionTimer = nextTimer;
                }
              }
              rowChanged = true;
              return updated;
            }
            return tile;
          });
          if (rowChanged) gridChanged = true;
          return rowChanged ? newRow : row;
        });
        return gridChanged ? newGrid : prevGrid;
      });

      // 3. Passive commercial monetary output loops
      let earnedBswx = 0;
      let earnedRep = 0;
      setMapGrid(currentGrid => {
        if (!currentGrid || !currentGrid.length) return currentGrid;
        currentGrid.forEach(row => row.forEach(tile => {
          if (tile.type === 'built_business' && tile.businessId && !tile.isConstructing) {
            const config = BUSINESS_CATALOG[tile.businessId];
            if (config) {
              const currentLvl = tile.level || 1;
              const multiplier = Math.pow(2, currentLvl - 1);
              let yieldBswx = config.bswxReward * multiplier;
              let yieldRep = config.repReward * multiplier;

              // Cottage bonus: compounding 1.5x per built cottage
              const cottageFactor = Math.pow(1.5, cottagesCount);
              yieldBswx *= cottageFactor;

              // Community Garden Adjacency bonus: +50% Reputation reward per adjacent garden level
              let gardenRepFactor = 1.0;
              const { x: tx, y: ty } = tile;
              for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                  if (dx === 0 && dy === 0) continue;
                  const nx = tx + dx;
                  const ny = ty + dy;
                  if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                    const adjTile = currentGrid[ny]?.[nx];
                    if (adjTile && adjTile.type === 'built_business' && adjTile.businessId === 'garden' && !adjTile.isConstructing) {
                      const gardenLvl = adjTile.level || 1;
                      gardenRepFactor += 0.5 * gardenLvl;
                    }
                  }
                }
              }
              yieldRep *= gardenRepFactor;

              // Catalyst bonus: +25% during active buff
              if (heritageCatalystTime > 0) {
                yieldBswx *= 1.25;
                yieldRep *= 1.25;
              }

              earnedBswx += (yieldBswx / 30); // scale speed down per second
              earnedRep += (yieldRep / 30);
            }
          }
        }));
        return currentGrid;
      });

      if (earnedBswx > 0 || earnedRep > 0) {
        let merchantMult = charArchetype === 'merchant' ? 1.15 : 1.0;
        if (charHeirloom === 'heritage_ledger') {
          merchantMult *= 1.10;
        }
        const organizerMult = charArchetype === 'organizer' ? 1.15 : 1.0;
        setBswx(prev => Number((prev + earnedBswx * merchantMult).toFixed(2)));
        setReputation(prev => Number((prev + earnedRep * organizerMult).toFixed(2)));
      }

      // 3.5 Record historical output snapshots for built businesses
      const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setTileOutputHistory(prev => {
        const next = { ...prev };
        let hasChanges = false;
        
        mapGrid.forEach(row => row.forEach(tile => {
          if (tile.type === 'built_business' && tile.businessId) {
            const key = `${tile.x}_${tile.y}`;
            const config = BUSINESS_CATALOG[tile.businessId];
            if (config) {
              const currentLvl = tile.level || 1;
              const multiplier = Math.pow(2, currentLvl - 1);
              let yieldBswx = config.bswxReward * multiplier;
              let yieldRep = config.repReward * multiplier;

              // Cottage bonus: compounding 1.5x per built cottage
              const cottageFactor = Math.pow(1.5, cottagesCount);
              yieldBswx *= cottageFactor;

              // Community Garden Adjacency bonus: +50% Reputation reward per adjacent garden level
              let gardenRepFactor = 1.0;
              const { x: tx, y: ty } = tile;
              for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                  if (dx === 0 && dy === 0) continue;
                  const nx = tx + dx;
                  const ny = ty + dy;
                  if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                    const adjTile = mapGrid[ny]?.[nx];
                    if (adjTile && adjTile.type === 'built_business' && adjTile.businessId === 'garden' && !adjTile.isConstructing) {
                      const gardenLvl = adjTile.level || 1;
                      gardenRepFactor += 0.5 * gardenLvl;
                    }
                  }
                }
              }
              yieldRep *= gardenRepFactor;

              // Catalyst bonus: +25% during active buff
              if (heritageCatalystTime > 0) {
                yieldBswx *= 1.25;
                yieldRep *= 1.25;
              }

              // Multipliers based on archetype
              let bswxMult = charArchetype === 'merchant' ? 1.15 : 1.0;
              if (charHeirloom === 'heritage_ledger') {
                bswxMult *= 1.10;
              }
              const repMult = charArchetype === 'organizer' ? 1.15 : 1.0;

              const finalBswx = Number((yieldBswx * bswxMult).toFixed(1));
              const finalRep = Number((yieldRep * repMult).toFixed(1));

              const arr = prev[key] ? [...prev[key]] : [];
              arr.push({ time: timeStr, bswx: finalBswx, rep: finalRep });
              if (arr.length > 15) {
                arr.shift();
              }
              next[key] = arr;
              hasChanges = true;
            }
          }
        }));

        return hasChanges ? next : prev;
      });

      // 4. Apprentice Automation labors loop
      setApprentices(prevApps => {
        return prevApps.map(app => {
          let updated = { ...app };
          
          if (app.role === 'craftsman') {
            if (updated.actionTimer === undefined || updated.actionTimer <= 0) {
              updated.actionTimer = 10;
            } else {
              updated.actionTimer -= 1;
              if (updated.actionTimer <= 0) {
                if (app.type === 'wood' && wood >= 10) {
                  setWood(w => w - 10);
                  setPolishedPlank(p => p + 1);
                  addLog("Automated Crafting: Apprentice refined 10 Wood -> 1 Polished Plank.");
                  playRetroTone('success', 0.5);
                } else if (app.type === 'stone' && stone >= 10) {
                  setStone(s => s - 10);
                  setReinforcedBrick(b => b + 1);
                  addLog("Automated Crafting: Apprentice refined 10 Stone -> 1 Reinforced Brick.");
                  playRetroTone('success', 0.5);
                } else if (app.type === 'clay' && clay >= 10) {
                  setClay(c => c - 10);
                  setCeramics(cer => cer + 1);
                  addLog("Automated Crafting: Apprentice refined 10 Clay -> 1 Fine Ceramic.");
                  playRetroTone('success', 0.5);
                }
              }
            }
            return updated;
          }
          
          if (updated.state === 'idle') {
            // Locate nearest active node coordinates
            let bestDist = Infinity;
            let closestNode: MapTile | null = null;
            mapGrid.forEach(row => row.forEach(tile => {
              if (updated.type === 'wood' && tile.type === 'forest_tree' && !tile.isStump) {
                const dist = Math.abs(tile.x - app.x) + Math.abs(tile.y - app.y);
                if (dist < bestDist) {
                  bestDist = dist;
                  closestNode = tile;
                }
              } else if (updated.type === 'stone' && tile.type === 'quarry_stone' && !tile.isRubble) {
                const dist = Math.abs(tile.x - app.x) + Math.abs(tile.y - app.y);
                if (dist < bestDist) {
                  bestDist = dist;
                  closestNode = tile;
                }
              } else if (updated.type === 'clay' && tile.type === 'clay_deposit' && !tile.isSilt) {
                const dist = Math.abs(tile.x - app.x) + Math.abs(tile.y - app.y);
                if (dist < bestDist) {
                  bestDist = dist;
                  closestNode = tile;
                }
              }
            }));

            if (closestNode) {
              updated.targetX = (closestNode as MapTile).x;
              updated.targetY = (closestNode as MapTile).y;
              updated.state = 'walking';
            }
          } else if (updated.state === 'walking') {
            const dx = Math.sign(updated.targetX - updated.x);
            const dy = Math.sign(updated.targetY - updated.y);
            const isAdjacent = (Math.abs(updated.targetX - updated.x) + Math.abs(updated.targetY - updated.y)) <= 1;

            if (isAdjacent) {
              // Lock adjacent stance and strike
              updated.state = 'harvesting';
              updated.actionTimer = Math.max(1, 4 - apprenticeSpeedLvl); // Speed lvl 1 = 3s, lvl 2 = 2s, lvl 3 = 1s
              // Create physical particle sparkles
              spawnApprenticeParticles(updated.targetX, updated.targetY, updated.type);
            } else {
              // Steps closer Manhattan path find
              const walkSpeed = (activeEvent && activeEvent.type === 'parade') ? 2 : 1;
              for (let step = 0; step < walkSpeed; step++) {
                const stepDx = Math.sign(updated.targetX - updated.x);
                const stepDy = Math.sign(updated.targetY - updated.y);
                const stepIsAdj = (Math.abs(updated.targetX - updated.x) + Math.abs(updated.targetY - updated.y)) <= 1;
                if (stepIsAdj) break;
                if (stepDx !== 0) {
                  const nextTile = mapGrid[updated.y]?.[updated.x + stepDx];
                  if (nextTile && nextTile.type === 'grass') {
                    updated.x += stepDx;
                    spawnFootstepDust(updated.x, updated.y);
                  } else if (stepDy !== 0) {
                    updated.y += stepDy;
                    spawnFootstepDust(updated.x, updated.y);
                  }
                } else if (stepDy !== 0) {
                  const nextTile = mapGrid[updated.y + stepDy]?.[updated.x];
                  if (nextTile && nextTile.type === 'grass') {
                    updated.y += stepDy;
                    spawnFootstepDust(updated.x, updated.y);
                  }
                }
              }
            }
          } else if (updated.state === 'harvesting') {
            updated.actionTimer -= 1;
            if (updated.actionTimer <= 0) {
              // Complete strike
              updated.state = 'idle';
              // Trigger node depletion
              setMapGrid(prevGrid => {
                if (!prevGrid || !prevGrid.length) return prevGrid;
                let gridChanged = false;
                const nextGrid = prevGrid.map(row => {
                  let rowChanged = false;
                  const newRow = row.map(tile => {
                    if (tile.x === updated.targetX && tile.y === updated.targetY) {
                      rowChanged = true;
                      return {
                        ...tile,
                        isStump: updated.type === 'wood' ? true : tile.isStump,
                        isRubble: updated.type === 'stone' ? true : tile.isRubble,
                        isSilt: updated.type === 'clay' ? true : tile.isSilt,
                        cooldownRemaining: 30 // precisely thirty seconds
                      };
                    }
                    return tile;
                  });
                  if (rowChanged) gridChanged = true;
                  return rowChanged ? newRow : row;
                });
                return gridChanged ? nextGrid : prevGrid;
              });

              // Add inventory materials
              const outputQty = 2 + apprenticeOutputLvl; // lvl 1 = +3, lvl 2 = +4, lvl 3 = +5, lvl 4 = +6
              if (updated.type === 'wood') {
                setWood(prev => prev + outputQty);
                addLog(`Companion Labor: Digital Apprentice deposited +${outputQty} Wood.`);
              } else if (updated.type === 'stone') {
                setStone(prev => prev + outputQty);
                addLog(`Companion Labor: Digital Apprentice deposited +${outputQty} Stone.`);
              } else if (updated.type === 'clay') {
                setClay(prev => prev + outputQty);
                addLog(`Companion Labor: Digital Apprentice deposited +${outputQty} Clay.`);
              }
              playRetroTone('success', 0.5);
            }
          }
          return updated;
        });
      });

      // 5. Update price trends history every 5 seconds
      setPriceTick(prevTick => {
        const nextTick = prevTick + 1;
        if (nextTick >= 5) {
          const currentPrices = getDynamicMarketPrices();
          setPriceHistory(prevHist => {
            const nextHist = { ...prevHist };
            Object.keys(currentPrices).forEach(key => {
              const arr = prevHist[key] ? [...prevHist[key]] : [];
              arr.push(currentPrices[key as keyof typeof currentPrices]);
              if (arr.length > 12) {
                arr.shift();
              }
              nextHist[key] = arr;
            });
            return nextHist;
          });
          return 0;
        }
        return nextTick;
      });

    }, 1000);
    return () => clearInterval(clock);
  }, [mapGrid, cottagesCount, heritageCatalystTime, charArchetype, charHeirloom, apprenticeSpeedLvl, apprenticeOutputLvl, weather]);

  // Particle updates loop for arcing physics gravity
  useEffect(() => {
    const pTimer = setInterval(() => {
      setBurstParticles(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5, // gravity effect
            opacity: Math.max(0, p.opacity - 0.05)
          }))
          .filter(p => p.opacity > 0);
      });
    }, 40);
    return () => clearInterval(pTimer);
  }, []);

  // --- CONTRACT A NEW APPRENTICE ---
  const hireApprentice = (type: 'wood' | 'stone' | 'clay') => {
    if (bswx < 150) {
      addLog("Fails: Contract of specialized apprentice NPC requires 150 BSWX.");
      playRetroTone('fail');
      return;
    }
    setBswx(prev => prev - 150);
    const newApp: DigitalApprentice = {
      id: Date.now(),
      x: 16,
      y: 19,
      type,
      state: 'idle',
      targetX: 16,
      targetY: 19,
      actionTimer: 0,
      skin: SPECIALIZED_APP_SKINS[Math.floor(Math.random() * SPECIALIZED_APP_SKINS.length)],
      hair: SPECIALIZED_APP_HAIR[Math.floor(Math.random() * SPECIALIZED_APP_HAIR.length)],
      clothing: SPECIALIZED_APP_CLOTHING[Math.floor(Math.random() * SPECIALIZED_APP_CLOTHING.length)]
    };
    setApprentices(prev => [...prev, newApp]);
    addLog(`Success: Contracted automated Digital Apprentice targeting ${type.toUpperCase()}`);
    playRetroTone('success');
  };

  // --- MOVEMENT COLLISIONS EXCLUSIONS BOUNDARY ---
  const attemptMove = (dir: 'N' | 'S' | 'E' | 'W') => {
    if (isHarvestingFreeze) return;
    if (stamina <= 0) {
      addLog("stamina exhausted! Rest inside Greenwood Remnants.");
      return;
    }

    setDirection(dir);
    if (dir === 'N') setPlayerDirection('UP');
    if (dir === 'S') setPlayerDirection('DOWN');
    if (dir === 'W') setPlayerDirection('LEFT');
    if (dir === 'E') setPlayerDirection('RIGHT');

    setIsMoving(true);
    setTimeout(() => setIsMoving(false), 120);

    let nextX = playerXRef.current;
    let nextY = playerYRef.current;
    if (dir === 'N') nextY -= 1;
    if (dir === 'S') nextY += 1;
    if (dir === 'W') nextX -= 1;
    if (dir === 'E') nextX += 1;

    if (nextX < 0 || nextX >= MAP_SIZE || nextY < 0 || nextY >= MAP_SIZE) {
      addLog("Boundary barriers reached.");
      return;
    }

    // BLOCK NPC spaces & River elements & build blocks
    const npcBlock = npcs.some(n => n.x === nextX && n.y === nextY);
    const tile = mapGrid[nextY]?.[nextX];
    
    if (!tile) return;

    if (tile.type === 'river') {
      addLog("Eastern exodus borders reached. Water flows beautifully.");
      return;
    }

    const isSolidRes = (
      (tile.type === 'forest_tree' && !tile.isStump) ||
      (tile.type === 'quarry_stone' && !tile.isRubble)
    );

    const isSolidCompound = tile.type === 'center_greenwood' && !(nextX === 16 && nextY === 17);

    if (npcBlock || isSolidRes || isSolidCompound || tile.type === 'built_business' || tile.type === 'cottage') {
      // PREEMPTIVE VALIDATION fails
      setCollidedTile({ x: nextX, y: nextY });
      playRetroTone('fail', 0.2);
      addLog(`Halt! Collision blocked, velocity set to 0.`);
      return;
    }

    setCollidedTile(null);
    playerXRef.current = nextX;
    playerYRef.current = nextY;
    setPlayerX(nextX);
    setPlayerY(nextY);
    setSelectedX(nextX);
    setSelectedY(nextY);
    playRetroTone('strike', 0.25);
    spawnFootstepDust(nextX, nextY);

    // COORDINATES GEOGRAPHICAL EXPLORATION REWARDS (INTRICATE LP PATHWAY) & FOG EXPLORATION BONUS
    const coordStr = `${nextX},${nextY}`;
    // State-seeded pure pseudo-random Walk Seed
    const walkSeed = ((currentSystemTime * 7919 + nextX * 31 + nextY * 17) % 1000) / 1000;
    if (!visitedCoordinates.includes(coordStr)) {
      setVisitedCoordinates(prev => {
        const nextVisited = [...prev, coordStr];
        
        // Milestone reward for Fog exploration! Check milestone limits like multiples of 20
        if (nextVisited.length % 20 === 0) {
          const milestoneCoins = 10.0;
          const milestoneLP = 3;
          setTimeout(() => {
            setBswx(c => Number((c + milestoneCoins).toFixed(2)));
            setLegacyPoints(lp => lp + milestoneLP);
            setStamina(st => Math.min(100, st + 25)); // Boost 25% stamina
            addLog(`📡 CARTOGRAPHY MILESTONE: Cleared secondary grid quadrant! Mapped ${nextVisited.length} coordinates. Awarded +${milestoneCoins} Town Coins, +${milestoneLP} LP, and restored +25% Stamina!`);
            playRetroTone('level', 0.4);
          }, 0);
        }
        
        return nextVisited;
      });

      // Immediate Fog Exploration / Cartography discovery award
      const discoveryCoins = 0.5;
      setBswx(c => Number((c + discoveryCoins).toFixed(2)));
      setStamina(st => Math.min(100, st + 1.5)); // Boost 1.5% stamina on uncharted paths

      // 15% chance to salvage materials in the fog of Greenwood
      if (walkSeed < 0.15) {
        const salvageSel = Math.floor((walkSeed * 100) % 3);
        if (salvageSel === 0) {
          setWood(w => w + 1);
          addLog(`🗺️ Uncharted Salvage: Cleared fog at (${nextX}, ${nextY}) and salvaged +1 raw Wood from timber mounds! (+0.5 Coins)`);
        } else if (salvageSel === 1) {
          setStone(s => s + 1);
          addLog(`🗺️ Uncharted Salvage: Cleared fog at (${nextX}, ${nextY}) and extracted +1 Stone from slate formations! (+0.5 Coins)`);
        } else {
          setClay(cl => cl + 1);
          addLog(`🗺️ Uncharted Salvage: Cleared fog at (${nextX}, ${nextY}) and gathered +1 fine Clay from silt deposits! (+0.5 Coins)`);
        }
      } else {
        addLog(`🗺️ Unfogged Coordinate: Registered GPS waypoint at (${nextX}, ${nextY}). Cartographer Guild awarded +0.5 Town Coins.`);
      }

      if (walkSeed >= 0.15 && walkSeed < 0.35) {
        setLegacyPoints(lp => lp + 1);
        addLog(`🗺 Landmark Discovery: Reflecting on grid coordinate properties (${nextX}, ${nextY}) teaches unique zoning histories (+1 LP).`);
        playRetroTone('level', 0.3);
      }
    }

    // DYNAMIC FOGGY WEATHER SYSTEM MIST DISCOVERY
    if (weather === 'foggy' && walkSeed < 0.08) {
      const luckyFind = ((currentSystemTime * 997 + nextX * 13 + nextY * 7) % 1000) / 1000;
      if (luckyFind < 0.35) {
        setBswx(prev => Number((prev + 5).toFixed(2)));
        addLog("🌫 Mist Discovery! You caught sight of a lost leather pouch. (+5.0 BSWX coins!)");
      } else if (luckyFind < 0.65) {
        setWood(prev => prev + 2);
        addLog("🌫 Mist Discovery! Found dry pine wood branches snapped off by the elements. (+2 Wood)");
      } else if (luckyFind < 0.90) {
        setStone(prev => prev + 2);
        addLog("🌫 Mist Discovery! Spotted clean wash limestone chunks on the valley path. (+2 Stone)");
      } else {
        setLegacyPoints(prev => prev + 2);
        addLog("🌫 Mist Discovery! Found a weathered handbook pages detailing New Greenwood pioneers. (+2 LP)");
      }
      playRetroTone('level', 0.5);
    }
  };

  // --- CONSTRUCT RESIDENTIAL COTTAGE ---
  function constructPioneerCottage(tile: MapTile) {
    const costMult = weather === 'sunset_glow' ? 0.8 : 1.0;
    const reqPlank = Math.max(1, Math.round(20 * costMult));
    const reqBrick = Math.max(1, Math.round(20 * costMult));

    if (polishedPlank < reqPlank || reinforcedBrick < reqBrick || reputation < 100) {
      addLog(`Req: Pioneer Cottage holds ${reqPlank}x Planks, ${reqBrick}x Bricks, & 100 Reputation.`);
      playRetroTone('fail');
      return;
    }
    setPolishedPlank(p => p - reqPlank);
    setReinforcedBrick(b => b - reqBrick);
    const reputationConsumed = weather === 'sunset_glow' ? 30 : 40;
    setReputation(r => Math.max(0, r - reputationConsumed));

    setMapGrid(prevGrid => {
      return prevGrid.map(row => row.map(t => {
        if (t.x === tile.x && t.y === tile.y) {
          return {
            ...t,
            isConstructing: true,
            constructionTimer: 8,
            businessId: 'cottage',
            level: 1
          };
        }
        return t;
      }));
    });

    setCottagesCount(prev => prev + 1);
    addLog("Erected Pioneer Cottage scaffoldings! Multiplier +50% active commercial returns.");
    playRetroTone('success');
  }

  // --- HARVEST STRIKE INTERACTION ---
  function triggerSuccessfulHarvest(tile: MapTile, type: 'tree' | 'stone' | 'clay') {
    setIsHarvestingFreeze(true);
    setHarvestTargetCoords({ x: tile.x, y: tile.y, type });
    playRetroTone('strike', 1.0);

    // Multistage visual shock triggers
    let shockTicks = 0;
    const interval = setInterval(() => {
      setHarvestFlashFrame(prev => (prev === 1 ? 2 : 1)); // alternates brightness filter
      shockTicks++;
      if (shockTicks > 6) {
        clearInterval(interval);
        setHarvestFlashFrame(0);
      }
    }, 150);

    if (type === 'stone' || type === 'clay') {
      setHarvestBounceState(true);
      setTimeout(() => setHarvestBounceState(false), 400);
    }

    // Dynamic Physics Star Sparkles
    const list: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const seedVal = (currentSystemTime * 7919 + tile.x * 13 + tile.y * 7 + i * 37) % 100;
      // Define color variations based on type
      let color = '#22c55e'; // default green wood
      if (type === 'tree') {
        color = i % 2 === 0 ? '#22c55e' : '#15803d'; // green/dark green wood splinters
      } else if (type === 'stone') {
        color = i % 2 === 0 ? '#facc15' : '#f97316'; // yellow/orange stone sparks
      } else if (type === 'clay') {
        color = i % 2 === 0 ? '#bc6c25' : '#dda15e'; // terracotta/sandy clay splatters
      }
      list.push({
        id: currentSystemTime * 100 + i,
        x: tile.x * 24 + 12,
        y: tile.y * 24 + 12,
        vx: (seedVal % 11) - 5.5,
        vy: -((seedVal % 8) + 4), // higher upward launch velocity for dramatic arc
        color,
        size: (seedVal % 4) + 3,
        opacity: 1
      });
    }
    setBurstParticles(prev => [...prev, ...list]);

    // Depletes target and awards inventory materials after 1500ms
    setTimeout(() => {
      setMapGrid(prevGrid => {
        return prevGrid.map(row => row.map(t => {
          if (t.x === tile.x && t.y === tile.y) {
            return {
              ...t,
              isStump: type === 'tree' ? true : t.isStump,
              isRubble: type === 'stone' ? true : t.isRubble,
              isSilt: type === 'clay' ? true : t.isSilt,
              cooldownRemaining: 30 // 30-second localized countdown
            };
          }
          return t;
        }));
      });

      // stamina logic cost
      let staminaCost = 4;
      if (weather === 'rainy') {
        staminaCost = 5;
      } else if (weather === 'sunset_glow') {
        staminaCost = 3;
      } else if (weather === 'foggy') {
        staminaCost = 6; // Deep fog requires high effort
      }
      
      // Heavy windstorm event doubles stamina cost
      if (activeEvent && activeEvent.type === 'storm') {
        staminaCost *= 2;
      }

      setStamina(prev => {
        const next = Math.max(0, prev - staminaCost);
        if (next <= 0) {
          setShowFaintScreen(true);
          addLog("Oh no! You collapsed from exhaustion! Rest in town...");
          playRetroTone('fail', 1.5);
        }
        return next;
      });

      if (type === 'tree') {
        let woodAdded = 5;
        let bonusText = "";
        if (weather === 'sunny') {
          woodAdded = 6;
          bonusText = "🌤 Solar boost: +6 Wood logs, -4 Stamina!";
        } else if (weather === 'rainy') {
          woodAdded = 4;
          bonusText = "🌧 Wet logs: +4 Wood logs, -5 Stamina (slippery mud).";
        } else if (weather === 'sunset_glow') {
          woodAdded = 5;
          bonusText = "🌇 Golden evening: +5 Wood logs, -3 Stamina (conserved).";
        } else {
          woodAdded = 5;
          bonusText = "🌫 Foggy Timber: +5 Wood logs, -4 Stamina.";
        }
        setWood(prev => prev + woodAdded);
        addLog(bonusText);
      } else if (type === 'stone') {
        let stoneAdded = 5;
        let bonusText = "";
        if (weather === 'sunny') {
          stoneAdded = 6;
          bonusText = "🌤 Solar boost: +6 Stone ore, -4 Stamina!";
        } else if (weather === 'rainy') {
          stoneAdded = 7;
          bonusText = "🌧 Rain washed: +7 Stone ore (easier prying), -5 Stamina (heavy mud).";
        } else if (weather === 'sunset_glow') {
          stoneAdded = 5;
          bonusText = "🌇 Golden evening: +5 Stone ore, -3 Stamina (conserved).";
        } else {
          stoneAdded = 5;
          bonusText = "🌫 Foggy Quarrying: +5 Stone ore, -4 Stamina.";
        }
        setStone(prev => prev + stoneAdded);
        addLog(bonusText);
      } else if (type === 'clay') {
        let clayAdded = 5;
        let bonusText = "";
        if (weather === 'rainy') {
          clayAdded = 8;
          bonusText = "🌧 Riverbed Rain-Silt: +8 Silt Clay (soft wet mud makes digging easy!), -5 Stamina.";
        } else if (weather === 'sunny') {
          clayAdded = 4;
          bonusText = "🌤 Sunbaked Soil: +4 Silt Clay (soil is harder to pry under full sun), -4 Stamina.";
        } else if (weather === 'sunset_glow') {
          clayAdded = 6;
          bonusText = "🌇 Golden Evening: +6 Silt Clay, -3 Stamina (efficient digging ambient conditions).";
        } else {
          clayAdded = 5;
          bonusText = "🌫 Foggy Silt: +5 Silt Clay, -4 Stamina.";
        }
        setClay(prev => prev + clayAdded);
        addLog(bonusText);
      }
      setIsHarvestingFreeze(false);
      setHarvestTargetCoords(null);
    }, 1500);
  }

  // --- HARVEST STRIKE INTERACTION ---
  const handleActionInput = () => {
    let targetX = playerX;
    let targetY = playerY;
    if (playerDirection === 'UP') targetY -= 1;
    if (playerDirection === 'DOWN') targetY += 1;
    if (playerDirection === 'LEFT') targetX -= 1;
    if (playerDirection === 'RIGHT') targetX += 1;

    // Check interaction with and adjacent NPCs
    const adjacentNPC = npcs.find(n => n.x === targetX && n.y === targetY);
    if (adjacentNPC) {
      setActiveNPC(adjacentNPC);
      playRetroTone('success');
      return;
    }

    // Check center Greenwood entrance
    if (targetX === 16 && targetY === 17) {
      setIsGamePaused(true);
      setPauseMenuTab('crafting');
      playRetroTone('success');
      return;
    }

    const tile = mapGrid[targetY]?.[targetX];
    if (!tile) return;

    if (tile.type === 'landmark' && tile.landmarkId) {
      triggerLandmarkInspection(tile.landmarkId);
    } else if (tile.type === 'clay_deposit' && !tile.isSilt) {
      triggerSuccessfulHarvest(tile, 'clay');
    } else if (tile.type === 'forest_tree' && !tile.isStump) {
      // requires axe
      triggerSuccessfulHarvest(tile, 'tree');
    } else if (tile.type === 'quarry_stone' && !tile.isRubble) {
      // requires hammer
      triggerSuccessfulHarvest(tile, 'stone');
    } else if (tile.type === 'leasehold') {
      // check if it is Z-1 Residential Zone to construct cottage
      // Plot coordinates: (32, 12), (34, 12), (32, 14), (34, 14)
      const resZ1 = (targetX === 32 || targetX === 34) && (targetY === 12 || targetY === 14);
      if (resZ1) {
        constructPioneerCottage(tile);
      } else {
        addLog("Leasehold Plot. Construct properties from centralized control bar.");
      }
    }
  };

  // Keyboard binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (screen !== 'game') return;

      const key = e.key.toLowerCase();
      if (e.key === 'Escape' || key === 'p') {
        e.preventDefault();
        setIsGamePaused(p => !p);
        startBackgroundSoundtrack();
        return;
      }

      if (isGamePaused) return;

      if (key === 'w' || e.key === 'ArrowUp') {
        e.preventDefault();
        attemptMove('N');
      } else if (key === 's' || e.key === 'ArrowDown') {
        e.preventDefault();
        attemptMove('S');
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        attemptMove('W');
      } else if (key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        attemptMove('E');
      } else if (key === 'e' || e.key === ' ') {
        e.preventDefault();
        handleActionInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isGamePaused, playerX, playerY, mapGrid, stamina]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setGridContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const constructStorefront = (catalogKey: string) => {
    // Requires leasehold tile selection
    const tile = mapGrid[selectedY]?.[selectedX];
    if (!tile || tile.type !== 'leasehold') {
      addLog("Fails: Select an empty yellow plot cell on the viewport matrix first.");
      playRetroTone('fail');
      return;
    }
    const config = BUSINESS_CATALOG[catalogKey];
    if (!config) return;

    if (wood < config.woodCost || stone < config.stoneCost || legacyPoints < config.legacyCost) {
      addLog(`Req: ${config.woodCost} Wood, ${config.stoneCost} Stone, ${config.legacyCost} LP.`);
      playRetroTone('fail');
      return;
    }

    setWood(w => w - config.woodCost);
    setStone(s => s - config.stoneCost);
    setLegacyPoints(l => l - config.legacyCost);

    setMapGrid(prevGrid => {
      return prevGrid.map(row => row.map(t => {
        if (t.x === tile.x && t.y === tile.y) {
          return {
            ...t,
            isConstructing: true,
            constructionTimer: 6,
            businessId: catalogKey,
            level: 1
          };
        }
        return t;
      }));
    });

    addLog(`Success: Grid lease plots assigned. Scaffolding ${config.name}.`);
    playRetroTone('success');
  };

  const upgradeStorefront = (tile: MapTile) => {
    if (!tile.businessId || tile.level === undefined) return;
    const currentLvl = tile.level;
    if (currentLvl >= 5) {
      addLog("Storefront reached absolute max 5 tier.");
      return;
    }

    // refined processing components scale upgrades
    const levelMult = charHeirloom === 'brass_level' ? 0.8 : 1.0;
    const costPlanks = Math.max(1, Math.round(currentLvl * 10 * levelMult));
    const costBricks = Math.max(1, Math.round(currentLvl * 10 * levelMult));
    const costLP = Math.max(1, Math.round(currentLvl * 30 * levelMult));

    if (polishedPlank < costPlanks || reinforcedBrick < costBricks || legacyPoints < costLP) {
      addLog(`Req: ${costPlanks}x Planks, ${costBricks}x Bricks, & ${costLP} LP.`);
      playRetroTone('fail');
      return;
    }

    setPolishedPlank(p => p - costPlanks);
    setReinforcedBrick(b => b - costBricks);
    setLegacyPoints(lp => lp - costLP);

    setMapGrid(prev => prev.map(row => row.map(t => {
      if (t.x === tile.x && t.y === tile.y) {
        return {
          ...t,
          isConstructing: true,
          constructionTimer: 5,
          level: currentLvl + 1
        };
      }
      return t;
    })));

    addLog(`Initiated Scaffolding upgrade. +1 level after delay.`);
    playRetroTone('success');
  };

  const demolishStructure = (tile: MapTile) => {
    if (tile.type !== 'built_business' && tile.type !== 'cottage') {
      addLog("Cannot demolish: Only built storefronts or cottages can be cleared.");
      playRetroTone('fail');
      return;
    }

    setMapGrid(prev => prev.map(row => row.map(t => {
      if (t.x === tile.x && t.y === tile.y) {
        return {
          ...t,
          type: 'leasehold',
          businessId: undefined,
          level: undefined,
          specialization: null,
          isConstructing: false,
          constructionTimer: undefined
        };
      }
      return t;
    })));

    addLog(`💥 Demolished structural assets on plot (${tile.x}, ${tile.y}). Lease plot returned to vacancy.`);
    playRetroTone('fail', 1.2);
  };



  const handleMarketTransaction = (
    asset: 'wood' | 'stone' | 'clay' | 'polishedPlank' | 'reinforcedBrick' | 'ceramics',
    action: 'buy' | 'sell',
    qty: 1 | 10
  ) => {
    const prices = getDynamicMarketPrices();
    const spot = prices[asset];
    const unitPrice = action === 'buy' ? Math.round(spot * 1.25 * 10) / 10 : Math.round(spot * 0.95 * 10) / 10;
    const totalCost = Number((unitPrice * qty).toFixed(2));

    if (action === 'buy') {
      if (bswx < totalCost) {
        addLog(`Fails: Insufficient funds. Needs ${totalCost} BSWX to buy ${qty}x ${asset.toUpperCase()}.`);
        playRetroTone('fail');
        return;
      }
      setBswx(prev => Number((prev - totalCost).toFixed(2)));
      if (asset === 'wood') setWood(p => p + qty);
      else if (asset === 'stone') setStone(p => p + qty);
      else if (asset === 'clay') setClay(p => p + qty);
      else if (asset === 'polishedPlank') setPolishedPlank(p => p + qty);
      else if (asset === 'reinforcedBrick') setReinforcedBrick(p => p + qty);
      else if (asset === 'ceramics') setCeramics(p => p + qty);
      addLog(`📈 Bought ${qty}x ${asset.toUpperCase()} for ${totalCost} BSWX.`);
      playRetroTone('success', 0.6);
    } else {
      let currentQty = 0;
      if (asset === 'wood') currentQty = wood;
      else if (asset === 'stone') currentQty = stone;
      else if (asset === 'clay') currentQty = clay;
      else if (asset === 'polishedPlank') currentQty = polishedPlank;
      else if (asset === 'reinforcedBrick') currentQty = reinforcedBrick;
      else if (asset === 'ceramics') currentQty = ceramics;

      if (currentQty < qty) {
        addLog(`Fails: Too few units of ${asset.toUpperCase()} in ledger to liquidate ${qty}x.`);
        playRetroTone('fail');
        return;
      }

      if (asset === 'wood') setWood(p => p - qty);
      else if (asset === 'stone') setStone(p => p - qty);
      else if (asset === 'clay') setClay(p => p - qty);
      else if (asset === 'polishedPlank') setPolishedPlank(p => p - qty);
      else if (asset === 'reinforcedBrick') setReinforcedBrick(p => p - qty);
      else if (asset === 'ceramics') setCeramics(p => p - qty);

      setBswx(prev => Number((prev + totalCost).toFixed(2)));
      addLog(`📉 Sold ${qty}x ${asset.toUpperCase()} to market for ${totalCost} BSWX.`);
      playRetroTone('success', 0.7);
    }
  };

  // --- INDUSTRIAL REFINEMENT PIPE ---
  const handleProcessRaw = (type: 'wood' | 'stone' | 'clay') => {
    if (type === 'wood') {
      if (wood < 10) {
        addLog("Fails: Polished Planks requires 10 raw wood logs.");
        playRetroTone('fail');
        return;
      }
      setWood(w => w - 10);
      setPolishedPlank(p => p + 1);
      addLog("Refined 10 Wood -> 1 Polished Plank instantly.");
    } else if (type === 'stone') {
      if (stone < 10) {
        addLog("Fails: Reinforced Bricks requires 10 raw quarry stone.");
        playRetroTone('fail');
        return;
      }
      setStone(s => s - 10);
      setReinforcedBrick(b => b + 1);
      addLog("Refined 10 Stone -> 1 Reinforced Brick instantly.");
    } else {
      if (clay < 10) {
        addLog("Fails: Fine Ceramics requires 10 raw Silt Clay.");
        playRetroTone('fail');
        return;
      }
      setClay(c => c - 10);
      setCeramics(c => c + 1);
      addLog("Refined 10 Silt Clay -> 1 Heated Fine Ceramic instantly.");
    }
    playRetroTone('success');
  };

  // --- CAFE CHEF COOKING PROVISIONS ---
  const handleEatFood = (foodType: 'pie' | 'tea') => {
    const healBoost = charHeirloom === 'thermos' ? 1.3 : 1.0;
    if (foodType === 'pie') {
      if (legacyPoints < 10) {
        addLog("Fails: Potato Pie cooking requires 10 Legacy Points.");
        playRetroTone('fail');
        return;
      }
      setLegacyPoints(lp => lp - 10);
      const heal = Math.round(50 * healBoost);
      setStamina(prev => Math.min(maxStamina, prev + heal));
      addLog(`Nourished Potato Pie! Stamina charged +${heal} slots.`);
    } else {
      if (wood < 4) {
        addLog("Fails: Warm Ginger Tea requires 4 Wood logs to boil.");
        playRetroTone('fail');
        return;
      }
      setWood(w => w - 4);
      const heal = Math.round(25 * healBoost);
      setStamina(prev => Math.min(maxStamina, prev + heal));
      addLog(`Boiled Ginger Tea! Stamina charged +${heal} slots.`);
    }
    playRetroTone('success');
  };

  // --- ANSWER MULTIPLE-CHOICE HISTORIC INTEL QUIZ ---
  const handleConfirmAnswer = (optionIndex: number) => {
    if (!activeQuiz) return;
    const { quiz, nNPC, stage } = activeQuiz;
    setQuizSelectedOption(optionIndex);

    if (optionIndex === quiz.correctIndex) {
      setQuizFeedback(`Correct Historical Truth! ${quiz.explanation}`);
      setQuizComplete(true);

      // Increment stage and award specific Legacy Points based on quest difficulty
      if (nNPC.id === 'gurley') {
        setQuestStageGurley(prev => prev + 1);
        setBswx(prev => prev + 100);
        if (stage === 1) {
          setLegacyPoints(lp => lp + 15);
          addLog("O.W. Gurley awards you +15 Legacy Points (LP) for locating base landmarks.");
        } else if (stage === 2) {
          setLegacyPoints(lp => lp + 20);
          addLog("O.W. Gurley awards you +20 Legacy Points (LP) for grocery integration.");
        } else if (stage === 3) {
          setLegacyPoints(lp => lp + 45);
          addLog("★ O.W. Gurley Quest Line completed! Williams Sugar Bowl is active! +45 LP.");
        }
      } else if (nNPC.id === 'rector') {
        setQuestStageRector(prev => prev + 1);
        setBswx(prev => prev + 120);
        if (stage === 1) {
          setLegacyPoints(lp => lp + 15);
        } else if (stage === 2) {
          setLegacyPoints(lp => lp + 20);
        } else if (stage === 3) {
          setLegacyPoints(lp => lp + 45);
          setReputation(r => r + 200);
          addLog("★ Sarah Rector Quest Line completed! Fine Ceramics secure the vault! +45 LP, +200 REP.");
        }
      } else if (nNPC.id === 'stradford') {
        setQuestStageStradford(prev => prev + 1);
        setBswx(prev => prev + 150);
        if (stage === 1) {
          setLegacyPoints(lp => lp + 15);
        } else if (stage === 2) {
          setLegacyPoints(lp => lp + 25);
        } else if (stage === 3) {
          setLegacyPoints(lp => lp + 55);
          setReputation(r => r + 250);
          addLog("★ J.B. Stradford Quest Line completed! Ultimate social elite. +55 LP, +250 REP.");
        }
      } else if (nNPC.id === 'gerumba') {
        setQuestStageGerumba(prev => prev + 1);
        setBswx(prev => prev + 180);
        setReputation(prev => prev + 30);
        if (stage === 1) {
          setLegacyPoints(lp => lp + 20);
        } else if (stage === 2) {
          setLegacyPoints(lp => lp + 30);
        } else if (stage === 3) {
          setLegacyPoints(lp => lp + 65);
          setReputation(r => r + 300);
          addLog("★ Pharoah Gerumba Quest Line completed! Moorish wisdom achieved. +65 LP, +300 REP.");
        }
      }

      // Award unique 120s golden catalyst boost !
      setHeritageCatalystTime(120);
      playRetroTone('level');
      addLog(`Sovereign Milestone: correct truth awards 'Cultural Heritage Catalyst' (+25% yield buffs!)`);
    } else {
      setQuizFeedback(`Respectful Correction: ${quiz.explanation} Try selecting again to honor history!`);
    }
  };

  // Check NPC available quest indicators
  const checkNpcStateIndicator = (npcId: string): 'quest' | 'incomplete' | 'ready' => {
    if (npcId === 'gurley') {
      if (questStageGurley === 1) {
        const hasGrocery = mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'grocery'));
        return hasGrocery ? 'ready' : 'incomplete';
      }
      if (questStageGurley === 2) {
        const groceryL2 = mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'grocery' && (t.level || 1) >= 2));
        return (groceryL2 && bswx >= 200) ? 'ready' : 'incomplete';
      }
      if (questStageGurley === 3) {
        const hasSugarBowl = mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'sugarbowl'));
        return (hasSugarBowl && reputation >= 150) ? 'ready' : 'incomplete';
      }
      return 'quest';
    } else if (npcId === 'rector') {
      if (questStageRector === 1) return (wood >= 50 && stone >= 50) ? 'ready' : 'incomplete';
      if (questStageRector === 2) return (apprentices.length >= 1 && reputation >= 100) ? 'ready' : 'incomplete';
      if (questStageRector === 3) return (clay >= 30 && ceramics >= 4) ? 'ready' : 'incomplete';
      return 'quest';
    } else if (npcId === 'stradford') {
      if (questStageStradford === 1) {
        const busCount = mapGrid.flat().filter(t => t.type === 'built_business').length;
        return busCount >= 2 ? 'ready' : 'incomplete';
      }
      if (questStageStradford === 2) return (polishedPlank >= 20 && reinforcedBrick >= 20) ? 'ready' : 'incomplete';
      if (questStageStradford === 3) return (legacyPoints >= 150 && reputation >= 250) ? 'ready' : 'incomplete';
      return 'quest';
    } else {
      if (questStageGerumba === 1) return reputation >= 50 ? 'ready' : 'incomplete';
      if (questStageGerumba === 2) return (cottagesCount >= 1 || bswx >= 500) ? 'ready' : 'incomplete';
      if (questStageGerumba === 3) return (discoveredLandmarks.length >= 4 && legacyPoints >= 120) ? 'ready' : 'incomplete';
      return 'quest';
    }
  };

  // --- VIEWPORT VISUAL GRID COMPILATION ---
  const startX = Math.max(0, Math.min(MAP_SIZE - VIEWPORT_SIZE, playerX - VIEW_HALF));
  const startY = Math.max(0, Math.min(MAP_SIZE - VIEWPORT_SIZE, playerY - VIEW_HALF));

  const viewportTiles: MapTile[] = [];
  for (let idxY = 0; idxY < VIEWPORT_SIZE; idxY++) {
    for (let idxX = 0; idxX < VIEWPORT_SIZE; idxX++) {
      const gX = startX + idxX;
      const gY = startY + idxY;
      const t = mapGrid[gY]?.[gX];
      if (t) {
        viewportTiles.push(t);
      }
    }
  }

  // --- COOLDOWN & INSPECTOR PROPERTIES (Purity React Compiler alignment) ---
  const dialNPCId = activeNPC?.id || '';
  const dialNPCLastGreetTime = dialNPCId ? (paidRespectsToday[dialNPCId] || 0) : 0;
  const dialNPCCooldownSec = dialNPCId ? Math.max(0, Math.ceil((120000 - (currentSystemTime - dialNPCLastGreetTime)) / 1000)) : 0;
  const dialNPCIsAva = dialNPCId ? (dialNPCCooldownSec <= 0) : false;

  const tile = mapGrid[selectedY]?.[selectedX];

  // --- PLOT INSPECTOR COMPUTED PROPERTIES ---
  const tileIndicators: { label: string; icon: string; desc: string; type: 'success' | 'warning' | 'info' | 'critical' }[] = [];
  let tileHasAdjacentGarden = false;
  let tileAdjacentGardenLvlSum = 0;
  let tileYieldBswx = 0;
  let tileYieldRep = 0;
  let tileCottageFactor = 1.0;
  let tileFinalMultiplier = 1.0;

  if (tile) {
    // 1. Heritage Catalyst
    if (heritageCatalystTime > 0 && tile.type === 'built_business') {
      tileIndicators.push({
        label: 'CATALYST BOOST',
        icon: '⚡',
        desc: '+25% active legacy production multiplier on coins & civic reputation',
        type: 'warning'
      });
    }

    // 2. Archetype bonuses
    if (charArchetype === 'merchant' && tile.type === 'built_business') {
      tileIndicators.push({
        label: 'MERCHANT COOP BONUS',
        icon: '💼',
        desc: '+15% currency coin yield under ancestral lineage protocol',
        type: 'info'
      });
    } else if (charArchetype === 'organizer' && tile.type === 'built_business') {
      tileIndicators.push({
        label: 'ORGANIZER CIVIC BONUS',
        icon: '🤝',
        desc: '+15% reputation (REP) multiplier under cooperative guidelines',
        type: 'info'
      });
    }

    // 3. Garden / Cottage adjacency or count bonuses
    if (tile.type === 'built_business') {
      const tx = tile.x;
      const ty = tile.y;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = tx + dx;
          const ny = ty + dy;
          if (ny >= 0 && ny < mapGrid.length && nx >= 0 && nx < (mapGrid[0]?.length || 0)) {
            const adjTile = mapGrid[ny]?.[nx];
            if (adjTile && adjTile.type === 'built_business' && adjTile.businessId === 'garden' && !adjTile.isConstructing) {
              tileHasAdjacentGarden = true;
              tileAdjacentGardenLvlSum += (adjTile.level || 1);
            }
          }
        }
      }
      if (tileHasAdjacentGarden && tile.businessId !== 'garden') {
        tileIndicators.push({
          label: 'GARDEN SYNERGY BONUS',
          icon: '🌱',
          desc: `+${(tileAdjacentGardenLvlSum * 50).toFixed(0)}% Rep yield from adjacent community gardens (Lvl sum: ${tileAdjacentGardenLvlSum})`,
          type: 'success'
        });
      }

      const globalCottageCount = cottagesCount;
      if (globalCottageCount > 0 && tile.businessId !== 'garden') {
        tileIndicators.push({
          label: 'EFFICIENCY BONUS',
          icon: '🏡',
          desc: `Active global compound x${Math.pow(1.5, globalCottageCount).toFixed(2)} residential multiplier`,
          type: 'success'
        });
      }
    }

    // 4. Resource Node modifiers
    if (tile.type === 'forest_tree' || tile.type === 'quarry_stone' || tile.type === 'clay_deposit') {
      if (weather === 'sunny') {
        tileIndicators.push({
          label: 'HIGH DEMAND & YIELD',
          icon: '🌤',
          desc: 'Sunny climate yields +1 extra raw material on manual harvest strikes',
          type: 'success'
        });
      } else if (weather === 'rainy') {
        if (tile.type === 'quarry_stone' || tile.type === 'clay_deposit') {
          tileIndicators.push({
            label: 'EARTH SOFTNESS BONUS',
            icon: '🌧',
            desc: 'Wet soft earth releases cleaner limestone/clay: +7 yield, higher demand!',
            type: 'success'
          });
        } else {
          tileIndicators.push({
            label: 'MUD WEIGHT PENALTY',
            icon: '🌧',
            desc: 'Soggy timber is heavy: mud cost is high, uses extra stamina reserves',
            type: 'warning'
          });
        }
      }

      const hasApprenticeTargeting = apprentices.some(app => app.targetX === tile.x && app.targetY === tile.y && app.state !== 'idle');
      if (hasApprenticeTargeting) {
        tileIndicators.push({
          label: 'BOT AUTOMATION COVERAGE',
          icon: '🤖',
          desc: 'An automated digital companion hand-worker covers this coordinate',
          type: 'info'
        });
      }

      if (stamina >= 80) {
        tileIndicators.push({
          label: 'PEAK HARVEST RATE',
          icon: '⚡',
          desc: 'Stamina is high! Full physical harvesting rate active (no danger)',
          type: 'success'
        });
      } else if (stamina <= 20) {
        tileIndicators.push({
          label: 'EXHAUSTION RISKS',
          icon: '⚠️',
          desc: 'Critical stamina! Eat home-baked potato pies inside your Bag to recover',
          type: 'critical'
        });
      }
    }

    // 5. Landmark states
    if (tile.type === 'landmark') {
      const isRestored = restoredLandmarks.includes(tile.landmarkId || '');
      if (isRestored) {
        tileIndicators.push({
          label: 'SACRED CIVIL ENERGY',
          icon: '✨',
          desc: 'Cooperative heritage site fully restored and radiating civic empowerment',
          type: 'success'
        });
      } else {
        tileIndicators.push({
          label: 'RESTORATION DEMAND',
          icon: '🏛',
          desc: 'Requires 300 coins & structural logs/masonry to clear state and unlock perks',
          type: 'warning'
        });
      }
    }

    // 6. Empty Plots Construct bonus
    if (tile.type === 'leasehold') {
      if (weather === 'sunset_glow') {
        tileIndicators.push({
          label: 'SUNSET PLAN DISCOUNT',
          icon: '🌇',
          desc: 'Reflective light bonus: grants -20% bricks & planks construct discounts!',
          type: 'success'
        });
      } else {
        tileIndicators.push({
          label: 'VACANT SOVEREIGN REVENUE',
          icon: '🟨',
          desc: 'Lease ready. High potential of adjacent commercial synergies.',
          type: 'info'
        });
      }
    }

    // Compute built-business yields
    if (tile.type === 'built_business') {
      tileYieldBswx = tile.businessId === 'garden' ? 0 : 5;
      tileYieldRep = tile.businessId === 'garden' ? 0 : 2;

      if (tile.businessId === 'grocery') { tileYieldBswx = 8; tileYieldRep = 3; }
      else if (tile.businessId === 'cafe') { tileYieldBswx = 10; tileYieldRep = 5; }
      else if (tile.businessId === 'bank') { tileYieldBswx = 20; tileYieldRep = 10; }
      else if (tile.businessId === 'academy') { tileYieldBswx = 35; tileYieldRep = 15; }

      const level = tile.level || 1;
      const levelMult = Math.pow(1.3, level - 1);
      tileYieldBswx *= levelMult;
      tileYieldRep *= levelMult;

      tileCottageFactor = Math.pow(1.5, cottagesCount);
      tileFinalMultiplier = levelMult * tileCottageFactor;
    }
  }

  const landmarkIsRestored = activeLandmarkDetail ? restoredLandmarks.includes(activeLandmarkDetail.id) : false;
  const landmarkCanRestore = activeLandmarkDetail ? (wood >= 25 && stone >= 25 && clay >= 25 && bswx >= 250) : false;

  // --- HISTORIC RESTORATION MINIGAME SLIDER STATE ---
  const [showRestorationPuzzle, setShowRestorationPuzzle] = useState(false);
  const [puzzleOffsets, setPuzzleOffsets] = useState<number[]>([0, 0, 0]); // offset rotation indexes (0-3)

  const handleRestoreLandmark = () => {
    if (!activeLandmarkDetail) return;
    if (landmarkIsRestored) return;
    if (!landmarkCanRestore) {
      addLog("Fails: Insufficient materials to restore this monument. Need 25x Wood, 25x Stone, 25x Clay, and 250 BSWX.");
      playRetroTone('fail');
      return;
    }
    // Set up a randomized slide offset puzzle (e.g. [1, 2, 3])
    setPuzzleOffsets([
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1
    ]);
    setShowRestorationPuzzle(true);
  };

  const verifyPuzzleRestoration = () => {
    // Correct if all offsets are 0 (aligned)
    const isCorrect = puzzleOffsets.every(offset => offset === 0);
    if (isCorrect) {
      setWood(w => w - 25);
      setStone(s => s - 25);
      setClay(c => c - 25);
      setBswx(b => b - 250);
      setRestoredLandmarks(r => [...r, activeLandmarkDetail!.id]);
      setReputation(rep => rep + 300);
      setLegacyPoints(lp => lp + 50);
      addLog(`✨ HISTORIC PRESERVATION: You successfully aligned the blueprints and restored ${activeLandmarkDetail!.name}! (+300 Rep and +50 Legacy Points!)`);
      playRetroTone('level', 2.0);
      setShowRestorationPuzzle(false);
      setActiveLandmarkDetail(null);
    } else {
      addLog("Blueprint alignment incorrect! Rotate the tiles until the layout meshes perfectly.");
      playRetroTone('fail');
    }
  };

  return (
    <div id="landing_sandbox_screen" className="flex flex-col min-h-screen bg-[#070708] text-yellow-500 overflow-x-hidden relative font-sans select-none antialiased">
      
      {/* 1. TOP HEADER STATUS BANNER */}
      <header id="district_ledgers_header" className={`relative z-30 h-16 flex items-center justify-between px-4 bg-zinc-950/90 border-b border-yellow-500/20 backdrop-blur-md sticky top-0 w-full select-none ${heritageCatalystTime > 0 ? 'ring-2 ring-yellow-400/85 shadow-[0_0_15px_#ca8a04]' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 bg-gradient-to-br from-[#22c55e] to-emerald-800 rounded-lg flex items-center justify-center border-2 border-emerald-400 font-extrabold text-black text-lg animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.3)] flex-shrink-0">
            G
          </div>
          <div className="min-w-0 flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-black text-white hover:text-emerald-400 font-mono tracking-widest uppercase truncate leading-none hidden sm:block">NEW GREENWOOD</h1>
            <div className="text-[8px] sm:text-[9px] text-gray-405 flex items-center gap-1.5 font-sans select-none truncate">
              <span className="hidden sm:inline-flex items-center gap-1">
                <span>GROWTH:</span> 
                <span className="text-yellow-500 font-bold font-mono">{(Math.pow(1.5, cottagesCount)).toFixed(2)}x</span>
              </span>
              <span className="text-zinc-700 hidden sm:inline">|</span>
              <button 
                onMouseEnter={() => setActiveResourceTooltip('weather')}
                onMouseLeave={() => setActiveResourceTooltip(null)}
                onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'weather' ? null : 'weather')}
                className={`flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white shadow-inner cursor-help transition-all transform hover:scale-105 active:scale-95 ${activeResourceTooltip === 'weather' ? 'ring-1 ring-cyan-400 border-cyan-500 bg-cyan-950/40' : ''}`}
                title="Click/Hover to see Weather info cue"
              >
                {weather === 'sunny' && "🌤 SUNNY"}
                {weather === 'rainy' && "🌧 RAIN"}
                {weather === 'foggy' && "🌫 FOG"}
                {weather === 'sunset_glow' && "🌇 SUNSET"}
                <span className="opacity-60 ml-0.5 hidden sm:inline">({weatherTimer}s)</span>
              </button>
              <span className="text-zinc-700 hidden sm:inline">|</span>
              <button 
                onMouseEnter={() => setActiveResourceTooltip('heritage')}
                onMouseLeave={() => setActiveResourceTooltip(null)}
                onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'heritage' ? null : 'heritage')}
                className={`hidden sm:flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white shadow-inner cursor-help transition-all transform hover:scale-105 active:scale-95 ${activeResourceTooltip === 'heritage' ? 'ring-1 ring-pink-400 border-pink-500 bg-pink-950/40' : ''}`}
                title="Click/Hover to see Pioneer Identity & Perks info cue"
              >
                👤 ID PROFILE
              </button>
            </div>
          </div>
        </div>

        {/* Resources ledger ticker widgets */}
        <div id="persistent_subsystems_ledger" className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs">
          
          <motion.button
            onMouseEnter={() => setActiveResourceTooltip('time')}
            onMouseLeave={() => setActiveResourceTooltip(null)}
            onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'time' ? null : 'time')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`hidden sm:flex items-center gap-0.5 bg-zinc-900 border px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-white font-mono font-bold shadow-inner cursor-help transition-all duration-300 ${
              activeResourceTooltip === 'time' 
                ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' 
                : 'border-yellow-500/35 shadow-[0_0_8px_rgba(250,204,21,0.15)]'
            }`}
            title="Click to learn about Time & Cycles"
          >
            <span>{timeIcon}</span>
            <span className="text-yellow-400 font-mono">{gameFormattedTime}</span>
            <span className="text-[7.5px] opacity-60 uppercase font-mono tracking-wider ml-0.5 hidden sm:inline-block">{timePeriodName}</span>
          </motion.button>

          <motion.button 
            onMouseEnter={() => setActiveResourceTooltip('bswx')}
            onMouseLeave={() => setActiveResourceTooltip(null)}
            onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'bswx' ? null : 'bswx')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: bswxPulseType === 'up' ? [1, 1.15, 1.05, 1] : bswxPulseType === 'down' ? [1, 0.88, 0.95, 1] : 1,
              borderColor: bswxPulseType === 'up' ? 'rgba(234, 179, 8, 0.9)' : bswxPulseType === 'down' ? 'rgba(239, 68, 68, 0.9)' : (activeResourceTooltip === 'bswx' ? 'rgba(234, 179, 8, 1)' : 'rgba(234, 179, 8, 0.25)'),
              backgroundColor: bswxPulseType === 'up' ? 'rgba(234, 179, 8, 0.35)' : bswxPulseType === 'down' ? 'rgba(239, 68, 68, 0.25)' : (activeResourceTooltip === 'bswx' ? 'rgba(66, 32, 6, 0.4)' : 'rgba(66, 32, 6, 0.15)'),
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded cursor-help border transition-all duration-300 ${
              activeResourceTooltip === 'bswx' 
                ? 'shadow-[0_0_15px_rgba(234,179,8,0.6)]' 
                : 'shadow-[0_0_8px_rgba(234,179,8,0.15)]'
            }`}
            title="Click to learn about Town Coins"
          >
            <Coins size={10} className={`transition-transform duration-300 ${bswxPulseType === 'up' ? 'scale-125 text-yellow-300 animate-pulse' : bswxPulseType === 'down' ? 'scale-75 text-red-400' : 'text-amber-500'}`} />
            <span 
              className={`font-mono font-extrabold transition-colors duration-300 ${bswxPulseType === 'up' ? 'text-yellow-300 font-black' : bswxPulseType === 'down' ? 'text-red-400' : 'text-white'}`}
            >
              {bswx.toFixed(1)}
            </span>
            <span className="text-[7.5px] text-yellow-500/60 uppercase font-mono tracking-wider hidden sm:inline-block ml-0.5">Coins</span>
          </motion.button>

          <motion.button 
            onMouseEnter={() => setActiveResourceTooltip('rep')}
            onMouseLeave={() => setActiveResourceTooltip(null)}
            onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'rep' ? null : 'rep')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: repPulseType === 'up' ? [1, 1.15, 1.05, 1] : repPulseType === 'down' ? [1, 0.88, 0.95, 1] : 1,
              borderColor: repPulseType === 'up' ? 'rgba(52, 211, 153, 0.9)' : repPulseType === 'down' ? 'rgba(239, 68, 68, 0.9)' : (activeResourceTooltip === 'rep' ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 0.25)'),
              backgroundColor: repPulseType === 'up' ? 'rgba(52, 211, 153, 0.35)' : repPulseType === 'down' ? 'rgba(239, 68, 68, 0.25)' : (activeResourceTooltip === 'rep' ? 'rgba(6, 78, 59, 0.4)' : 'rgba(6, 78, 59, 0.15)'),
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded cursor-help border transition-all duration-300 ${
              activeResourceTooltip === 'rep' 
                ? 'shadow-[0_0_15px_rgba(52,211,153,0.6)]' 
                : 'shadow-[0_0_8px_rgba(52,211,153,0.15)]'
            }`}
            title="Click to learn about Reputation"
          >
            <TrendingUp size={10} className={`transition-transform duration-300 ${repPulseType === 'up' ? 'scale-125 text-emerald-300 animate-pulse' : repPulseType === 'down' ? 'scale-75 text-red-400' : 'text-emerald-500'}`} />
            <span 
              className={`font-mono font-extrabold transition-colors duration-300 ${repPulseType === 'up' ? 'text-emerald-300 font-black' : repPulseType === 'down' ? 'text-red-400' : 'text-white'}`}
            >
              {reputation}
            </span>
            <span className="text-[7.5px] text-emerald-500/60 uppercase font-mono tracking-wider hidden sm:inline-block ml-0.5">Rep</span>
          </motion.button>

          <motion.button 
            onMouseEnter={() => setActiveResourceTooltip('lp')}
            onMouseLeave={() => setActiveResourceTooltip(null)}
            onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'lp' ? null : 'lp')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: lpPulseType === 'up' ? [1, 1.15, 1.05, 1] : lpPulseType === 'down' ? [1, 0.88, 0.95, 1] : 1,
              borderColor: lpPulseType === 'up' ? 'rgba(250, 204, 21, 0.9)' : lpPulseType === 'down' ? 'rgba(239, 68, 68, 0.9)' : (activeResourceTooltip === 'lp' ? 'rgba(234, 179, 8, 1)' : 'rgba(250, 204, 21, 0.25)'),
              backgroundColor: lpPulseType === 'up' ? 'rgba(250, 204, 21, 0.35)' : lpPulseType === 'down' ? 'rgba(239, 68, 68, 0.25)' : (activeResourceTooltip === 'lp' ? 'rgba(66, 32, 6, 0.4)' : 'rgba(66, 32, 6, 0.15)'),
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded cursor-help border transition-all duration-300 ${
              activeResourceTooltip === 'lp' 
                ? 'shadow-[0_0_15px_rgba(250,204,21,0.6)]' 
                : 'shadow-[0_0_8px_rgba(250,204,21,0.15)]'
            }`}
            title="Click to learn about Legacy Points"
          >
            <Crown size={10} className={`transition-transform duration-300 ${lpPulseType === 'up' ? 'scale-125 text-yellow-300 animate-pulse' : lpPulseType === 'down' ? 'scale-75 text-red-400' : 'text-amber-500'}`} />
            <span 
              className={`font-mono font-black transition-colors duration-300 ${lpPulseType === 'up' ? 'text-yellow-300 font-black' : lpPulseType === 'down' ? 'text-red-400' : 'text-white'}`}
            >
              {legacyPoints}
            </span>
            <span className="text-[7.5px] text-yellow-500/60 uppercase font-mono tracking-wider hidden sm:inline-block ml-0.5">LP</span>
          </motion.button>

          <motion.button 
            onMouseEnter={() => setActiveResourceTooltip('stamina')}
            onMouseLeave={() => setActiveResourceTooltip(null)}
            onClick={() => setActiveResourceTooltip(activeResourceTooltip === 'stamina' ? null : 'stamina')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: staminaPulseType === 'up' ? [1, 1.15, 1.05, 1] : staminaPulseType === 'down' ? [1, 0.88, 0.95, 1] : 1,
              borderColor: staminaPulseType === 'up' ? 'rgba(163, 230, 53, 0.9)' : staminaPulseType === 'down' ? 'rgba(239, 68, 68, 0.9)' : (activeResourceTooltip === 'stamina' ? 'rgba(132, 204, 22, 1)' : 'rgba(163, 230, 53, 0.25)'),
              backgroundColor: staminaPulseType === 'up' ? 'rgba(163, 230, 53, 0.35)' : staminaPulseType === 'down' ? 'rgba(239, 68, 68, 0.25)' : (activeResourceTooltip === 'stamina' ? 'rgba(63, 98, 18, 0.4)' : 'rgba(63, 98, 18, 0.15)'),
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded cursor-help border transition-all duration-300 mr-1 ${
              activeResourceTooltip === 'stamina' 
                ? 'shadow-[0_0_15px_rgba(163,230,53,0.6)]' 
                : 'shadow-[0_0_8px_rgba(163,230,53,0.15)]'
            }`}
            title="Click to learn about Stamina"
          >
            <BatteryCharging size={10} className={`transition-transform duration-300 ${staminaPulseType === 'up' ? 'scale-125 text-lime-300 animate-pulse' : staminaPulseType === 'down' ? 'scale-75 text-red-400' : 'text-lime-500'}`} />
            <span 
              className={`font-mono font-black transition-colors duration-300 ${staminaPulseType === 'up' ? 'text-lime-300 font-black' : staminaPulseType === 'down' ? 'text-red-400' : 'text-white'}`}
            >
              {Math.round(stamina)}%
            </span>
            <span className="text-[7.5px] text-lime-500/60 uppercase font-mono tracking-wider hidden sm:inline-block ml-0.5">Stamina</span>
          </motion.button>

          <button 
            onClick={() => {
              setIsGamePaused(p => !p);
              if (!isGamePaused) {
                setPauseMenuTab('inventory');
              }
              startBackgroundSoundtrack();
            }}
            className={`p-1 py-0.5 sm:p-2 sm:py-1 rounded font-black font-mono uppercase text-[9px] sm:text-xs flex items-center gap-1.5 transition-all duration-300 border shadow-lg ${
              isGamePaused 
                ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.5)]' 
                : 'bg-amber-600 hover:bg-yellow-500 hover:text-black border-amber-500/30 hover:border-yellow-400'
            }`}
          >
            <span>🎒 <span className="hidden sm:inline">BAG</span></span>
          </button>
        </div>
      </header>

      {/* Floating Info Tooltip Popover underneath District Header */}
      <AnimatePresence>
        {activeResourceTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-zinc-950/95 border-b border-yellow-500/30 text-white p-3 text-xs flex justify-between items-center relative z-40 shadow-xl text-left backdrop-blur-md"
          >
            <div className="flex items-start gap-2.5 max-w-2xl">
              <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">
                  {activeResourceTooltip === 'bswx' && "Greenwood Coins (BSWX)"}
                  {activeResourceTooltip === 'rep' && "Community Reputation (REP)"}
                  {activeResourceTooltip === 'lp' && "Legacy Points (LP)"}
                  {activeResourceTooltip === 'stamina' && "Physical Stamina"}
                  {activeResourceTooltip === 'time' && "Local Greenwood Clock"}
                  {activeResourceTooltip === 'weather' && "Active Dynamic Weather Rules"}
                  {activeResourceTooltip === 'heritage' && "Pioneer Heritage ID Profile & Perks"}
                </strong>
                <p className="text-gray-350 leading-relaxed text-[11px]">
                  {activeResourceTooltip === 'bswx' && "The town's primary cooperative currency. You earn Coins from level-up shop properties or completing history quiz rewards. Spend Coins to construct cute storefronts, level up cottage structures, or hire digital apprentice helpers."}
                  {activeResourceTooltip === 'rep' && "Your respect level among New Greenwood neighbors. High reputation unlocks bigger buildings like Pioneer Cottages and increases passive income output. Build it by answering history trivia or completing elder quests!"}
                  {activeResourceTooltip === 'lp' && "Your historical wisdom points. Earned by exploring coordinates, saying hello to seniors, and learning from historical sites. Use Legacy Points to bake high-energy Potato Pies and healthy Ginger Tea inside your Bag."}
                  {activeResourceTooltip === 'stamina' && "Your physical building power, spent when harvesting pine trees or quarrying limestone ores. If it hits 0%, you collapse from exhaustion! Rest up, or heat up Potato Pies inside your Bag to recover."}
                  {activeResourceTooltip === 'time' && "Tracks the dynamic day/night cycle of Greenwood. Time advances at 10 minutes per real second. Sunset and Night phases affect active lighting and visual theme overlay."}
                  {activeResourceTooltip === 'weather' && (
                    <span>
                      Greenwood&apos;s climate modulates active gathering yields & labor rules: 
                      {weather === 'sunny' && " 🌤 SUNNY: Ideal visibility rewards physical lumberjacks and miners with +1 extra material yield. Resting in town is fully efficient."}
                      {weather === 'rainy' && " 🌧 SPRING RAIN: Muddy ground costs -5 stamina per harvest (instead of 4), but soft earth releases cleaner stone: you receive +7 Stone (instead of 5) on quarry strikes!"}
                      {weather === 'foggy' && " 🌫 DEEP FOG: Thick mist triggers Mist Discovery! Moving has an 8% chance to spot lost coin pouches (+5.0 BSWX) or fallen resources."}
                      {weather === 'sunset_glow' && " 🌇 SUNSET GOLDEN HOUR: Inspiring views grant -20% Planks & Bricks builders discount when constructing cottages, and consumes 25% less reputation!"}
                    </span>
                  )}
                  {activeResourceTooltip === 'heritage' && (
                    <span>
                      Your Custom Lineage Advantages: 
                      Class: <strong className="text-yellow-400 uppercase">{charArchetype === 'merchant' ? "Sovereign Merchant (+15% storefront coins)" : charArchetype === 'organizer' ? "Cooperative Organizer (+15% REP rewards)" : "Grit Pioneer (+40 max stamina)"}</strong>. 
                      Origin: <strong className="text-emerald-400 uppercase">{charOrigin === 'homestead' ? "Homesteaders (Raw Starter Stocks)" : charOrigin === 'academy' ? "Greenwood Business League (+100 BSWX)" : "Stradford Arts (+15 Rep/10 LP)"}</strong>. 
                      Heirloom: <strong className="text-pink-400 uppercase">{charHeirloom === 'none' ? "None (Modest)" : charHeirloom === 'brass_level' ? "Grandfather's Brass Level (-20% upgrade costs)" : charHeirloom === 'thermos' ? "Insulated Thermos (+30% food cooked stamina)" : "Sovereign Ledger (+10% storefront coins)"}</strong>.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveResourceTooltip(null)}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[10px] uppercase font-bold select-none ml-4 whitespace-nowrap"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heritage Catalyst Active alert block */}
      {heritageCatalystTime > 0 && (
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 text-black py-1 px-4 text-center text-[10px] font-extrabold tracking-widest font-mono flex items-center justify-center gap-2">
          <Sparkles size={11} className="animate-spin" />
          <span>HERITAGE BOOST ACTIVE (+25% REVENUE YIELDS): {heritageCatalystTime}s REMAINING</span>
        </div>
      )}

      {/* DYNAMIC MARKET NEWS TICKER */}
      <div className="bg-zinc-900 border-b border-yellow-500/20 py-1.5 overflow-hidden relative flex items-center">
        <div className="absolute left-0 top-0 bottom-0 bg-yellow-500/90 text-black px-3 font-mono font-black text-[9px] flex items-center z-10 border-r border-yellow-500 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
          NEWS TICKER
        </div>
        <div className="flex-1 whitespace-nowrap overflow-hidden relative h-4 font-mono text-[9.5px]">
          <div className="inline-block animate-[marquee_25s_linear_infinite] pl-[100%] text-yellow-405/85 tracking-wider">
            {activeEvent ? (
              <span className="font-extrabold text-white bg-red-950/70 border border-red-500/30 px-2 py-0.5 rounded mr-8">
                🚨 SPECIAL EVENT: {activeEvent.title.toUpperCase()} — {activeEvent.desc}
              </span>
            ) : null}
            <span className="mr-8">
              🌤 CURRENT WEATHER: {weather.toUpperCase()} ({weather === 'sunny' ? "Market trade is fully active (+1 Resource yields)" : weather === 'rainy' ? "Stamina cost is slightly increased" : weather === 'foggy' ? "Discovery probability elevated" : "Special discount rates apply"})
            </span>
            <span className="mr-8">
              📈 MARKET SHIFT: Stradford Brick Yards reporting {weather === 'rainy' ? "abundant brick production (-20% cost)" : "regular supplies"}.
            </span>
            <span className="mr-8">
              🌲 WOOD MARKET: Cedar lumber exports from AME Church domain trading steady at 1.2x.
            </span>
            <span className="mr-8">
              💎 CO-OP LEDGER: Join other Greenwood members to secure collective asset ownership.
            </span>
          </div>
        </div>
        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
        `}</style>
      </div>

      {/* 2. SPLASH SCREEN PAGE */}
      {screen === 'splash' && (
        <section id="launch_splash_overlay" className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 relative max-w-xl mx-auto py-10 animate-fadeIn">
          {/* Custom retro 16-bit pixel art image bezel with Lumen Labs Logo */}
          <div className="w-full max-w-sm aspect-[16/9] relative rounded-xl overflow-hidden border-2 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.25)] bg-gradient-to-b from-[#0c0c10] to-black">
            <Image 
              src={splashImg} 
              alt="Lumen Labs Logo" 
              className="w-full h-full object-contain p-4 transition-transform duration-700 hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Glossy / Scanline overlay for vintage CRT feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%] pointer-events-none opacity-40"></div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 text-left">
              <span className="text-[8px] font-mono font-bold text-yellow-400 tracking-wider">LUMEN LABS • CUSTOM COOPERATIVE PROTOCOL</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-[10px] text-yellow-400 font-extrabold tracking-widest leading-none bg-yellow-400/10 border border-yellow-400/20 px-3.5 py-1 rounded-full uppercase">
                PROSPERITY • COOPERATION • SOVEREIGNTY
              </span>
              <span className="text-[9px] text-[#22c55e] font-mono tracking-widest uppercase font-bold animate-pulse mt-1">
                ⚡ POWERED BY LUMEN LABS ⚡
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight font-mono leading-tight">
              NEW GREENWOOD
            </h2>
            <p className="text-sm font-sans text-gray-300 italic font-medium leading-relaxed max-w-md mx-auto">
              Welcome to the New Greenwood Wealth Engine—a high-fidelity land platform and custom wealth cooperative simulation, powered by Lumen Labs.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-[#22c55e]/20 max-w-sm text-left shadow-[0_0_15px_rgba(34,197,94,0.05)]">
            <h4 className="text-[10px] font-black uppercase tracking-widest font-mono text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" /> Legacy Sovereign Protocol
            </h4>
            <p className="text-[11px] font-sans leading-normal text-gray-400 mt-1">
              Navigate coordinates, harvest lumber & rock quarries, contract Digital Apprentices, expand cottages, and solve historic factual challenges to build economic sovereignty.
            </p>
          </div>

          <button
            onClick={() => setScreen('creator')}
            className="py-3 px-8 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-405 hover:to-amber-500 text-black font-black tracking-widest uppercase rounded border-2 border-yellow-300 shadow-[0_4px_15px_rgba(234,179,8,0.25)] transition-all transform hover:scale-105"
          >
            Enter Sanctuary
          </button>
        </section>
      )}

      {/* 3. AVATAR CREATOR SCREEN */}
      {screen === 'creator' && (
        <section id="character_creator_overlay" className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto justify-center py-8 animate-fadeIn">
          <div className="w-full bg-[#0c0c0f] border-2 border-yellow-500/30 rounded-2xl p-4 sm:p-6 space-y-6">
            
            <div className="text-center">
              <span className="text-[9px] font-bold text-amber-500 tracking-widest font-mono bg-amber-500/10 px-3 py-0.5 rounded leading-none">SYSTEM SYNC</span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide font-mono mt-1">Pioneer Registry</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Dynamic Retro Character SVG viewport */}
              <div className="w-28 h-28 bg-zinc-950 border border-yellow-500/30 rounded flex items-center justify-center p-2 relative">
                <RetroCharacter 
                  skin={charSkin} 
                  hair={charHair} 
                  clothing={clothing} 
                  accessory={charAccessory}
                  isMoving={false}
                  gender={charGender}
                />
              </div>

              {/* Form parameters */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400">Pioneer Handle Name</label>
                  <input 
                    type="text" 
                    value={charName} 
                    onChange={e => setCharName(e.target.value)} 
                    className="w-full mt-1.5 p-2 bg-zinc-900 border border-yellow-500/30 rounded text-sm text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                {/* Gender and SkinTone */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Gender Identity</span>
                    <select value={charGender} onChange={e => setCharGender(e.target.value as any)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="Male">Brother (Male)</option>
                      <option value="Female">Sister (Female)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Skin Tone</span>
                    <select value={charSkin} onChange={e => setCharSkin(e.target.value)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="espresso">Rich Espresso</option>
                      <option value="umber">Warm Umber</option>
                      <option value="honey">Golden Honey</option>
                      <option value="caramel">Light Caramel</option>
                    </select>
                  </div>
                </div>

                {/* Clothing, Hairstyle */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Clothing Color</span>
                    <select value={clothing} onChange={e => setClothing(e.target.value)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="emerald">Emerald</option>
                      <option value="gold">Gold</option>
                      <option value="crimson">Crimson</option>
                      <option value="purple">Empress Purple</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Hairstyle</span>
                    <select value={charHair} onChange={e => setCharHair(e.target.value)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="afro">Classic Afro</option>
                      <option value="locs">Empowered Locs</option>
                      <option value="braids">Heritage Braids</option>
                      <option value="fade">Lineup Fade</option>
                      <option value="headwrap">Heritage Headwrap 👑</option>
                      <option value="crown-bun">Coiled Crown Bun 🎀</option>
                      <option value="vintage-waves">Vintage Waves 🌊</option>
                      <option value="locs-bob">Styled Locs Bob ✨</option>
                    </select>
                  </div>
                </div>

                {/* Accessory & Archetype */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Accessory</span>
                    <select value={charAccessory} onChange={e => setCharAccessory(e.target.value as any)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="none">None</option>
                      <option value="glasses">Glasses</option>
                      <option value="chain">Gold Chain</option>
                      <option value="cap">Newsboy Cap</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Pioneer Class (Archetype)</span>
                    <select value={charArchetype} onChange={e => setCharArchetype(e.target.value as any)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="merchant">Sovereign Merchant</option>
                      <option value="organizer">Cooperative Organizer</option>
                      <option value="grit">Grit Pioneer</option>
                    </select>
                  </div>
                </div>

                {/* Heritage Origin & Kept Heirloom */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Heritage Household Origin</span>
                    <select value={charOrigin} onChange={e => setCharOrigin(e.target.value as any)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="homestead">Sovereign Homesteaders</option>
                      <option value="academy">Greenwood Business League</option>
                      <option value="stradford">Stradford Cultural Legacy</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 block pb-1">Kept Ancestral Heirloom</span>
                    <select value={charHeirloom} onChange={e => setCharHeirloom(e.target.value as any)} className="w-full p-1.5 bg-zinc-900 border border-white/5 text-white rounded focus:outline-none">
                      <option value="none">None (Modest Start)</option>
                      <option value="brass_level">Grandfather&apos;s Brass Level 📐</option>
                      <option value="thermos">Pioneer&apos;s Insulated Thermos ☕</option>
                      <option value="heritage_ledger">Legacy Sovereign Ledger 📓</option>
                    </select>
                  </div>
                </div>

                {/* Combined Origin & Heirloom Description Cards */}
                <div className="p-2.5 bg-zinc-950/80 rounded border border-emerald-500/10 text-[10px] sm:text-[11px] font-sans text-gray-400 leading-relaxed space-y-2 shadow-inner">
                  {charOrigin === 'homestead' && (
                    <p>🪵 <strong className="text-emerald-400 uppercase font-mono text-[9px] tracking-wider">Homestead Origin:</strong> Starts with ancestral resource stocks (+10 Wood, +10 Stone, and +2 Planks & +2 Bricks) for fast early building.</p>
                  )}
                  {charOrigin === 'academy' && (
                    <p>🪙 <strong className="text-amber-400 uppercase font-mono text-[9px] tracking-wider">Business League Origin:</strong> Starts game with cash grants of <span className="text-amber-400 font-bold">300 BSWX Cash</span> (instead of 200) for fast market scaling.</p>
                  )}
                  {charOrigin === 'stradford' && (
                    <p>🎭 <strong className="text-purple-400 uppercase font-mono text-[9px] tracking-wider">Stradford Origin:</strong> Starts with refined social prominence (<span className="text-purple-400 font-bold">25.0 Reputation</span> instead of 10) and <span className="text-purple-400 font-bold">50 Legacy Points</span> (instead of 40) immediately.</p>
                  )}

                  {charHeirloom === 'brass_level' && (
                    <p>📐 <strong className="text-cyan-400 uppercase font-mono text-[9px] tracking-wider">Brass Level Keepsake:</strong> Permanent reduction of <span className="text-cyan-400 font-bold">-20% component resources</span> required on all storefront grid upgrades.</p>
                  )}
                  {charHeirloom === 'thermos' && (
                    <p>☕ <strong className="text-orange-400 uppercase font-mono text-[9px] tracking-wider">Insulated Thermos Keepsake:</strong> Physical fuel efficiency of <span className="text-orange-400 font-bold">+30% extra stamina</span> recovered when consuming warm cooked rations.</p>
                  )}
                  {charHeirloom === 'heritage_ledger' && (
                    <p>📓 <strong className="text-pink-400 uppercase font-mono text-[9px] tracking-wider">Sovereign Ledger Keepsake:</strong> Financial audit advantage yielding an extra <span className="text-pink-400 font-bold">+10% coin earnings multiplier</span> from all passive storefront outputs.</p>
                  )}
                </div>

                {/* Archetype Description Card */}
                <div className="p-2.5 bg-zinc-950/80 rounded border border-yellow-500/10 text-[10px] sm:text-[11px] font-sans text-gray-400 leading-relaxed shadow-inner">
                  {charArchetype === 'merchant' && (
                    <p>💼 <strong className="text-yellow-400 uppercase font-mono text-[9px] tracking-wider">Sovereign Merchant Perks:</strong> Earns <span className="text-yellow-400 font-black">+15% Coins (BSWX)</span> from any co-op storefront operations and starts with ancestral advantages.</p>
                  )}
                  {charArchetype === 'organizer' && (
                    <p>🤝 <strong className="text-emerald-400 uppercase font-mono text-[9px] tracking-wider">Cooperative Organizer Perks:</strong> Obtains <span className="text-emerald-400 font-black">+15% Reputation (REP)</span> from satisfying elder questions or cooperative works.</p>
                  )}
                  {charArchetype === 'grit' && (
                    <p>⚡ <strong className="text-lime-400 uppercase font-mono text-[9px] tracking-wider">Grit Pioneer Perks:</strong> Possesses an expansive physical stamina reserve of <span className="text-lime-400 font-black">140 Max Stamina</span> (instead of 100) to harvest, build, and work for longer stretches.</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setScreen('game');
                setShowTutorial(true);
                setTutorialStep(0);
                
                // Active Origin Starting Boosts
                if (charOrigin === 'homestead') {
                  setWood(35);
                  setStone(35);
                  setPolishedPlank(7);
                  setReinforcedBrick(7);
                  addLog("📋 Homestead Inheritance: Received extra starting raw lumber (+10), stone (+10), planks (+2), and bricks (+2)!");
                } else if (charOrigin === 'academy') {
                  setBswx(300);
                  addLog("📋 Academy Grant: Starts with 300 BSWX Cash (+$100 co-op endowment) for swift procurement!");
                } else if (charOrigin === 'stradford') {
                  setReputation(25);
                  setLegacyPoints(50);
                  addLog("📋 Stradford Prestige: Starts with +15 Extra Reputation (25.0 REP) and +10 bonus Legacy Points (50 LP total)!");
                }
                
                if (charHeirloom === 'brass_level') {
                  addLog("🔑 Ancient Heirloom: 'Grandfather's Brass Level' is active! Upgraders cost -20% components.");
                } else if (charHeirloom === 'thermos') {
                  addLog("🔑 Ancestral Keepsake: 'Pioneer's Warm Thermos' is active! Resting restores +30% more energy.");
                } else if (charHeirloom === 'heritage_ledger') {
                  addLog("🔑 Ledger Emblem: 'Legacy Sovereign Ledger' is active! Automated co-op apprentice labors yield +10% BSWX coins.");
                }

                addLog(`Welcome to New Greenwood, ${charName}! Enjoy growing the town!`);
                startBackgroundSoundtrack();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 text-black font-black uppercase text-sm font-sans tracking-widest rounded transition-all"
            >
              Begin Your Journey ➔
            </button>
          </div>
        </section>
      )}

      {/* 4. ACTIVE GAME INTERACTIVE VIEWPORT */}
      {screen === 'game' && (
        <main className="flex-grow flex flex-col md:grid md:grid-cols-[1fr_360px] w-full h-[calc(100vh-64px)] overflow-hidden relative z-10 animate-fadeIn p-0 gap-0">
          
          {/* LEFT SIDE: CONTROLS, DENSE VIEWPORT, LOGS */}
          <div className={`flex-grow flex flex-col space-y-4 p-3 sm:p-4 md:p-6 md:col-start-1 md:row-start-1 md:row-span-3 overflow-y-auto min-h-0 ${mobileActiveTab === 'radar' ? 'hidden md:flex' : 'flex'}`}>
            
            {/* STAGE CONTAINER WITH COLLISION FEED AND PARTICLE CANVAS */}
            <div 
              id="cooperative_crt_viewport" 
              className={`relative border-4 rounded-2xl bg-zinc-950 overflow-hidden shadow-2xl p-1.5 select-none aspect-square max-w-[550px] mx-auto w-full flex items-center justify-center transition-all duration-300 touch-none
                ${stamina <= 0 ? 'border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.6)] animate-lowStaminaShake grayscale-100' : ''}
                ${stamina > 0 && stamina <= 20 ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] grayscale-30 animate-pulse' : ''}
                ${stamina > 20 ? 'border-amber-500/40 shadow-2xl' : ''}
                ${mobileActiveTab === 'play' ? 'flex' : 'hidden md:flex'}
              `}
              onTouchStart={(e) => {
                if (e.touches ? e.touches.length > 0 : false) {
                  setTouchStartPos({
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                  });
                }
              }}
              onTouchEnd={(e) => {
                if (!touchStartPos || !e.changedTouches || e.changedTouches.length === 0) return;
                const diffX = e.changedTouches[0].clientX - touchStartPos.x;
                const diffY = e.changedTouches[0].clientY - touchStartPos.y;
                const absX = Math.abs(diffX);
                const absY = Math.abs(diffY);
                const threshold = 30; // Min swipe distance in pixels
                if (Math.max(absX, absY) > threshold) {
                  if (absX > absY) {
                    // Horizontal swipe
                    if (diffX > 0) {
                      attemptMove('E');
                    } else {
                      attemptMove('W');
                    }
                  } else {
                    // Vertical swipe
                    if (diffY > 0) {
                      attemptMove('S');
                    } else {
                      attemptMove('N');
                    }
                  }
                }
                setTouchStartPos(null);
              }}
            >
              
              {/* Dynamic canvas drawing overlay for physics sparks particles */}
              <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {burstParticles.map(p => (
                  <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      left: `${(p.x / (MAP_SIZE * 24)) * 100}%`,
                      top: `${(p.y / (MAP_SIZE * 24)) * 100}%`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      backgroundColor: p.color,
                      opacity: p.opacity,
                      boxShadow: `0 0 6px ${p.color}`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </div>

              {/* CRT screen lines simulation gloss */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-30 opacity-25" />

              {/* --- DYNAMIC PROCEDURAL WEATHER SYSTEM OVERLAYS --- */}
              {weather === 'sunny' && (
                <div className="absolute inset-0 bg-yellow-400/[0.04] pointer-events-none z-30 mix-blend-color-dodge overflow-hidden">
                  <div className="absolute inset-0 animate-sunnySparkle bg-gradient-to-tr from-transparent via-yellow-200/10 to-transparent pointer-events-none" />
                </div>
              )}

              {weather === 'rainy' && (
                <div className="absolute inset-0 bg-[#0e1a2f]/25 pointer-events-none z-30 mix-blend-color-burn overflow-hidden">
                  <div className="absolute inset-0 animate-rain opacity-50 pointer-events-none flex flex-wrap justify-around">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-0.5 bg-sky-200/40 rounded-full" 
                        style={{
                          height: `${15 + (i % 3) * 10}px`,
                          marginTop: `${(i % 5) * 20}px`,
                          opacity: 0.3 + (i % 4) * 0.15
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {weather === 'foggy' && (
                <div className="absolute inset-0 bg-zinc-400/15 pointer-events-none z-30 mix-blend-overlay overflow-hidden">
                  <div 
                    className="absolute inset-0 animate-driftFog pointer-events-none filter blur-md w-[150%] h-[150%]" 
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(228,228,231,0.25) 0%, transparent 80%)' }}
                  />
                  <div className="absolute -inset-10 bg-white/5 filter blur-lg animate-driftFog pointer-events-none" />
                </div>
              )}

              {weather === 'sunset_glow' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/15 via-rose-600/10 to-indigo-900/20 pointer-events-none z-30 mix-blend-screen overflow-hidden">
                  <div className="absolute inset-0 bg-orange-400/[0.03] animate-pulse pointer-events-none" />
                </div>
              )}

              {/* Dawn Atmosphere Overlay */}
              {timePeriodName === 'Dawn' && (
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/15 via-orange-500/10 to-amber-400/5 pointer-events-none z-30 mix-blend-color-burn" />
              )}

              {/* Sunset Atmosphere Overlay */}
              {timePeriodName === 'Sunset' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-800/20 via-orange-600/15 to-indigo-950/10 pointer-events-none z-30 mix-blend-color-burn" />
              )}

              {/* Night Mask & Radial Lantern Overlay */}
              {timePeriodName === 'Night' && (() => {
                const playerRelX = playerX - startX;
                const playerRelY = playerY - startY;
                const lanternXPercent = ((playerRelX + 0.5) / VIEWPORT_SIZE) * 100;
                const lanternYPercent = ((playerRelY + 0.5) / VIEWPORT_SIZE) * 100;
                return (
                  <div 
                    className="absolute inset-0 pointer-events-none z-30 mix-blend-multiply transition-all duration-300"
                    style={{
                      background: `radial-gradient(circle at ${lanternXPercent}% ${lanternYPercent}%, transparent 12%, rgba(2, 6, 23, 0.45) 24%, rgba(2, 6, 23, 0.95) 45%)`
                    }}
                  />
                );
              })()}

              {/* Map viewport coordinate grid (11x11 viewport) */}
              <div className="w-full h-full grid grid-cols-11 grid-rows-11 gap-0.5 aspect-square relative bg-zinc-950">
                {viewportTiles.map(tile => {
                  const isPlayerHere = tile.x === playerX && tile.y === playerY;
                  const isSelected = tile.x === selectedX && tile.y === selectedY;
                  
                  // Check active alert icons on top of indices NPCs
                  const relativeNPC = npcs.find(n => n.x === tile.x && n.y === tile.y);
                  const npcQuestIndicator = relativeNPC ? checkNpcStateIndicator(relativeNPC.id) : null;

                  // Shaking filters and brightness alternates during harvest strikes
                  const isBeingSwung = harvestTargetCoords?.x === tile.x && harvestTargetCoords?.y === tile.y;
                  let customStyleClasses = '';
                  if (isBeingSwung) {
                    customStyleClasses += harvestFlashFrame === 1 ? ' brightness-[2.5] scale-[1.05] ' : ' brightness-100 ';
                    customStyleClasses += ' duration-75 ';
                  }

                  // Under translation bounce
                  if (isBeingSwung && harvestTargetCoords?.type === 'stone' && harvestBounceState) {
                    customStyleClasses += ' -translate-y-2 ';
                  }

                  return (
                    <div
                      key={`${tile.x}_${tile.y}`}
                      onClick={() => {
                        setSelectedX(tile.x);
                        setSelectedY(tile.y);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedX(tile.x);
                        setSelectedY(tile.y);
                        setGridContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          tileX: tile.x,
                          tileY: tile.y,
                          tileType: tile.type,
                          businessId: tile.businessId
                        });
                      }}
                      className={`relative w-full h-full flex items-center justify-center border border-white/5 rounded cursor-pointer transition-all duration-75 select-none ${
                        isSelected ? 'ring-2 ring-yellow-400 z-10 border-yellow-405' : ''
                      } ${
                        tile.type === 'grass' ? 'bg-[#0a190c] hover:bg-[#0c2010]' :
                        tile.type === 'forest_tree' ? 'bg-[#091a0e]' :
                        tile.type === 'quarry_stone' ? 'bg-[#18181b] hover:bg-[#202024]' :
                        tile.type === 'road_brick' ? (tile.isDirt ? 'bg-[#1e130c]' : 'bg-[#2d1b10]') :
                        tile.type === 'center_greenwood' ? 'bg-[#1c0d02]' :
                        tile.type === 'clay_deposit' ? 'bg-[#1e130a] hover:bg-[#27190d]' :
                        tile.type === 'landmark' ? 'bg-[#060e1d] hover:bg-[#0a162b]' :
                        'bg-[#060708]'
                      } ${customStyleClasses}`}
                    >
                      {/* Collision alert outline indicator */}
                      {collidedTile && collidedTile.x === tile.x && collidedTile.y === tile.y && (
                        <div className="absolute inset-0 bg-red-600/30 border border-red-500 animate-pulse rounded z-10" />
                      )}

                      {/* Display characters on map coords */}
                      {isPlayerHere ? (
                        <div id="player_sprite" className="absolute inset-0.5 z-20 flex items-center justify-center">
                          <RetroCharacter 
                            skin={charSkin} 
                            hair={charHair} 
                            clothing={clothing} 
                            accessory={charAccessory}
                            isMoving={isMoving}
                            direction={direction}
                            playerDirection={playerDirection}
                            gender={charGender}
                            harvestingType={(isHarvestingFreeze && harvestTargetCoords) ? harvestTargetCoords.type : null}
                          />
                        </div>
                      ) : null}

                      {/* Display NPC avatars */}
                      {relativeNPC && !isPlayerHere ? (
                        <div className="absolute inset-0.5 z-20">
                          <RetroCharacter isNPC={true} npcType={relativeNPC.npcType} />
                          
                          {/* Pulsing quest status indicator alerts exactly above their head */}
                          {npcQuestIndicator && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                              {npcQuestIndicator === 'ready' && (
                                <span className="text-white bg-silver-500 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-yellow-400 shadow-[0_0_8px_white] animate-bounce">
                                  ★
                                </span>
                              )}
                              {npcQuestIndicator === 'incomplete' && (
                                <span className="bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                  ?
                                </span>
                              )}
                              {npcQuestIndicator === 'quest' && (
                                <span className="bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none animate-bounce flex items-center justify-center shadow-[0_0_6px_#facc15]">
                                  !
                                </span>
                              )}
                            </div>
                          )}

                          {/* Beautiful floating community gossip and historical fact overlay when near player */}
                          {(() => {
                            const isStandingNearNPC = Math.abs(playerX - relativeNPC.x) <= 1 && Math.abs(playerY - relativeNPC.y) <= 1;
                            const gossipPool = NPC_GOSSIP_DATA[relativeNPC.id] || [];
                            const activeGossipText = gossipPool.length > 0 ? gossipPool[activeGossipTick % gossipPool.length] : '';
                            
                            if (!isStandingNearNPC || !activeGossipText) return null;
                            
                            return (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 4 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-[#0a0a0c]/98 border border-amber-500/40 p-2 rounded-lg text-center text-[7.5px] font-sans leading-tight text-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-none z-50 flex flex-col items-center gap-1"
                              >
                                <span className="text-[6.5px] font-mono text-amber-400 uppercase tracking-widest font-black flex items-center gap-0.5 select-none">
                                  💬 HISTORIC ECHO
                                </span>
                                <p className="text-gray-200 select-text leading-tight font-sans">
                                  &ldquo;{activeGossipText}&rdquo;
                                </p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-solid border-transparent border-t-amber-500" />
                              </motion.div>
                            );
                          })()}
                        </div>
                      ) : null}

                      {/* Display Apprentices avatars on map */}
                      {apprentices.some(app => app.x === tile.x && app.y === tile.y) && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0.5 z-15">
                          {(() => {
                            const app = apprentices.find(a => a.x === tile.x && a.y === tile.y);
                            if (!app) return null;

                            let statusEmote = '💤';
                            if (app.state === 'walking') statusEmote = '🚶';
                            else if (app.state === 'harvesting') {
                              statusEmote = app.type === 'wood' ? '🪓' : app.type === 'stone' ? '⛏️' : '🏺';
                            } else if (app.role === 'craftsman') {
                              statusEmote = '⚒️';
                            }

                            return (
                              <div className="relative w-full h-full">
                                <RetroCharacter 
                                  isNPC={true} 
                                  npcType="apprentice" 
                                  skin={app.skin} 
                                  hair={app.hair} 
                                  clothing={app.clothing} 
                                  isMoving={app.state === 'walking'}
                                />
                                {/* Floating Emote Bubble */}
                                <motion.div 
                                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-950/90 border border-yellow-500/30 text-[8px] px-1 py-0.5 rounded shadow-lg z-20 font-mono leading-none"
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                >
                                  {statusEmote}
                                </motion.div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Display Grass icons */}
                      {tile.type === 'grass' && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                          <svg viewBox="0 0 24 24" className="w-[12px] h-[12px]">
                            <rect x="6" y="14" width="2" height="4" fill="#047857" />
                            <rect x="10" y="8" width="2" height="10" fill="#10b981" />
                            <rect x="14" y="11" width="2" height="7" fill="#047857" />
                            <rect x="18" y="13" width="2" height="5" fill="#059669" />
                          </svg>
                        </div>
                      )}

                      {/* Display Pine/Oak Tree with wood grains details and gradients */}
                      {tile.type === 'forest_tree' && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0 flex items-center justify-center p-0.5 pointer-events-none">
                          {tile.isStump ? (
                            <span className="text-[9px] text-yellow-700 font-mono">🪵</span>
                          ) : (
                            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                              <defs>
                                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#34d399" />
                                  <stop offset="50%" stopColor="#059669" />
                                  <stop offset="100%" stopColor="#064e3b" />
                                </linearGradient>
                              </defs>
                              {/* Shaded Tree Trunk */}
                              <rect x="10" y="15" width="4" height="7" fill="#78350f" rx="0.5" />
                              <rect x="10" y="15" width="1.5" height="7" fill="#451a03" />
                              {/* 3 Tier Retro Canopies with glowing golden highlights */}
                              <polygon points="12,1 3,11 21,11" fill="url(#leafGrad)" />
                              <polygon points="12,5 5,14 19,14" fill="#047857" />
                              <polygon points="12,9 7,17 17,17" fill="#065f46" />
                              {/* Golden Pine Outline Tips */}
                              <circle cx="12" cy="1" r="1" fill="#fbbf24" className="animate-pulse" />
                              <circle cx="3" cy="11" r="0.8" fill="#fbbf24" opacity="0.8" />
                              <circle cx="21" cy="11" r="0.8" fill="#fbbf24" opacity="0.8" />
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Display Multi-fragment rock quarry limestone */}
                      {tile.type === 'quarry_stone' && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
                          {tile.isRubble ? (
                            <span className="text-[8px] text-gray-600 font-mono">▞</span>
                          ) : (
                            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
                              {/* Layered Gem Facets */}
                              <polygon points="12,2 4,14 12,22 20,14" fill="#71717a" /> {/* Left/Overall Rock Body */}
                              <polygon points="12,2 12,22 20,14" fill="#3f3f46" /> {/* Deep shadow face */}
                              <polygon points="12,2 4,14 12,14" fill="#52525b" /> {/* Upper highlight face */}
                              {/* Glowing gold ore veins representing Tulsa oil-shale mineral wealth */}
                              <path d="M 12,6 L 8,10 L 14,14 L 11,19" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" className="animate-pulse" />
                              <path d="M 12,2 L 12,22" fill="none" stroke="#27272a" strokeWidth="1" opacity="0.5" />
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Display brick paved road overlays */}
                      {tile.type === 'road_brick' && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <svg viewBox="0 0 24 24" className="w-full h-full stroke-orange-200" strokeWidth="0.8" fill="none">
                            <line x1="0" y1="6" x2="24" y2="6" />
                            <line x1="0" y1="12" x2="24" y2="12" />
                            <line x1="0" y1="18" x2="24" y2="18" />
                            <line x1="4" y1="0" x2="4" y2="6" strokeDasharray="1 1" />
                            <line x1="16" y1="0" x2="16" y2="6" strokeDasharray="1 1" />
                            <line x1="10" y1="6" x2="10" y2="12" strokeDasharray="1 1" />
                            <line x1="22" y1="6" x2="22" y2="12" strokeDasharray="1 1" />
                            <line x1="4" y1="12" x2="4" y2="18" strokeDasharray="1 1" />
                            <line x1="16" y1="12" x2="16" y2="18" strokeDasharray="1 1" />
                            <line x1="10" y1="18" x2="10" y2="24" strokeDasharray="1 1" />
                            <line x1="22" y1="18" x2="22" y2="24" strokeDasharray="1 1" />
                          </svg>
                        </div>
                      )}

                      {/* Display deep river wavy water overlays */}
                      {tile.type === 'river' && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0 bg-blue-900/40 overflow-hidden pointer-events-none">
                          <svg viewBox="0 0 24 24" className="w-full h-full opacity-60">
                            <path d="M-2,6 Q4,12 10,6 T22,6" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
                            <path d="M-2,15 Q4,21 10,15 T22,15" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                          </svg>
                        </div>
                      )}

                      {/* Display Built Businesses and Cottages */}
                      {tile.type === 'built_business' && tile.businessId && (
                        <RetroBusiness 
                          businessId={tile.businessId} 
                          level={tile.level} 
                          isConstructing={tile.isConstructing}
                          constructionTimer={tile.constructionTimer}
                          isMuted={isMuted}
                          masterVolume={masterVolume}
                        />
                      )}

                      {tile.type === 'cottage' && (
                        <RetroBusiness 
                          businessId="cottage" 
                          level={1} 
                          isConstructing={tile.isConstructing}
                          constructionTimer={tile.constructionTimer}
                          isMuted={isMuted}
                          masterVolume={masterVolume}
                        />
                      )}

                      {tile.type === 'center_greenwood' && (
                        <div className="absolute inset-0 bg-[#3b1a04] flex flex-col items-center justify-center border-2 border-yellow-500/40 rounded p-0.5 shadow-inner">
                          <svg viewBox="0 0 32 32" className="w-[18px] h-[18px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] fill-none stroke-yellow-400" strokeWidth="1.5">
                            {/* Dome/Arched Roof */}
                            <path d="M 2,12 L 16,3 L 30,12 Z" fill="#78350f" />
                            {/* Inner horizontal pediment */}
                            <line x1="2" y1="12" x2="30" y2="12" />
                            {/* Iconic 4 Columns */}
                            <rect x="5" y="12" width="3" height="15" fill="#facc15" />
                            <rect x="11" y="12" width="3" height="15" fill="#facc15" />
                            <rect x="18" y="12" width="3" height="15" fill="#facc15" />
                            <rect x="24" y="12" width="3" height="15" fill="#facc15" />
                            {/* Solid base */}
                            <rect x="2" y="27" width="28" height="4" fill="#fbbf24" />
                          </svg>
                          <span className="text-[5.5px] font-mono text-yellow-300 font-extrabold uppercase mt-0.5 tracking-tighter scale-95 origin-center leading-none">TRUST</span>
                        </div>
                      )}

                      {/* Clay Deposit site */}
                      {tile.type === 'clay_deposit' && !isPlayerHere && !relativeNPC && (
                        <div className="absolute inset-0 bg-[#3b291a] border border-[#d97706]/20 flex flex-col items-center justify-center p-0.5">
                          {tile.isSilt ? (
                            <span className="text-[9px] text-amber-900 font-mono">▞</span>
                          ) : (
                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              <ellipse cx="12" cy="14" rx="9" ry="6" fill="#78350f" />
                              <ellipse cx="11" cy="13" rx="7" ry="4.5" fill="#92400e" />
                              <path d="M 5 11 Q 12 7 19 11" fill="none" stroke="#d97706" strokeWidth="1.5" className="animate-pulse" />
                              <circle cx="8" cy="13" r="1.5" fill="#f59e0b" />
                              <circle cx="15" cy="14" r="1.2" fill="#d97706" />
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Historic landmark site */}
                      {tile.type === 'landmark' && !isPlayerHere && !relativeNPC && (() => {
                        const isDiscovered = discoveredLandmarks.includes(tile.landmarkId || '');
                        const isRestored = restoredLandmarks.includes(tile.landmarkId || '');
                        return (
                          <div className={`absolute inset-0 flex flex-col items-center justify-center p-0.5 rounded transition-all duration-300 ${
                            isRestored 
                              ? 'bg-gradient-to-b from-[#450a0a] to-[#2d0606] border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8),inset_0_0_6px_rgba(245,158,11,0.5)] animate-pulse'
                              : isDiscovered
                                ? 'bg-[#181510] border-2 border-yellow-405 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-goldenGlowPulse'
                                : 'bg-[#0e1726] border-2 border-yellow-400 shadow-[inset_0_0_8px_rgba(234,179,8,0.5)]'
                          }`}>
                            {isRestored && (
                              <div className="absolute top-0.5 text-[5px] text-amber-300 font-mono scale-95 select-none animate-bounce">✨</div>
                            )}
                            <svg viewBox="0 0 24 24" className={`w-[15px] h-[15px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] fill-none ${isRestored ? 'stroke-amber-300 animate-pulse' : 'stroke-yellow-400'}`} strokeWidth="1.5">
                              {tile.landmarkId === 'gurley_office' ? (
                                <g>
                                  <path d="M 4 20 L 4 8 L 12 4 L 20 8 L 20 20 Z" fill={isRestored ? '#7c2d12' : '#451a03'} />
                                  <path d="M 10 20 L 10 14 L 14 14 L 14 20 Z" fill="#fbbf24" opacity="0.9" />
                                  <line x1="12" y1="4" x2="12" y2="20" stroke="#fcd34d" strokeWidth="0.5" />
                                </g>
                              ) : tile.landmarkId === 'rector_manor' ? (
                                <g>
                                  <path d="M 5 20 L 5 10 L 12 6 L 19 10 L 19 20 Z" fill={isRestored ? '#065f46' : '#064e3b'} />
                                  <polygon points="12,2 8,7 16,7" fill="#fbbf24" />
                                  <line x1="8" y1="7" x2="8" y2="20" stroke="#fbbf24" strokeWidth="0.5" />
                                  <line x1="16" y1="7" x2="16" y2="20" stroke="#fbbf24" strokeWidth="0.5" />
                                  <circle cx="12" cy="14" r="2.5" fill="#facc15" />
                                </g>
                              ) : tile.landmarkId === 'stradford_hotel' ? (
                                <g>
                                  <rect x="4" y="6" width="16" height="14" rx="1" fill={isRestored ? '#1e3a8a' : '#1e293b'} />
                                  <line x1="7" y1="6" x2="7" y2="20" stroke="#fbbf24" strokeWidth="0.8" />
                                  <line x1="17" y1="6" x2="17" y2="20" stroke="#fbbf24" strokeWidth="0.8" />
                                  <rect x="10" y="15" width="4" height="5" fill="#ca8a04" />
                                  <circle cx="12" cy="10" r="1.5" fill="#fbbf24" />
                                </g>
                              ) : tile.landmarkId === 'gerumba_temple' ? (
                                <g>
                                  <path d="M 4 20 L 4 13 C 4 9, 20 9, 20 13 L 20 20 Z" fill={isRestored ? '#a16207' : '#78350f'} />
                                  <path d="M 12 9 C 9 9, 9 5, 12 2 C 15 5, 15 9, 12 9" fill="#facc15" />
                                  <circle cx="12" cy="2" r="1" fill="#ffffff" />
                                  <rect x="10" y="15" width="4" height="5" rx="0.5" fill="#92400e" />
                                </g>
                              ) : (
                                <g>
                                  {/* Obelisk monument / historic tower pillar shape */}
                                  <path d="M 12 2 L 7 7 L 8 20 L 16 20 L 17 7 Z" fill={isRestored ? '#fbbf24' : '#ca8a04'} />
                                  <path d="M 12 2 L 12 20" stroke={isRestored ? '#ffffff' : '#facc15'} strokeWidth="0.8" />
                                  <rect x="5" y="20" width="14" height="2" fill={isRestored ? '#b45309' : '#854d0e'} />
                                </g>
                              )}
                            </svg>
                            <span className={`text-[4px] font-mono tracking-tighter scale-90 mt-0.5 uppercase leading-none text-center truncate w-full ${
                              isRestored 
                                ? 'text-amber-300 font-black' 
                                : isDiscovered
                                  ? 'animate-goldenGlowPulse font-black'
                                  : 'text-yellow-350 animate-pulse'
                            }`}>
                              {tile.landmarkId === 'gurley_office' ? 'GURLEY OFFICE' :
                               tile.landmarkId === 'rector_manor' ? 'RECTOR MANOR' :
                               tile.landmarkId === 'stradford_hotel' ? 'GRAND HOTEL' :
                               tile.landmarkId === 'gerumba_temple' ? 'WISDOM TEMPLE' :
                               isRestored ? 'RESTORED' : 'MONUMENT'}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Default plot plots overlay */}
                      {tile.type === 'leasehold' && (
                        <div className="absolute inset-1.5 border border-dashed border-yellow-500/30 rounded flex flex-col items-center justify-center">
                          <span className="text-[5.5px] text-yellow-650 tracking-tighter uppercase">Plot</span>
                          <span className="text-[6px] text-yellow-500/40 font-bold">+</span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* RETRO D-PAD NAVIGATION FOR TOUCH MOBILE */}
            <div id="navigation_controls_dpad" className={`grid grid-cols-3 gap-2 max-w-[200px] mx-auto select-none md:hidden py-2 ${mobileActiveTab === 'play' ? 'grid' : 'hidden'}`}>
              <div />
              <button 
                onClick={() => attemptMove('N')} 
                className="w-12 h-12 bg-zinc-900/90 active:bg-yellow-500 active:text-black border-2 border-yellow-500/30 text-yellow-405 font-black text-xl rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all transform select-none"
              >
                ▲
              </button>
              <div />
              <button 
                onClick={() => attemptMove('W')} 
                className="w-12 h-12 bg-zinc-900/90 active:bg-yellow-500 active:text-black border-2 border-yellow-500/30 text-yellow-405 font-black text-xl rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all transform select-none"
              >
                ◀
              </button>
              <button 
                onClick={() => handleActionInput()} 
                className="w-12 h-12 bg-yellow-600 active:bg-yellow-400 text-black font-mono font-black text-[10px] rounded-full border-2 border-yellow-350 flex items-center justify-center shadow-xl active:scale-90 transition-all select-none"
              >
                ACT
              </button>
              <button 
                onClick={() => attemptMove('E')} 
                className="w-12 h-12 bg-zinc-900/90 active:bg-yellow-500 active:text-black border-2 border-yellow-500/30 text-yellow-405 font-black text-xl rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all transform select-none"
              >
                ▶
              </button>
              <div />
              <button 
                onClick={() => attemptMove('S')} 
                className="w-12 h-12 bg-zinc-900/90 active:bg-yellow-500 active:text-black border-2 border-yellow-500/30 text-yellow-405 font-black text-xl rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all transform select-none"
              >
                ▼
              </button>
              <div />
            </div>

            {/* DENSE SYSTEM AUDIT LOGS FOOTER */}
            <div id="dense_ledger_tracker_logs" className={`p-2 sm:p-3.5 bg-black/90 border border-yellow-500/20 rounded-xl space-y-1 font-mono text-[10px] sm:text-xs ${mobileActiveTab === 'logs' ? 'block' : 'hidden md:block'}`}>
              <div 
                className="flex justify-between items-center cursor-pointer select-none pb-1"
                onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
              >
                <span className="text-yellow-500/50 font-bold uppercase tracking-widest text-[8.5px] flex items-center gap-1">
                  📟 COMMUNITY TRANSMISSION SYSTEM
                </span>
                <span className="text-yellow-500 text-[9px] sm:hidden">{isLogsCollapsed ? '▼ EXPAND' : '▲ COLLAPSE'}</span>
              </div>
              <div className={`space-y-1 mt-1 transition-all duration-300 overflow-y-auto scrollbar-none ${(isLogsCollapsed && mobileActiveTab !== 'logs') ? 'max-h-0 md:max-h-[250px] opacity-0 md:opacity-100' : 'max-h-[250px] opacity-100'}`}>
                {gameSystemLogs.map((log, lidx) => (
                  <p key={lidx} className="text-gray-300 leading-normal flex items-start gap-1">
                    <span className="text-yellow-500 leading-none">➔</span>
                    <span className="flex-1 text-[9px] sm:text-[11px]">{log}</span>
                  </p>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR: SIDE HUD WITH RADAR, INSPECTOR, & APPRENTICES */}
          <div className={`w-full md:w-[360px] md:h-full flex flex-col space-y-4 p-3 md:p-4 bg-[#09090c]/95 md:bg-zinc-950/90 border-t md:border-t-0 md:border-l border-yellow-500/20 overflow-y-auto scrollbar-none flex-grow md:flex-shrink-0 min-h-0 z-20 md:col-start-2 md:row-start-1 md:row-span-3 ${mobileActiveTab === 'radar' ? 'flex' : 'hidden md:flex'}`}>

            {/* LIVE SATELLITE HUD RADAR MINI-MAP & CELL INSPECTOR (Collapsible) */}
            <div className="bg-zinc-950/80 border-2 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl">
              <div 
                className="p-3 bg-zinc-950/80 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer select-none"
                onClick={() => setIsMapConsoleCollapsed(!isMapConsoleCollapsed)}
              >
                <span className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                  🗺️ CELL RADAR & INSPECTOR
                </span>
                <span className="text-yellow-500 text-[9px] md:hidden">{isMapConsoleCollapsed ? '▼ EXPAND' : '▲ COLLAPSE'}</span>
              </div>
              <div className={`p-3 space-y-4 transition-all duration-300 ${(isMapConsoleCollapsed && mobileActiveTab !== 'radar') ? 'max-h-0 md:max-h-[9999px] opacity-0 md:opacity-100 overflow-hidden' : 'max-h-[9999px] opacity-100'}`}>
                <MiniMap
                  mapGrid={mapGrid}
                  playerX={playerX}
                  playerY={playerY}
                  npcs={npcs}
                  apprentices={apprentices}
                  discoveredLandmarks={discoveredLandmarks}
                  restoredLandmarks={restoredLandmarks}
                  selectedX={selectedX}
                  selectedY={selectedY}
                  visitedCoordinates={visitedCoordinates}
                  onSelectTile={(x, y) => {
                    setSelectedX(x);
                    setSelectedY(y);
                    playRetroTone('strike', 0.2);
                  }}
                />

                {/* 🎛️ RETRO CHIPTUNE MUSIC BOX */}
                <div id="retro_music_box" className="p-3 bg-[#0a0a0d]/98 border border-yellow-500/10 rounded-lg space-y-2">
                  <div className="border-b border-yellow-500/10 pb-1 flex justify-between items-center select-none">
                    <span className="text-[10px] font-black text-yellow-405 font-mono uppercase tracking-wider">
                      📻 MUSIC BOX
                    </span>
                    {chiptunePlaying && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>

                  <div className="flex justify-center items-center gap-2 py-1 bg-black/60 rounded border border-white/5 relative overflow-hidden select-none">
                    <RotateCw 
                      size={12} 
                      className={`text-yellow-400/80 transition-transform ${chiptunePlaying ? 'animate-spin' : 'opacity-30'}`} 
                      style={{ animationDuration: activeTrack === 'ragtime' ? '2.5s' : '3.8s' }} 
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-mono font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                        {activeTrack === 'ragtime' ? "🎹 Ragtime Lull" : activeTrack === 'blues' ? "🎷 Slow Blues" : "💤 SILENT DECK"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        playRetroTone('success', 0.5);
                        setActiveTrack('ragtime');
                        setChiptunePlaying(true);
                      }}
                      className={`py-1 rounded text-center border font-bold uppercase cursor-pointer transition-all ${
                        activeTrack === 'ragtime' && chiptunePlaying
                          ? 'bg-yellow-600 border-yellow-500 text-black font-black' 
                          : 'bg-zinc-950 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      RAGTIME
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playRetroTone('success', 0.5);
                        setActiveTrack('blues');
                        setChiptunePlaying(true);
                      }}
                      className={`py-1 rounded text-center border font-bold uppercase cursor-pointer transition-all ${
                        activeTrack === 'blues' && chiptunePlaying
                          ? 'bg-yellow-600 border-yellow-500 text-black font-black' 
                          : 'bg-zinc-950 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      BLUES
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playRetroTone('strike', 0.5);
                        setChiptunePlaying(false);
                        setActiveTrack('none');
                      }}
                      className={`py-1 rounded text-center border font-bold uppercase cursor-pointer transition-all ${
                        activeTrack === 'none' || !chiptunePlaying
                          ? 'bg-zinc-800 border-zinc-700 text-gray-300' 
                          : 'bg-zinc-950 border-white/5 text-red-400 hover:text-red-300'
                      }`}
                    >
                      STOP
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 pt-1 select-none">
                  <span className="flex items-center gap-1">
                    🔊 VOL: {Math.round(masterVolume * 100)}%
                  </span>
                  <span className="text-[7.5px] tracking-tight">WEB AUDIO SYNTH PROTOCOL</span>
                </div>
              </div>
            </div>
            </div>
            
            {/* VIEWPORT CONSOLE SELECTIONS */}
            <div id="inspector_ledger_panel" className="p-4 bg-zinc-950/80 border-2 border-yellow-500/30 rounded-xl space-y-3 shadow-xl">
              <div className="border-b border-yellow-500/20 pb-2 flex justify-between items-center">
                <span className="text-xs font-black text-white font-mono uppercase">Plot Inspector</span>
                <span className="text-[9.5px] font-mono text-gray-500 font-bold">GRID ACC: ({selectedX}, {selectedY})</span>
              </div>

              {/* TABS TACTICAL TOGGLE */}
              <div className="flex gap-1 bg-zinc-950/60 p-0.5 rounded border border-white/5 text-[9px] font-mono">
                <button
                  type="button"
                  onClick={() => setShowTileStats(false)}
                  className={`flex-1 py-1 text-center font-bold rounded uppercase transition-all ${
                    !showTileStats ? 'bg-yellow-600 text-black font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ⚙️ Controls
                </button>
                <button
                  type="button"
                  onClick={() => setShowTileStats(true)}
                  className={`flex-1 py-1 text-center font-bold rounded uppercase transition-all ${
                    showTileStats ? 'bg-yellow-600 text-black font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📊 Statistics
                </button>
              </div>

              {!tile ? (
                <p className="text-xs text-gray-400">Select map cell.</p>
              ) : (() => {
                const selectedNPC = npcs.find(n => n.x === tile.x && n.y === tile.y);
                const isCenterHub = tile.type === 'center_greenwood';

                if (isCenterHub) {
                  return (
                    <div className="space-y-3 font-mono p-1">
                      <div className="flex justify-between text-xs font-mono border-b border-white/5 pb-2">
                        <span className="text-gray-400">Cooperative Center:</span>
                        <span className="text-yellow-500 font-bold uppercase animate-pulse">🏛️ CENTRAL HUB</span>
                      </div>
                      <div className="p-3 bg-zinc-950/80 rounded-xl border-2 border-yellow-500/10 space-y-3">
                        <p className="text-[10px] text-yellow-405 border-b border-white/5 pb-1 font-black">🏛️ Greenwood Civic Trust Center</p>
                        <div className="flex justify-between text-[9px]"><span className="text-gray-400">Position:</span> <span className="text-white">Central Square (16, 16)</span></div>
                        <div className="flex justify-between text-[9px]"><span className="text-gray-400">Function:</span> <span className="text-emerald-400 font-bold">Municipal Administration</span></div>
                        
                        <p className="text-gray-350 text-[8.5px] font-sans leading-relaxed mt-1 bg-black/40 p-2.5 rounded border border-white/5">
                          The monumental headquarters of New Greenwood&apos;s community. This central hub administers public property distribution, tracks regional indices, and hosts the cooperative ledger system.
                        </p>

                        {/* CO-OP LEADERBOARD TRIGGER BUTTON */}
                        <div className="p-2.5 bg-yellow-500/5 rounded-xl border border-yellow-500/20 space-y-2 mt-2">
                          <div className="flex justify-between text-[8px] tracking-wide text-gray-450 uppercase font-black font-mono">
                            <span>Community Rankings</span>
                            <span className="text-yellow-450 font-extrabold animate-pulse">● Global Feed</span>
                          </div>
                          <p className="text-[7.5px] text-gray-400 leading-tight font-sans">
                            Compare your district&apos;s cooperative achievements against top regional pioneers in our secure regional ledger.
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenLeaderboard}
                            className="w-full py-1.5 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-black font-extrabold text-center uppercase text-[8.5px] rounded border border-yellow-500/40 font-mono active:scale-95 transition-all cursor-pointer font-black flex items-center justify-center gap-1 shadow-[0_0_8px_rgba(234,179,8,0.25)]"
                          >
                            🏆 Launch Co-op Leaderboard
                          </button>
                        </div>

                        {/* COMMUNITY RESERVES VALUE HUB SERVICES */}
                        <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 space-y-1 mt-2 text-[8px]">
                          <span className="text-[7.5px] font-mono text-yellow-500 uppercase font-black block">🔒 Community Savings Vault</span>
                          <div className="flex justify-between font-mono text-gray-300">
                            <span>Global Reserves:</span>
                            <span className="text-emerald-405 font-bold">{(bswx * 12.5).toFixed(0)} BSWX</span>
                          </div>
                          <div className="flex justify-between font-mono text-gray-300">
                            <span>District Security Rating:</span>
                            <span className="text-[#a855f7] font-bold uppercase tracking-wider">{reputation >= 120 ? '🏛️ Tier A+ Sovereign' : '🌱 Rising Pioneer'}</span>
                          </div>
                          <p className="text-[7.5px] text-gray-550 leading-normal font-sans pt-0.5">
                            Your secure capital accounts are backed cooperatively by Greenwood&apos;s joint reserves and active commercial storefront contracts.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (selectedNPC) {
                  return (
                    <div className="space-y-3 font-mono p-1">
                      <div className="flex justify-between text-xs font-mono border-b border-white/5 pb-2">
                        <span className="text-gray-400">Cooperative Node:</span>
                        <span className="text-yellow-500 font-bold uppercase">🏡 HISTORIC DWELLING</span>
                      </div>
                      <div className="p-3 bg-zinc-950/80 rounded-xl border-2 border-yellow-500/10 space-y-3">
                        <p className="text-[10px] text-yellow-405 border-b border-white/5 pb-1 font-black uppercase tracking-wider">
                          {selectedNPC.name}&apos;s {selectedNPC.id === 'gurley' ? 'Timber Homestead' : selectedNPC.id === 'rector' ? 'Oil Estate Lodge' : selectedNPC.id === 'stradford' ? 'Luxury Lounge' : 'Cosmic Hermitage'}
                        </p>
                        <div className="flex justify-between text-[9px]"><span className="text-gray-400">Pioneer Owner:</span> <span className="text-emerald-400 font-bold">{selectedNPC.name}</span></div>
                        <div className="flex justify-between text-[9px]"><span className="text-gray-400">Dwelling Coords:</span> <span className="text-yellow-500 font-bold">({selectedNPC.x}, {selectedNPC.y})</span></div>
                        
                        <p className="text-gray-300 text-[8.5px] font-sans leading-relaxed mt-2 bg-black/60 p-2.5 rounded border border-white/5">
                          {selectedNPC.id === 'gurley' && "O.W. Gurley's Founder Homestead & Land Registry Cabin. A sturdy, beautiful timber log dwelling marking the very origin of Greenwood's independent coordinate layouts and real estate registry."}
                          {selectedNPC.id === 'rector' && "Sarah Rector's Oil Wealth Lodge. A cozy, stone-fortified manor cottage representing early capital preservation, Creek Nation pride, and private oil allotment fields."}
                          {selectedNPC.id === 'stradford' && "J.B. Stradford's Guesthouse Hut. A red-brick premium lodging cabin, symmetrical window arches, reflecting law graduation, hospitality, and civil rights dignity."}
                          {selectedNPC.id === 'gerumba' && "Pharoah Gerumba's Kemetic Mud-Brick Sanctuary. An earthy, dome-shaped clay hermitage dedicated to Moorish cosmic sciences, truth of Ma'at, and community-wide cooperative reliance."}
                        </p>
                        
                        <div className="pt-2 border-t border-white/5 text-[8.5px] text-gray-500 leading-normal font-sans">
                          🌟 Talk to <strong>{selectedNPC.name}</strong> by walking next to them to unlock their historical quest chapters. They offer trade options, cultural quiz stages, and prestigious LP rewards!
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {showTileStats ? (
                    <div className="space-y-3 font-sans">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">Cell Analytics:</span>
                        <span className="text-yellow-500 font-bold uppercase">📊 ACTIVE STATS</span>
                      </div>
                      <div className="p-3 bg-zinc-950/80 rounded border-2 border-yellow-500/10 space-y-2">
                        {/* Render computed details based on tile type */}
                        {tile.type === 'built_business' && (
                          <div className="space-y-1.5 text-[9.5px] font-mono">
                            <p className="text-[10px] text-yellow-400 border-b border-white/5 pb-1 font-black">🏬 {BUSINESS_CATALOG[tile.businessId || '']?.name || "Cooperative Shop"}</p>
                            <div className="flex justify-between"><span className="text-gray-450">Owner State:</span> <span className="text-emerald-400 font-bold">Greenwood Union</span></div>
                            <div className="flex justify-between"><span className="text-gray-450">Active Tier:</span> <span className="text-yellow-500 font-bold">Lvl {tile.level}/5</span></div>
                            {tile.specialization && (
                              <div className="flex justify-between"><span className="text-gray-450">Pathway:</span> <span className="text-indigo-400 font-bold uppercase">{tile.specialization === 'A' ? 'Cash (+B)' : tile.specialization === 'B' ? 'Civic (+REP)' : 'Tech'}</span></div>
                            )}
                            <div className="flex justify-between"><span className="text-gray-450">Yield BSWX:</span> <span className="text-yellow-500 font-bold">+{tileYieldBswx.toFixed(1)}/min</span></div>
                            <div className="flex justify-between"><span className="text-gray-450">Yield REP:</span> <span className="text-emerald-400 font-bold">+{tileYieldRep.toFixed(1)}/min</span></div>
                            <div className="flex justify-between"><span className="text-gray-450">Cottages coef:</span> <span className="text-slate-300">x{tileCottageFactor.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-450">Net factor:</span> <span className="text-yellow-400 font-extrabold">x{tileFinalMultiplier.toFixed(2)}</span></div>
                            <div className="pt-2 mt-2 border-t border-white/10">
                              <button
                                type="button"
                                // eslint-disable-next-line react-hooks/refs
                                onClick={() => demolishStructure(tile)}
                                className="w-full py-1.5 bg-red-950/50 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-white font-extrabold text-[9px] uppercase rounded transition-all cursor-pointer active:scale-95"
                              >
                                💥 Demolish Business
                              </button>
                            </div>
                          </div>
                        )}

                        {tile.type === 'cottage' && (
                          <div className="space-y-1.5 text-[9.5px] font-mono">
                            <p className="text-[10px] text-teal-400 border-b border-white/5 pb-1 font-black">🏡 Pioneer Cottage</p>
                            <div className="flex justify-between"><span className="text-gray-400">Asset Type:</span> <span className="text-teal-400 font-bold">Residential</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Bonus Power:</span> <span className="text-yellow-500 font-bold">Compounds 1.5x output</span></div>
                            <p className="text-gray-400 text-[8.5px] font-sans leading-relaxed mt-1">
                              Pioneer cottages provide residential shelter, boosting passive co-op storefront operations globally by 50% compounding.
                            </p>
                            <div className="pt-2 mt-2 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => demolishStructure(tile)}
                                className="w-full py-1.5 bg-red-950/50 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-white font-extrabold text-[9px] uppercase rounded transition-all cursor-pointer active:scale-95"
                              >
                                💥 Demolish Cottage
                              </button>
                            </div>
                          </div>
                        )}

                        {(tile.type === 'forest_tree' || tile.type === 'quarry_stone' || tile.type === 'clay_deposit') && (
                          <div className="space-y-1.5 text-[9.5px] font-mono">
                            <p className="text-[10px] text-emerald-400 border-b border-white/5 pb-1 font-black">🌲 Natural Material Deposit</p>
                            <div className="flex justify-between"><span className="text-gray-400">Resource:</span> <span className="text-yellow-500 font-bold uppercase">{tile.type.replace('_', ' ')}</span></div>
                            <div className="flex justify-between"><span className="text-gray-405">State:</span> <span className="text-emerald-400 font-bold">{tile.cooldownRemaining ? 'REPLENISHING' : 'ACTIVE DEPOT'}</span></div>
                            <p className="text-[#a1a1aa] text-[8.5px] font-sans leading-relaxed mt-1">
                              Use physical tools to deplete resource deposits. Grants raw inputs or timber logs for crafting processed units.
                            </p>
                          </div>
                        )}

                        {tile.type === 'landmark' && (
                          <div className="space-y-1.5 text-[9.5px] font-mono">
                            <p className="text-[10px] text-amber-500 border-b border-white/5 pb-1 font-black">🏛️ Ancestral Landmark</p>
                            <div className="flex justify-between"><span className="text-gray-400 font-semibold">Monument ID:</span> <span className="text-white font-bold">{tile.landmarkId?.toUpperCase()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-410 font-semibold">Restoration:</span> <span className={restoredLandmarks.includes(tile.landmarkId || '') ? 'text-emerald-400 font-bold animate-pulse' : 'text-amber-500 font-bold'}>{restoredLandmarks.includes(tile.landmarkId || '') ? 'COMPLETED' : 'PENDING ACTION'}</span></div>
                            <p className="text-gray-400 text-[8.5px] font-sans leading-relaxed mt-1">
                              A local monument marking the Black cooperative success. Explore and restore all landmarks to complete challenges.
                            </p>
                          </div>
                        )}

                        {tile.type !== 'built_business' && tile.type !== 'cottage' && tile.type !== 'forest_tree' && tile.type !== 'quarry_stone' && tile.type !== 'clay_deposit' && tile.type !== 'landmark' && (
                          <div className="space-y-1.5 text-[9.5px] font-mono">
                            <p className="text-[10px] text-gray-405 border-b border-white/5 pb-1 font-black">🟨 Empty Lease Plot</p>
                            <div className="flex justify-between"><span className="text-gray-400">Status:</span> <span className="text-yellow-500 font-bold">Unoccupied</span></div>
                            <p className="text-gray-450 text-[8.5px] font-sans leading-relaxed mt-1">
                              Open plot eligible for joint commercial construction. Purchase a business blueprint from the Controls catalog tab to begin.
                            </p>
                          </div>
                        )}

                        {/* Recharts Live Chart Section if it is built business */}
                        {tile.type === 'built_business' && tile.businessId && (() => {
                          const historyKey = `${tile.x}_${tile.y}`;
                          const historyData = tileOutputHistory[historyKey] || [];
                          return (
                            <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2">
                              <div className="flex justify-between items-center text-[7.5px] font-mono text-gray-400 font-extrabold uppercase tracking-widest">
                                <span>Output History (Recharts):</span>
                                <span className="text-yellow-400 animate-pulse font-normal">● LIVE FEED</span>
                              </div>
                              {historyData.length < 2 ? (
                                <div className="h-[90px] flex flex-col items-center justify-center bg-black/50 border border-white/5 rounded p-3 text-center">
                                  <span className="text-yellow-500 text-[9px] font-mono font-bold">⏱ Measuring Passive Output...</span>
                                  <p className="text-gray-550 text-[7px] font-sans mt-0.5">Wait a few seconds for passive co-op cycles to compile historic indices.</p>
                                </div>
                              ) : (
                                <div className="p-1.5 bg-black/45 border border-white/5 rounded space-y-1">
                                  <div className="h-[105px] w-full overflow-hidden">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart
                                        data={historyData}
                                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                                      >
                                        <CartesianGrid strokeDasharray="2 2" stroke="#ffffff08" />
                                        <XAxis 
                                          dataKey="time" 
                                          stroke="#555555" 
                                          tickFormatter={(str) => str.split(':')[2] || str}
                                          tick={{ fill: '#666666', fontSize: 6.5, fontFamily: 'monospace' }} 
                                          axisLine={false}
                                          tickLine={false}
                                        />
                                        <YAxis 
                                          stroke="#555555" 
                                          tick={{ fill: '#666666', fontSize: 6.5, fontFamily: 'monospace' }}
                                          axisLine={false}
                                          tickLine={false}
                                        />
                                        <Tooltip 
                                          content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                              return (
                                                <div className="bg-zinc-950 border border-yellow-500/40 p-1 rounded text-[7.5px] font-mono leading-none space-y-1 shadow-xl">
                                                  <p className="text-gray-450 text-[6.5px]">Time: <span className="text-white font-bold">${payload[0].payload.time}</span></p>
                                                  {payload.map((pld, idx) => (
                                                    <p key={idx} style={{ color: pld.color }}>
                                                      {pld.name === 'bswx' ? '💵 BSWX' : '🤝 REP'}: <span className="font-extrabold">${Number(pld.value).toFixed(1)}/min</span>
                                                    </p>
                                                  ))}
                                                </div>
                                              );
                                            }
                                            return null;
                                          }}
                                        />
                                        <Line 
                                          type="monotone" 
                                          dataKey="bswx" 
                                          name="bswx"
                                          stroke="#eab308" 
                                          strokeWidth={1.5} 
                                          dot={false}
                                          activeDot={{ r: 3 }} 
                                        />
                                        <Line 
                                          type="monotone" 
                                          dataKey="rep" 
                                          name="rep"
                                          stroke="#10b981" 
                                          strokeWidth={1.5} 
                                          dot={false}
                                          activeDot={{ r: 3 }} 
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="flex justify-center gap-3 text-[7px] font-mono font-bold tracking-wider pt-0.5 select-none opacity-80">
                                    <span className="flex items-center gap-1 text-yellow-500">
                                      <span className="w-1.5 h-1.5 bg-yellow-450 rounded-full inline-block"></span>
                                      BSWX COINS
                                    </span>
                                    <span className="flex items-center gap-1 text-emerald-400">
                                      <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full inline-block"></span>
                                      REP CIVIL
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Status modifiers list */}
                        {tileIndicators.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5 text-left">
                            <span className="text-[7.5px] font-mono text-gray-400 font-extrabold uppercase tracking-widest block">Plot Status Modifiers:</span>
                            <div className="space-y-1">
                              {tileIndicators.map((ind, indIdx) => (
                                <div key={indIdx} className={`p-1.5 rounded flex items-start gap-1.5 border text-[8px] leading-tight font-mono ${
                                  ind.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/25 text-emerald-400' :
                                  ind.type === 'warning' ? 'bg-amber-950/40 border-amber-500/25 text-yellow-500' :
                                  ind.type === 'critical' ? 'bg-red-950/40 border-red-500/25 text-red-400' :
                                  'bg-sky-950/40 border-sky-500/25 text-sky-400'
                                }`}>
                                  <span className="text-[9.5px] shrink-0 select-none">{ind.icon}</span>
                                  <div className="flex-1 space-y-0.5">
                                    <strong className="font-mono text-[8px] uppercase tracking-wider block font-black leading-none">{ind.label}</strong>
                                    <span className="opacity-90 text-gray-300 block font-normal leading-normal">{ind.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  ) : (
                    /* showTileStats is false -> controls block */
                    <div className="space-y-3 font-sans">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">Cell State:</span>
                        <span className="text-white font-bold uppercase">{tile.type.replace('_', ' ')}</span>
                      </div>

                      {tile.cooldownRemaining ? (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] font-mono flex justify-between">
                          <span className="text-amber-400">Regrow countdown:</span>
                          <span className="text-white font-black">{tile.cooldownRemaining}s</span>
                        </div>
                      ) : null}

                      {/* ACTIVE SPECIALIZATION DECISIONS */}
                      {tile.type === 'built_business' && (tile.level || 1) >= 2 && !tile.specialization && (
                        <div className="p-2.5 bg-indigo-950/20 border border-indigo-400/20 rounded space-y-2">
                          <span className="text-[9.5px] font-bold text-indigo-300 block font-mono">COMMERCIAL PATHWAY OPTION</span>
                          <div className="grid grid-cols-3 gap-1.5 text-[8.5px]">
                            <button 
                              onClick={() => {
                                setMapGrid(prev => prev.map(row => row.map(t => (t.x === tile.x && t.y === tile.y) ? { ...t, specialization: 'A' } : t)));
                                setBswx(b => b + 50);
                                addLog("Specialized: Cash optimization path activated (+50 BSWX reward).");
                              }}
                              className="bg-zinc-900 border border-yellow-500/20 text-white rounded p-1 font-bold active:scale-95 transition-all cursor-pointer"
                            >
                              📈 CASH
                            </button>
                            <button 
                              onClick={() => {
                                setMapGrid(prev => prev.map(row => row.map(t => (t.x === tile.x && t.y === tile.y) ? { ...t, specialization: 'B' } : t)));
                                setReputation(r => r + 25);
                                addLog("Specialized: Civic focus path activated (+25 Reputation gain).");
                              }}
                              className="bg-zinc-900 border border-yellow-500/20 text-white rounded p-1 font-bold active:scale-95 transition-all cursor-pointer"
                            >
                              👑 CIVIC
                            </button>
                            <button 
                              onClick={() => {
                                setMapGrid(prev => prev.map(row => row.map(t => (t.x === tile.x && t.y === tile.y) ? { ...t, specialization: 'C' } : t)));
                                addLog("Specialized: Ecological solar array grids completed (Sovereign upgrade path).");
                              }}
                              className="bg-zinc-900 border border-yellow-500/20 text-white rounded p-1 font-bold active:scale-95 transition-all cursor-pointer"
                            >
                              ⚙️ TECH
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Business Upgrades */}
                      {tile.type === 'built_business' && !tile.isConstructing && tile.level !== undefined && tile.level < 5 && (
                        <div className="p-2.5 bg-yellow-500/5 rounded border border-yellow-500/20 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-gray-400">Current Level Status:</span>
                            <span className="text-yellow-500 font-black">Tier {tile.level}/5</span>
                          </div>
                          <button
                            onClick={() => upgradeStorefront(tile)}
                            className="w-full py-1.5 bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold font-mono text-[9.5px] uppercase rounded transition-all active:scale-95 cursor-pointer"
                          >
                            Upgrade to L{tile.level + 1} ({Math.max(1, Math.round(tile.level * 10 * (charHeirloom === 'brass_level' ? 0.8 : 1.0)))} PLK / {Math.max(1, Math.round(tile.level * 10 * (charHeirloom === 'brass_level' ? 0.8 : 1.0)))} BRK / {Math.max(1, Math.round(tile.level * 30 * (charHeirloom === 'brass_level' ? 0.8 : 1.0)))} LP)
                          </button>
                        </div>
                      )}

                      {/* CONSTRUCTION BLUEPRINTS CATALOGUE */}
                      {tile.type === 'leasehold' && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[9px] font-black text-amber-500 block uppercase font-mono">CONSTRUCTION CATALOG</span>
                          <div className="space-y-1.5">
                            {Object.values(BUSINESS_CATALOG).map(biz => (
                              <button
                                key={biz.id}
                                onClick={() => constructStorefront(biz.id)}
                                className="w-full p-2 bg-gradient-to-r from-zinc-900 to-black hover:from-zinc-850 hover:to-zinc-90 text-left text-[10px] rounded border border-white/5 flex justify-between items-center cursor-pointer transition-all"
                              >
                                <div>
                                  <span className="font-extrabold text-white block">{biz.name}</span>
                                  <span className="text-[8.5px] text-gray-405 font-sans">{biz.desc}</span>
                                </div>
                                <div className="text-right text-yellow-500 font-mono text-[9px]">
                                  {biz.woodCost}W {biz.stoneCost}S
                                </div>
                              </button>
                            ))}

                            {/* Cottage construct plot checks */}
                            {((selectedX === 32 || selectedX === 34) && (selectedY === 12 || selectedY === 14)) && (
                              <button
                                onClick={() => constructPioneerCottage(tile)}
                                className="w-full p-2 bg-gradient-to-r from-teal-950/20 to-black hover:from-teal-900/30 text-left text-[10px] rounded border border-[#10b981]/30 flex justify-between items-center cursor-pointer transition-all"
                              >
                                <div>
                                  <span className="font-extrabold text-[#10b981] block">Pioneer Cottage</span>
                                  <span className="text-[8.5px] text-gray-400 font-sans">Compounding 1.5x output factor boost</span>
                                </div>
                                <div className="text-right text-emerald-400 font-mono text-[9px]">
                                  20 PLK 20 BRK
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
                );
              })()}
            </div>

            {/* DIGITAL LABOR MATRIX COMPANIONS (Collapsible) */}
            <div id="apprentices_contracts_panel" className={`bg-zinc-950/80 border-2 border-yellow-500/30 rounded-xl overflow-hidden shadow-xl ${mobileActiveTab === 'auto' ? 'block' : 'hidden md:block'}`}>
              <div 
                className="p-3 bg-zinc-950/80 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer select-none"
                onClick={() => setIsAutomationsCollapsed(!isAutomationsCollapsed)}
              >
                <span className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                  🤖 AUTOMATION MATRIX
                </span>
                <span className="text-yellow-500 text-[9px] md:hidden">{isAutomationsCollapsed ? '▼ EXPAND' : '▲ COLLAPSE'}</span>
              </div>
              <div className={`p-4 space-y-3 transition-all duration-300 ${(isAutomationsCollapsed && mobileActiveTab !== 'auto') ? 'max-h-0 md:max-h-[9999px] opacity-0 md:opacity-100 overflow-hidden' : 'max-h-[9999px] opacity-100'}`}>
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black text-yellow-405 font-mono uppercase block">Apprentice Automation Ledger</span>
                  <span className="text-[8.5px] text-gray-400 block mt-1 leading-normal">
                    Contract specialized automated companions. Each targets nodes, harvests and deposits raw goods to ledger (+3 wood/stone/clay) on independent cycles.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 px-1 text-[9px] sm:text-[10px]">
                  <button
                    onClick={() => hireApprentice('wood')}
                    className="py-1.5 bg-emerald-850 hover:bg-emerald-750 text-white font-extrabold uppercase rounded border border-emerald-500/30 font-mono active:scale-95 transition-all leading-tight text-center"
                  >
                    🪵 Wood AP
                  </button>
                  <button
                    onClick={() => hireApprentice('stone')}
                    className="py-1.5 bg-amber-850 hover:bg-amber-750 text-white font-extrabold uppercase rounded border border-amber-500/30 font-mono active:scale-95 transition-all leading-tight text-center"
                  >
                    ⛏️ Ore AP
                  </button>
                  <button
                    onClick={() => hireApprentice('clay')}
                    className="py-1.5 bg-[#4a2e1b] hover:bg-[#5f3e27] text-white font-extrabold uppercase rounded border border-[#27190d]/30 font-mono active:scale-95 transition-all leading-tight text-center"
                  >
                    🏺 Clay AP
                  </button>
                </div>

                {/* Hired list status */}
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto mt-2">
                  {apprentices.length === 0 ? (
                    <p className="text-[10px] text-gray-500 text-center py-2 italic font-mono">No active contractors found.</p>
                  ) : (
                    apprentices.map((app, appIdx) => (
                      <div key={appIdx} className="p-2 bg-black/60 rounded border border-white/5 flex justify-between items-center text-[9.5px] font-mono leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{app.type === 'wood' ? '🪓' : app.type === 'stone' ? '⛏️' : '🏺'}</span>
                          <div>
                            <span className="text-white block font-black">Apprentice #{appIdx + 1}</span>
                            <span className="text-gray-500 text-[8px] mt-0.5 block">State: {app.state.toUpperCase()}</span>
                          </div>
                        </div>
                        <span className="bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          {app.type.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Guild Upgrades block */}
                <div className="border-t border-yellow-500/20 pt-2.5 mt-2 space-y-2">
                  <span className="text-[10px] text-yellow-400 font-bold block uppercase tracking-wider font-mono">🚀 Apprentice Guild Upgrades</span>
                  <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  {/* SPEED */}
                  <div className="p-2 bg-zinc-950 rounded border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-white font-bold block">🏃 Speed Training</span>
                      <span className="text-gray-500 text-[8px] block mt-0.5">Timer: {4 - apprenticeSpeedLvl}s (Lvl {apprenticeSpeedLvl}/3)</span>
                    </div>
                    {apprenticeSpeedLvl >= 3 ? (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1 py-1 rounded text-center mt-2 font-mono">MAX LEVEL</span>
                    ) : (
                      <button 
                        onClick={() => {
                          const cost = apprenticeSpeedLvl * 250;
                          if (bswx < cost) {
                            addLog(`Fails: Training requires ${cost} BSWX.`);
                            playRetroTone('fail');
                            return;
                          }
                          setBswx(prev => prev - cost);
                          // Must load current value of apprenticeSpeedLvl to prevent stale state issues
                          setApprenticeSpeedLvl(prev => {
                            const next = prev + 1;
                            addLog(`🚀 Apprentice Guild: Upgraded speed to lvl ${next}! Laborers harvest faster.`);
                            return next;
                          });
                          playRetroTone('level', 1.2);
                        }}
                        className="mt-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold rounded text-[8px] uppercase active:scale-95 transition-all text-center leading-none"
                      >
                        UPGRADE: {apprenticeSpeedLvl * 250} B
                      </button>
                    )}
                  </div>

                  {/* OUTPUT */}
                  <div className="p-2 bg-zinc-950 rounded border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-yellow-400 font-bold block">📦 Yield Training</span>
                      <span className="text-gray-500 text-[8px] block mt-0.5">Yield: +{2 + apprenticeOutputLvl} (Lvl {apprenticeOutputLvl}/4)</span>
                    </div>
                    {apprenticeOutputLvl >= 4 ? (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1 py-1 rounded text-center mt-2 font-mono">MAX LEVEL</span>
                    ) : (
                      <button 
                        onClick={() => {
                          const cost = apprenticeOutputLvl * 250;
                          if (bswx < cost) {
                            addLog(`Fails: Training requires ${cost} BSWX.`);
                            playRetroTone('fail');
                            return;
                          }
                          setBswx(prev => prev - cost);
                          // Must load current value of apprenticeOutputLvl to prevent stale state
                          setApprenticeOutputLvl(prev => {
                            const next = prev + 1;
                            addLog(`🚀 Apprentice Guild: Upgraded tools output to lvl ${next}! Laborers deposit +${2 + next} raw wood/stone/clay.`);
                            return next;
                          });
                          playRetroTone('level', 1.2);
                        }}
                        className="mt-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold rounded text-[8px] uppercase active:scale-95 transition-all text-center leading-none"
                      >
                        UPGRADE: {apprenticeOutputLvl * 250} B
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 5. GUEST EXCHANGE / ADVISORS MODAL */}
          <AnimatePresence>
            {activeNPC && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg bg-[#0c0c0f] border-2 border-yellow-500/40 rounded-xl p-6 shadow-2xl relative font-sans text-left text-yellow-500"
                >
                  <button 
                    onClick={() => setActiveNPC(null)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-white font-mono text-xs cursor-pointer bg-transparent border-0"
                  >
                    [CLOSE]
                  </button>

                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-black border border-yellow-500/20 rounded p-1 flex items-center justify-center relative shadow">
                      <RetroCharacter isNPC={true} npcType={activeNPC.npcType} />
                    </div>

                    <div>
                      <span className="text-[8.5px] font-mono bg-yellow-500/10 text-yellow-400 px-2.5 py-0.5 rounded font-black uppercase tracking-widest leading-none block mx-auto">
                        Ancestral Architect
                      </span>
                      <h4 className="text-xl font-bold font-mono text-white mt-1">{activeNPC.name}</h4>
                    </div>

                    <p className="text-xs text-gray-400 italic leading-relaxed px-4 text-center">
                      &ldquo;<TypeWriterText text={activeNPC.bio} />&rdquo;
                    </p>

                    <div className="w-full border-t border-white/5 pt-4 space-y-3">
                      <h5 className="text-[10px] font-bold font-mono text-yellow-400 uppercase tracking-widest leading-none">ACTIVE HISTORIC TASK STAGE</h5>

                      {/* Daily Elder Respect Action */}
                      <div className="p-2.5 bg-zinc-950/85 rounded border border-yellow-500/10 flex justify-between items-center text-xs font-mono">
                        <div className="text-left leading-snug">
                          <span className="text-yellow-400 font-bold block">🙌 Traditional Respects Greeting</span>
                          <span className="text-[8px] text-gray-500 block">Greet elder to study local history.</span>
                        </div>
                        {dialNPCIsAva ? (
                          <button
                            onClick={() => {
                              setPaidRespectsToday(prev => ({ ...prev, [activeNPC.id]: Date.now() }));
                              setLegacyPoints(lp => lp + 5);
                              addLog(`🙌 Respectful Wisdom: You paid respect to ${activeNPC.name}. They share valuable local heritage. (+5 LP gained!)`);
                              playRetroTone('level', 0.5);
                            }}
                            className="py-1 px-2.5 bg-[#450a0a] hover:bg-red-950 border border-yellow-500/30 text-yellow-400 hover:text-white text-[8px] font-bold rounded uppercase active:scale-95 transition-all text-center cursor-pointer"
                          >
                            Greet Elder (+5 LP)
                          </button>
                        ) : (
                          <span className="text-[8px] text-gray-550 italic uppercase font-bold px-2 py-0.5 bg-black/40 rounded border border-white/5">
                            Greeted ({dialNPCCooldownSec}s)
                          </span>
                        )}
                      </div>

                      {/* Gurley stages Dialogue details */}
                      {activeNPC.id === 'gurley' && (
                        <div className="p-3 bg-black/60 rounded border border-white/5 space-y-3 text-xs leading-normal font-sans">
                          {questStageGurley === 1 && (
                            <div>
                              <p className="text-gray-200">Stage 1: Foundation Challenges</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Welcome startup entrepreneur. Build a Greenwood Grocery on our plots to establish solid physical food cooperative arrays." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Status: Grocery exists?</span>
                                {mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'grocery')) ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 1,
                                        quiz: QUEST_QUIZZES.gurley[1]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Accept Quiz Verify
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Erect Greenwood Grocery first</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageGurley === 2 && (
                            <div>
                              <p className="text-gray-200">Stage 2: Community Development Scaling</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Our physical marketplace stands proud. Now, we must cultivate our community's intellectual infrastructure—gather the refined capital to erect a localized Bookstore or Technical Innovation Hub (have Greenwood Grocery L2+ and 200 BSWX)." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Status: Grocery L2 & 200 BSWX?</span>
                                {mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'grocery' && (t.level || 1) >= 2)) && bswx >= 200 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 2,
                                        quiz: QUEST_QUIZZES.gurley[2]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Accept Quiz Verify
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Incomplete constraints</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageGurley === 3 && (
                            <div>
                              <p className="text-gray-200">Stage 3: Williams Sugar Bowl Integration</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Our cooperative physical grid is thriving. Now we must raise communal happiness and hospitality by building Williams Sugar Bowl (costs 75 LP, 80 wood, 50 stone) and holding 150 Reputation." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Status: Sugar Bowl built & 150 REP?</span>
                                {mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'sugarbowl')) && reputation >= 150 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 3,
                                        quiz: QUEST_QUIZZES.gurley[3]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Accept Quiz Verify
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Erect Sugar Bowl and gain REP</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageGurley >= 4 && (
                            <div className="text-center p-3">
                              <span className="text-green-400 font-bold block">★ GURLEY LINE ARCHITECT MASTERY ARCHIVED ★</span>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="O.W. Gurley honors your cooperative. Greenwood is fully sovereign under Ma'at order!" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sarah Rector stages */}
                      {activeNPC.id === 'rector' && (
                        <div className="p-3 bg-black/60 rounded border border-white/5 space-y-3 text-xs leading-normal font-sans">
                          {questStageRector === 1 && (
                            <div>
                              <p className="text-gray-200">Stage 1: Raw Materials Allotments</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="My oil wells are pumping beautiful liquified capital. Save 50 Wood and 50 Stone raw materials to anchor our initial infrastructure." />
                              </div>
                              <div className="flex justify-between items-center mt-3 animate-pulse">
                                <span className="text-[10px] font-mono text-amber-500">Materials targets? ({wood}/50W, {stone}/50S)</span>
                                {wood >= 50 && stone >= 50 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 1,
                                        quiz: QUEST_QUIZZES.rector[1]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Unlock Quiz
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Awaiting materials</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageRector === 2 && (
                            <div>
                              <p className="text-gray-200">Stage 2: Active Labor Force recruitment</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="We must scale physical throughput! Contract 1 Digital Apprentice companion and accumulate 100 Reputation to lead the workforce." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Requirements reached?</span>
                                {apprentices.length >= 1 && reputation >= 100 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 2,
                                        quiz: QUEST_QUIZZES.rector[2]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Unlock Quiz
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Awaiting contract & rep</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageRector === 3 && (
                            <div>
                              <p className="text-gray-200">Stage 3: Advanced Ceramics Procurement</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="The chemical wealth pumps clean. Now we must extract native river sills! Harvest 30 raw Silt Clay near the riverbanks and process them into 4 fine Heated Ceramics at the refinery." />
                              </div>
                              <div className="flex justify-between items-center mt-3 animate-pulse">
                                <span className="text-[10px] font-mono text-amber-500">Requirements ({clay}/30 Clay, {ceramics}/4 Ceramics)?</span>
                                {clay >= 30 && ceramics >= 4 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 3,
                                        quiz: QUEST_QUIZZES.rector[3]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Unlock Quiz
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Awaiting Clay/Ceramics</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageRector >= 4 && (
                            <div className="text-center p-3 animate-pulse">
                              <span className="text-[#10b981] font-black block">★ SARAH RECTOR LINE COMPLETE ★</span>
                              <div className="text-[10.5px] text-gray-400 mt-1">
                                <TypeWriterText text="The oil continues to sustain our legacy. Capital must remain within the community banks under our cooperative trust." />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* J.B. Stradford Stages */}
                      {activeNPC.id === 'stradford' && (
                        <div className="p-3 bg-black/60 rounded border border-white/5 space-y-3 text-xs leading-normal font-sans">
                          {questStageStradford === 1 && (
                            <div>
                              <p className="text-gray-200">Stage 1: Symmetrical Foundations Layout</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Solid real estate is the unbreakable floor under African American liberty. Put your feet onto our plots: secure at least 2 built businesses." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Sovereign Plots count: ({mapGrid.flat().filter(t => t.type === 'built_business').length}/2)</span>
                                {mapGrid.flat().filter(t => t.type === 'built_business').length >= 2 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 1,
                                        quiz: QUEST_QUIZZES.stradford[1]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Solve Quiz
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Construct more plots</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageStradford === 2 && (
                            <div>
                              <p className="text-gray-200">Stage 2: Refined Timber and Clay bricks</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Raw inputs are for simple laborers; civilized barons process goods into refined structural units. Harvest wood/stone and process them into 20x Polished Planks and 20x Reinforced Bricks." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Logs ({polishedPlank}/20 Plks, {reinforcedBrick}/20 Brks)</span>
                                {polishedPlank >= 20 && reinforcedBrick >= 20 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 2,
                                        quiz: QUEST_QUIZZES.stradford[2]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Solve Quiz
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Process raw materials</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageStradford === 3 && (
                            <div>
                              <p className="text-gray-200">Stage 3: High Legal Status & Wealth Sovereignty</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Our physical properties are unmatched. Now we must anchor financial autonomy where capital is treated with elite, law-grade legal status—reach 150 legacy points (LP) and hold 250 Reputation." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Targets ({legacyPoints}/150 LP, {reputation}/250 REP)?</span>
                                {legacyPoints >= 150 && reputation >= 250 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 3,
                                        quiz: QUEST_QUIZZES.stradford[3]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Solve Quiz
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Reach 150 LP & 250 REP</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageStradford >= 4 && (
                            <div className="text-center p-3">
                              <span className="text-yellow-405 font-bold block">★ STRADFORD LEGACY EMBARKED ★</span>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="The luxury Stradford stands tall over Oklahoma. Greenwood is officially magnificent and law-abiding!" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pharoah Gerumba Stages */}
                      {activeNPC.id === 'gerumba' && (
                        <div className="p-3 bg-black/60 rounded border border-white/5 space-y-3 text-xs leading-normal font-sans">
                          {questStageGerumba === 1 && (
                            <div>
                              <p className="text-gray-200">Stage 1: Ancestral Reputation Alignment</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Asé! Wealth is hollow without moral status and public respect. Build your reputation up to 50 alignment slots so our cooperative trust is recognized." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Reputation: ({reputation}/50)</span>
                                {reputation >= 50 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 1,
                                        quiz: QUEST_QUIZZES.gerumba[1]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Recite Oracle Truth
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Gain more reputation</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageGerumba === 2 && (
                            <div>
                              <p className="text-gray-200">Stage 2: Sacred Shelters Assembly</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Asé! To sustain a sacred cooperative node, we require shared housing for disciples or direct metal reserves. Build at least 1 Apprentice Cottage or accumulate 500 BSWX." />
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-mono text-amber-500">Cottages ({cottagesCount}/1) or BSWX ({bswx}/500)</span>
                                {cottagesCount >= 1 || bswx >= 500 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 2,
                                        quiz: QUEST_QUIZZES.gerumba[2]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Recite Oracle Truth
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Erect Cottage or hold 500 BSWX</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageGerumba === 3 && (
                            <div>
                              <p className="text-gray-200">Stage 3: Pilgrimage to Historic Slipped Groundings</p>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Asé! True Moorish wisdom is not in raw metal, but in learning from our historical groundings. Explore and inspect all 4 historical sites on the coordinate grid and accumulate 120 Legacy Points." />
                              </div>
                              <div className="flex justify-between items-center mt-3 animate-pulse">
                                <span className="text-[10px] font-mono text-[#facc15]">Discovered: ({discoveredLandmarks.length}/4 Sites, {legacyPoints}/120 LP)</span>
                                {discoveredLandmarks.length >= 4 && legacyPoints >= 120 ? (
                                  <button
                                    onClick={() => {
                                      setActiveQuiz({
                                        nNPC: activeNPC,
                                        stage: 3,
                                        quiz: QUEST_QUIZZES.gerumba[3]
                                      });
                                      setQuizSelectedOption(null);
                                      setQuizFeedback(null);
                                      setQuizComplete(false);
                                    }}
                                    className="py-1 px-3 bg-yellow-500 text-black text-[9px] font-black uppercase rounded"
                                  >
                                    Recite Oracle Truth
                                  </button>
                                ) : (
                                  <span className="text-gray-550 italic text-[10px]">Inspect all 4 Sites & reach 120 LP</span>
                                )}
                              </div>
                            </div>
                          )}

                          {questStageGerumba >= 4 && (
                            <div className="text-center p-3 animate-pulse">
                              <span className="text-[#facc15] font-black block">★ PHAROAH GERUMBA ORACLE ALIGNED ★</span>
                              <div className="text-[10px] text-gray-400 mt-1">
                                <TypeWriterText text="Asé! You have awakened the ancient Moorish economic keys. The sacred 'Legacy Cultural Hall' is now unsealed for construction on plot grids!" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* LANDMARK INSPECTION DETAIL MODAL */}
          <AnimatePresence>
            {activeLandmarkDetail && (
              <div className="fixed inset-0 z-55 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="w-full max-w-sm bg-[#0b0b0d] border-2 border-yellow-500/50 rounded-2xl p-6 space-y-4 font-sans text-left text-yellow-500 shadow-[0_0_30px_rgba(202,138,4,0.35)]"
                >
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                      {landmarkIsRestored ? '🌟 Landmark Preserved & Restored' : '🏛 Historic Landmark Inspected'}
                    </span>
                    <button 
                      onClick={() => setActiveLandmarkDetail(null)}
                      className="text-gray-500 hover:text-white font-mono text-xs bg-transparent border-0 cursor-pointer"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-mono font-black text-white">{activeLandmarkDetail.name}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans bg-black/40 p-3 rounded border border-white/5 italic">
                      &ldquo;{activeLandmarkDetail.desc}&rdquo;
                    </p>
                  </div>

                  {landmarkIsRestored ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5 font-sans">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold block uppercase tracking-wider">🌟 PRESERVATION STATUS: MAX LEVEL RESTORED</span>
                      <p className="text-[11px] text-gray-300 leading-normal">
                        This sacred site is fully restored. Rebuilt with premium materials, local labor, and cooperative community funds to honor the legacy of Tulsa’s Black Wall Street pioneers.
                      </p>
                    </div>
                  ) : showRestorationPuzzle ? (
                    <div className="bg-zinc-950 border-2 border-yellow-500/60 p-4 rounded-xl space-y-3 font-mono">
                      <span className="text-[10px] text-yellow-405 font-bold block uppercase tracking-widest animate-pulse">🏛️ BLUEPRINT RECONSTRUCTION SLIDER</span>
                      <p className="text-[9px] text-gray-400 leading-normal">
                        Rotate the segmented blueprint layers. Align them properly (all offset shifts to 0) to complete the historic preservation structure!
                      </p>
                      
                      <div className="space-y-2 py-1 bg-black/60 rounded border border-white/5 p-2 overflow-hidden flex flex-col items-center">
                        {/* 3 stacked horizontal blueprint blocks */}
                        {[0, 1, 2].map((idx) => {
                          const offsetVal = puzzleOffsets[idx];
                          // Calculate horizontal shifting margin/padding for visual offset
                          const shiftPercent = offsetVal * 20 - 20; // -20%, 0%, 20% visual shift
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                setPuzzleOffsets(prev => {
                                  const copy = [...prev];
                                  copy[idx] = (copy[idx] + 1) % 3; // 0, 1, 2 options
                                  playRetroTone('strike', 0.8);
                                  return copy;
                                });
                              }}
                              className="w-full h-8 bg-blue-950/80 border border-blue-400/50 rounded flex items-center justify-center relative cursor-pointer hover:bg-blue-900/60 transition-all select-none group overflow-hidden"
                            >
                              <div 
                                className="absolute inset-0 bg-blue-500/10 flex items-center justify-center font-black text-[9px] tracking-widest text-blue-300 transition-all duration-200"
                                style={{ transform: `translateX(${shiftPercent}%)` }}
                              >
                                <span>[ LAYER-{idx + 1} BLUEPRINT {offsetVal === 0 ? "★ ALIGNED ★" : `[SHIFTED: +${offsetVal * 120}px]`} ]</span>
                              </div>
                              {/* Selection overlay indicator */}
                              <div className="absolute right-2 text-[8px] text-blue-400 group-hover:text-white">
                                ↻ ROTATE
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 text-[10px]">
                        <button
                          onClick={() => {
                            setShowRestorationPuzzle(false);
                            playRetroTone('fail', 0.6);
                          }}
                          className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-gray-400 rounded uppercase border border-white/5 transition-all cursor-pointer font-bold"
                        >
                          ABORT
                        </button>
                        <button
                          onClick={verifyPuzzleRestoration}
                          className="flex-1 py-1.5 bg-yellow-500 hover:bg-yellow-405 text-black rounded uppercase font-black transition-all cursor-pointer"
                        >
                          VERIFY BLUEPRINTS
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900 border border-yellow-500/20 p-3 rounded-lg space-y-2">
                      <span className="text-[10px] text-yellow-400 font-mono font-bold block uppercase">🛠 Landmark Renaissance Initiative</span>
                      <p className="text-[11px] text-gray-400 leading-tight">
                        Restore and preserve this historic landmark to permanent glory. Restored sites earn high prestige.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-1">
                        <div className="flex justify-between p-1 bg-black/50 rounded border border-white/5">
                          <span className="text-gray-500">Wood:</span>
                          <span className={wood >= 25 ? 'text-emerald-400' : 'text-red-400'}>{wood}/25</span>
                        </div>
                        <div className="flex justify-between p-1 bg-black/50 rounded border border-white/5">
                          <span className="text-gray-500">Stone:</span>
                          <span className={stone >= 25 ? 'text-emerald-400' : 'text-red-400'}>{stone}/25</span>
                        </div>
                        <div className="flex justify-between p-1 bg-black/50 rounded border border-white/5">
                          <span className="text-gray-500">Clay:</span>
                          <span className={clay >= 25 ? 'text-emerald-400' : 'text-red-400'}>{clay}/25</span>
                        </div>
                        <div className="flex justify-between p-1 bg-black/50 rounded border border-white/5">
                          <span className="text-gray-500">BSWX:</span>
                          <span className={bswx >= 250 ? 'text-emerald-400' : 'text-red-400'}>{Math.round(bswx)}/250</span>
                        </div>
                      </div>
                      <button
                        onClick={handleRestoreLandmark}
                        disabled={!landmarkCanRestore}
                        className={`w-full py-2 font-mono font-bold text-xs uppercase rounded cursor-pointer transition-all ${
                          landmarkCanRestore 
                            ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/55'
                        }`}
                      >
                        {landmarkCanRestore ? '🌟 Build & Restore Landmark' : '❌ Needs More Materials'}
                      </button>
                    </div>
                  )}

                  <div className="text-center pt-1">
                    <button
                      onClick={() => {
                        setActiveLandmarkDetail(null);
                        setShowRestorationPuzzle(false);
                      }}
                      className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-750 text-gray-300 font-mono text-xs uppercase rounded active:scale-95 transition-all cursor-pointer"
                    >
                      Done Viewing Plaque
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* CO-OP LEADERBOARD MODAL */}
          <AnimatePresence>
            {isLeaderboardOpen && (
              <div id="coop_leaderboard_modal" className="fixed inset-0 z-55 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-md bg-[#0b0b0d] border-2 border-yellow-500/50 rounded-2xl p-6 space-y-4 font-mono text-left text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                >
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      🏆 Greenwood Trust Co-op Ledger
                    </span>
                    <button 
                      onClick={() => setIsLeaderboardOpen(false)}
                      className="text-gray-500 hover:text-white font-mono text-xs bg-transparent border-0 cursor-pointer"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  {leaderboardLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 font-mono">
                      <div className="relative">
                        <RefreshCw className="animate-spin text-yellow-500 w-10 h-10" />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black animate-pulse">Co-op</span>
                      </div>
                      
                      <div className="w-full bg-black/70 border border-yellow-500/20 p-3 rounded-lg text-[8px] space-y-1.5 font-mono max-h-[140px] overflow-y-auto">
                        <span className="text-emerald-400 block uppercase font-medium select-none text-[8.5px] mb-1 font-black">🖧 SECURE TRANSCEIVER CO-OP TERMINAL:</span>
                        {leaderboardLogs.map((log, lIdx) => (
                          <div key={lIdx} className="text-gray-300 leading-normal flex items-start gap-1">
                            <span className="text-yellow-500 font-bold">❯</span>
                            <span>{log}</span>
                          </div>
                        ))}
                        <div className="text-yellow-400 animate-pulse mt-1">⏳ RETRIEVING GREENWOOD PROGRESS METRICS... <span className="inline-block w-1.5 h-3 bg-yellow-400 align-middle"></span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1 text-center font-sans">
                        <h4 className="text-md font-mono font-black text-white uppercase tracking-tight">Top Regional Co-op Pioneers</h4>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          Syncing live with regional Greenwood Ledger networks. Gain more Legacy Points to rise!
                        </p>
                      </div>

                      {/* Leaderboard Entries List */}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
                        {(() => {
                          const basePioneers = [
                            { id: 'gurley', name: "O.W. Gurley", title: "District Founder", score: 250, badge: "🥇 Master Builder" },
                            { id: 'stradford', name: "J.B. Stradford", title: "Hotel Magnate", score: 200, badge: "🥈 Luxury Guesthouse" },
                            { id: 'loula', name: "Loula Williams", title: "Dreamland Cinema", score: 175, badge: "🥉 Cultural Queen" },
                            { id: 'rector', name: "Sarah Rector", title: "Wealth Sovereign", score: 150, badge: "🏅 Allotment Empress" },
                            { id: 'smitherman', name: "A.J. Smitherman", title: "Daily Star Editor", score: 125, badge: "🏅 Press Chancellor" }
                          ];
                          
                          const playerRow = { 
                            id: 'player', 
                            name: `${charName}`, 
                            title: `Your District (${charArchetype === 'merchant' ? 'merchant' : charArchetype === 'organizer' ? 'organizer' : 'grit'?.toUpperCase()})`, 
                            score: legacyPoints, 
                            badge: "⭐ Active Player" 
                          };

                          const combined = [...basePioneers, playerRow].sort((a, b) => b.score - a.score);
                          
                          return combined.map((item, index) => {
                            const isPlayer = item.id === 'player';
                            const rank = index + 1;
                            
                            return (
                              <div 
                                key={item.id} 
                                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                  isPlayer 
                                    ? 'bg-yellow-500/10 border-yellow-500/80 shadow-[0_0_12px_rgba(234,179,8,0.25)]' 
                                    : 'bg-black/45 border-zinc-800/80 hover:border-zinc-700/80'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {/* Rank Badge */}
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono ${
                                    rank === 1 ? 'bg-yellow-500 text-black' :
                                    rank === 2 ? 'bg-slate-300 text-black' :
                                    rank === 3 ? 'bg-amber-600 text-white' :
                                    isPlayer ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-gray-400'
                                  }`}>
                                    {rank}
                                  </div>
                                  
                                  <div className="font-mono text-left">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] font-black ${isPlayer ? 'text-yellow-400 font-extrabold' : 'text-white'}`}>
                                        {item.name}
                                      </span>
                                      {isPlayer && (
                                        <span className="text-[7px] bg-yellow-500 text-black font-black uppercase px-1 rounded scale-90">YOU</span>
                                      )}
                                    </div>
                                    <span className="text-[8px] text-gray-500 block font-normal">{item.title}</span>
                                  </div>
                                </div>

                                <div className="text-right font-mono">
                                  <span className={`text-[10.5px] font-black block ${isPlayer ? 'text-yellow-400' : 'text-amber-400'}`}>
                                    {item.score} LP
                                  </span>
                                  <span className="text-[7.5px] text-gray-500 block uppercase tracking-tighter">{item.badge}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      <div className="p-3 bg-zinc-950/60 rounded border border-white/5 space-y-1">
                        <span className="text-[8.5px] text-yellow-400 font-bold uppercase tracking-wide block font-mono">🤝 Cooperative Ledger Logic:</span>
                        <p className="text-[9px] text-gray-400 leading-normal font-sans">
                          Individual excellence feeds collective wealth. Earn more <strong>Legacy Points (LP)</strong> by restoring landmarks and completing structural advisor quests to surpass historical giants and lead the ledger!
                        </p>
                      </div>

                      <button
                        onClick={() => setIsLeaderboardOpen(false)}
                        className="w-full py-2 bg-zinc-805 hover:bg-zinc-750 text-gray-300 hover:text-white font-mono text-xs uppercase rounded active:scale-95 transition-all cursor-pointer border border-[#ffffff15]"
                      >
                        Return to Hub Menu
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* QUIZ FORM MODAL */}
          <AnimatePresence>
            {activeQuiz && (
              <div className="fixed inset-0 z-55 bg-black/95 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="w-full max-w-lg bg-[#08080a] border-2 border-yellow-500/50 rounded-2xl p-6 space-y-4 font-mono shadow-[0_0_35px_#ca8a04]"
                >
                  <div className="flex justify-between items-center border-b border-white/15 pb-2">
                    <span className="text-xs font-black text-amber-500">HISTORICAL KNOWLEDGE TRUTH CERTIFICATE</span>
                    <button 
                      onClick={() => setActiveQuiz(null)}
                      className="text-gray-500 text-xs hover:text-white"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  <p className="text-sm font-bold text-white">
                    <TypeWriterText text={activeQuiz.quiz.question} />
                  </p>

                  <div className="space-y-2 pt-2">
                    {activeQuiz.quiz.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => {
                          if (!quizComplete) handleConfirmAnswer(oIdx);
                        }}
                        className={`w-full p-3 text-left text-xs rounded border transition-all truncate flex justify-between items-center ${
                          quizSelectedOption === oIdx
                            ? (oIdx === activeQuiz.quiz.correctIndex ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-red-950/40 border-red-500 text-red-400')
                            : 'bg-[#121215] border-white/5 text-gray-300 hover:border-yellow-500/30'
                        }`}
                      >
                        <span>{String.fromCharCode(65 + oIdx)}) {opt}</span>
                        {quizSelectedOption === oIdx && oIdx === activeQuiz.quiz.correctIndex && <Check size={12} />}
                      </button>
                    ))}
                  </div>

                  {quizFeedback && (
                    <div className="p-3 bg-zinc-900 border border-white/10 rounded text-[10.5px] text-gray-400 leading-relaxed">
                      <TypeWriterText text={quizFeedback} />
                    </div>
                  )}

                  {quizComplete && (
                    <button
                      onClick={() => {
                        setActiveQuiz(null);
                        setActiveNPC(null);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-extrabold text-xs uppercase rounded"
                    >
                      Syncretize Cultural Essence ➔
                    </button>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 6. CONSOLIDATED SYSTEM PAUSE BANNER (COLLAPSIBLE SIDE BAG DRAWER) */}
          <AnimatePresence>
            {isGamePaused && (
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] pointer-events-none md:bg-transparent md:backdrop-blur-none">
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-16 right-0 bottom-0 z-45 bg-[#09090c] border-l border-yellow-500/20 w-full sm:w-[420px] h-[calc(100vh-64px)] p-4 flex flex-col shadow-2xl text-yellow-500 font-mono pointer-events-auto border-t-0"
                >
                  <div className="flex justify-between items-center border-b border-amber-600/30 pb-3 mb-4 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">🎒</span>
                      <div className="text-left font-mono leading-none">
                        <h2 className="text-sm sm:text-lg font-black text-amber-500 uppercase tracking-widest leading-none">PIONEER SYSTEM BAG</h2>
                        <p className="text-[9px] text-gray-450 mt-1 uppercase font-sans tracking-wide">Refinement pipelines, achievements, system configurations</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsGamePaused(false)}
                      className="px-3 py-1.5 bg-yellow-500 text-black font-black text-[10px] rounded border border-yellow-300 transition-all uppercase"
                    >
                      [CLOSE ✕]
                    </button>
                  </div>

                  {/* Horizonal Tab Navigation strip */}
                  <div className="flex border-b border-zinc-800 pb-1.5 mb-4 overflow-x-auto gap-1 select-none scrollbar-none">
                    {[
                      { id: 'academy', label: '🎓 ACADEMY' },
                      { id: 'inventory', label: '📦 INVENTORY' },
                      { id: 'crafting', label: '⚙️ CRAFTING' },
                      { id: 'exchange', label: '📈 EXCHANGE' },
                      { id: 'legacy', label: '👑 LEGACY' },
                      { id: 'favors', label: '🤝 CO-OP BOARD' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setPauseMenuTab(tab.id as any);
                          playRetroTone('strike', 0.5);
                        }}
                        className={`px-3.5 py-1 text-[9px] sm:text-[10px] font-black uppercase border-t-2 border-x-2 rounded-t-lg transition-all whitespace-nowrap whitespace-nowrap text-center ${
                          pauseMenuTab === tab.id
                            ? 'bg-amber-500 text-black border-amber-500'
                            : 'bg-black/40 border-stone-850 text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Main Tab Box scrolling contents */}
                  <div className="flex-1 overflow-y-auto pr-1 text-left space-y-4">
                    
                    {/* MODULE 1: ACADEMY INSTRUCTION CHECKLIST */}
                    {pauseMenuTab === 'academy' && (
                      <div className="space-y-4 font-sans text-gray-300">
                        <div className="p-3 bg-yellow-500/5 rounded border border-yellow-500/20 space-y-3">
                          <h4 className="text-xs font-bold text-amber-500 uppercase font-mono tracking-wider flex justify-between items-center">
                            <span>🎓 Greenwood Builder Academy</span>
                          </h4>
                          <p className="text-[11px] text-gray-400 font-sans">
                            A quick checklist to help you grow your town step by step:
                          </p>
                          <ul className="space-y-2.5 text-[11px] leading-relaxed">
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">✓</span>
                              <span><strong>Meet Elders:</strong> Move near O.W. Gurley in the town center to say hello!</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">➔</span>
                              <span><strong>Harvesting:</strong> Walk directly next to Pine Trees or Stone Quarries, then press <strong>E</strong> or <strong>Space</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">➔</span>
                              <span><strong>Crafting:</strong> Use Wood & Stone inside the Crafting tab to make Planks and Bricks.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">➔</span>
                              <span><strong>Homes & Storefronts:</strong> Hire an apprentice and build a cosy cottage for them to stay in!</span>
                            </li>
                          </ul>

                          <div className="pt-2 border-t border-yellow-500/10 flex flex-col items-stretch">
                            <button
                              onClick={() => {
                                setIsGamePaused(false);
                                setShowTutorial(true);
                                setTutorialStep(0);
                              }}
                              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase font-mono tracking-wider rounded text-center transition-all shadow-[0_4px_10px_rgba(234,179,8,0.15)] active:scale-95"
                            >
                              ▶ Start Tour Walkthrough
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODULE 2: STATS AND INVENTORY */}
                    {pauseMenuTab === 'inventory' && (
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-3 bg-black/60 rounded border border-white/5 space-y-3">
                          <span className="text-[10px] text-amber-400 font-bold block">COMMODITY MATERIALS</span>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>🌲 Raw Wood Logs:</span><span className="text-yellow-500">{wood}</span></div>
                            <div className="flex justify-between"><span>⛰️ Raw Ore Limestone:</span><span className="text-yellow-500">{stone}</span></div>
                            <div className="flex justify-between"><span>💧 Riverbed Silt Clay:</span><span className="text-yellow-500">{clay}</span></div>
                            <div className="flex justify-between text-yellow-400"><span>🏺 Fine Ceramics:</span><span className="text-yellow-400 font-black">{ceramics}</span></div>
                            <div className="flex justify-between"><span>🪵 Polished Planks:</span><span className="text-yellow-500 font-black">{polishedPlank}</span></div>
                            <div className="flex justify-between"><span>🧱 Reinforced Bricks:</span><span className="text-yellow-500 font-black">{reinforcedBrick}</span></div>
                          </div>
                        </div>

                        <div className="p-3 bg-black/60 rounded border border-white/5 space-y-3">
                          <span className="text-[10px] text-amber-400 font-bold block">PIONEER SYSTEM LOGISTICS</span>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>District Houses:</span><span className="text-white">{cottagesCount}</span></div>
                            <div className="flex justify-between"><span>Digital AI Companions:</span><span className="text-white">{apprentices.length}</span></div>
                            <div className="flex justify-between"><span>Specializations:</span><span className="text-white">Active</span></div>
                          </div>
                        </div>

                        <div className="col-span-2 p-3 bg-zinc-950/70 rounded border border-yellow-500/10 space-y-2.5">
                          <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-wider font-mono flex items-center gap-1">👤 Pioneer Heritage ID Profile</span>
                          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono leading-relaxed text-gray-400">
                            <div className="p-2 bg-black/40 rounded border border-zinc-800">
                              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">Archetype Class:</span>
                              <strong className="text-yellow-400 text-[10px] uppercase font-bold">
                                {charArchetype === 'merchant' && 'Sovereign Merchant 💼'}
                                {charArchetype === 'organizer' && 'Cooperative Organizer 🤝'}
                                {charArchetype === 'grit' && 'Grit Pioneer ⚡'}
                              </strong>
                            </div>
                            <div className="p-2 bg-black/40 rounded border border-zinc-800">
                              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">Household Origin:</span>
                              <strong className="text-emerald-400 text-[10px] uppercase font-bold">
                                {charOrigin === 'homestead' && 'Homesteaders 🪵'}
                                {charOrigin === 'academy' && 'Business League 🪙'}
                                {charOrigin === 'stradford' && 'Stradford Arts 🎭'}
                              </strong>
                            </div>
                            <div className="p-2 bg-black/40 rounded border border-zinc-800">
                              <span className="text-[8px] text-zinc-500 block uppercase tracking-wider">Kept Kept Keepsake Heirloom:</span>
                              <strong className="text-pink-400 text-[10px] uppercase font-bold">
                                {charHeirloom === 'none' && 'Modest Keepsake'}
                                {charHeirloom === 'brass_level' && 'Brass Level 📐'}
                                {charHeirloom === 'thermos' && 'Insulated Thermos ☕'}
                                {charHeirloom === 'heritage_ledger' && 'Sovereign Ledger 📓'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODULE 3: CRAFTING (CAFE + REFINERY SIDE-BY-SIDE) */}
                    {pauseMenuTab === 'crafting' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Provision Cuisine Cafe */}
                        <div className="p-3 bg-gradient-to-br from-emerald-950/20 to-black rounded-lg border border-emerald-500/20 space-y-3">
                          <span className="text-[11px] font-black text-emerald-400 block font-mono">🍵 Cafe Provisions Stove</span>
                          <p className="text-[10px] text-gray-400 leading-normal">Consume food baked to recover vital operational physical stamina instantly.</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-none pt-1">
                            <div className="p-2.5 bg-black/80 rounded border border-white/5 flex flex-col justify-between h-20">
                              <span>🥧 Potato Pie</span>
                              <span className="text-yellow-500 leading-none mt-1">Cost: 10 LP</span>
                              <button onClick={() => handleEatFood('pie')} className="mt-2 text-black bg-yellow-500 hover:bg-yellow-400 text-[8.5px] font-black rounded py-1 cursor-pointer">EAT (+50 Stam)</button>
                            </div>
                            <div className="p-2.5 bg-black/80 rounded border border-white/5 flex flex-col justify-between h-20">
                              <span>🍵 Ginger Tea</span>
                              <span className="text-yellow-500 leading-none mt-1">Cost: 4 Wood</span>
                              <button onClick={() => handleEatFood('tea')} className="mt-2 text-black bg-yellow-500 hover:bg-yellow-400 text-[8.5px] font-black rounded py-1 cursor-pointer">DRINK (+25 Stam)</button>
                            </div>
                          </div>
                        </div>

                        {/* Industrial Refinery pipelines */}
                        <div className="p-3 bg-gradient-to-br from-yellow-950/20 to-black rounded-lg border border-yellow-500/20 space-y-3">
                          <span className="text-[11px] font-black text-amber-500 block font-mono">⚙️ Industrial Refinery pipeline</span>
                          <p className="text-[10px] text-gray-400 leading-normal">Refine raw structural ores into high-grade planks, bricks, and ceramics.</p>

                          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono leading-none pt-1">
                            <div className="p-2.5 bg-black/80 rounded border border-white/5 flex flex-col justify-between h-20">
                              <span>🪵 Saws Plank</span>
                              <span className="text-gray-500 leading-none mt-1 text-[8px]">10 Wood</span>
                              <button onClick={() => handleProcessRaw('wood')} className="mt-2 text-black bg-emerald-600 hover:bg-emerald-500 text-[8.5px] text-white font-black rounded py-1">PROCESS +1</button>
                            </div>
                            <div className="p-2.5 bg-black/80 rounded border border-white/5 flex flex-col justify-between h-20">
                              <span>🧱 Reinforced Brick</span>
                              <span className="text-gray-500 leading-none mt-1 text-[8px]">10 Stone</span>
                              <button onClick={() => handleProcessRaw('stone')} className="mt-2 text-black bg-emerald-600 hover:bg-emerald-500 text-[8.5px] text-white font-black rounded py-1">PROCESS +1</button>
                            </div>
                            <div className="p-2.5 bg-black/80 rounded border border-white/5 flex flex-col justify-between h-20 border-yellow-500/20">
                              <span className="text-yellow-405">🏺 Fine Ceramics</span>
                              <span className="text-gray-500 leading-none mt-1 text-[8px]">10 Clay</span>
                              <button onClick={() => handleProcessRaw('clay')} className="mt-2 text-black bg-amber-600 hover:bg-amber-500 text-[8.5px] text-white font-black rounded py-1">PROCESS +1</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODULE 4: CONTRACT VALUES AND EXCHANGE TICKER */}
                    {pauseMenuTab === 'exchange' && (
                      <div className="p-3.5 bg-black/80 rounded border border-white/5 space-y-3 text-xs leading-normal">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <div>
                            <span className="text-xs font-black text-amber-500 block uppercase tracking-wide font-mono">📈 COMMERCE EXCHANGE DESK</span>
                            <span className="text-[8.5px] text-gray-400 font-sans block mt-0.5">Weather-based spot pricing index & resource liquidation terminal</span>
                          </div>
                          <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                            Live Spot
                          </span>
                        </div>

                        {/* Market Overview & Hints */}
                        <div className="p-2.5 bg-[#09090c] rounded border border-white/5 text-[9px] text-gray-300 leading-normal font-sans flex items-start gap-2">
                          <span className="text-amber-500 font-mono text-xs">🛈</span>
                          <p>
                            Greenwood indexes fluctuate deterministically keying off the weather. 
                            {weather === 'sunny' && <span className="text-amber-400"> Clear sunny skies ease wood cutting but harden silt clays, driving clay mining value up (+30%)!</span>}
                            {weather === 'rainy' && <span className="text-sky-400"> Rainy damp conditions float silt deposits heavily but raise quarry mining risks, driving rock ore value up!</span>}
                            {weather === 'foggy' && <span className="text-indigo-300"> Dense fog slows shipping lines, increasing all spot buy prices by +15% due to local supply limits.</span>}
                            {weather === 'sunset_glow' && <span className="text-rose-450"> Sunset Golden Hour increases local building demand, spiking refined asset sell offers by +20%!</span>}
                            <span className="text-gray-400 block mt-1">Trading spread: 25% purchase premium applies. Liquidations process instantly to your BSWX balance.</span>
                          </p>
                        </div>

                        {/* Trading Terminal Entries */}
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
                          {[
                            { id: 'wood', label: '🌲 Wood Logs', qty: wood, spot: getDynamicMarketPrices().wood },
                            { id: 'stone', label: '⛰️ Ore Stone', qty: stone, spot: getDynamicMarketPrices().stone },
                            { id: 'clay', label: '🏺 Silt Clay', qty: clay, spot: getDynamicMarketPrices().clay },
                            { id: 'polishedPlank', label: '🪵 Polished Planks', qty: polishedPlank, spot: getDynamicMarketPrices().polishedPlank },
                            { id: 'reinforcedBrick', label: '🧱 Reinforced Bricks', qty: reinforcedBrick, spot: getDynamicMarketPrices().reinforcedBrick },
                            { id: 'ceramics', label: '🏺 Fine Ceramics', qty: ceramics, spot: getDynamicMarketPrices().ceramics },
                          ].map(item => {
                            const buyPrice = Math.round(item.spot * 1.25 * 10) / 10;
                            const sellPrice = Math.round(item.spot * 0.95 * 10) / 10;
                            return (
                              <div key={item.id} className="p-2.5 bg-zinc-950 border border-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-[10px]">
                                <div className="flex items-center gap-4 flex-1">
                                  {/* Sparkline trend representation */}
                                  {(() => {
                                    const arr = priceHistory[item.id] || [item.spot];
                                    const minVal = Math.min(...arr);
                                    const maxVal = Math.max(...arr);
                                    const range = maxVal - minVal;
                                    const pointsString = arr.map((val, idx) => {
                                      const xCoord = arr.length > 1 ? (idx / (arr.length - 1)) * 56 + 4 : 32;
                                      const yCoord = range !== 0 ? 20 - ((val - minVal) / range) * 16 + 2 : 12;
                                      return `${xCoord},${yCoord}`;
                                    }).join(' ');
                                    const goesUp = arr.length > 1 ? arr[arr.length - 1] >= arr[arr.length - 2] : true;
                                    const diffPct = arr.length > 1 && arr[0] !== 0 ? ((arr[arr.length - 1] - arr[0]) / arr[0]) * 100 : 0;
                                    return (
                                      <div className="flex items-center gap-1.5 self-center">
                                        <svg className="w-12 h-6 bg-black rounded p-0.5 border border-zinc-800" viewBox="0 0 64 24">
                                          <polyline
                                            fill="none"
                                            stroke={goesUp ? '#34d399' : '#f87171'}
                                            strokeWidth="1.2"
                                            points={pointsString}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                        <span className={`text-[7px] font-bold leading-none ${diffPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          {diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  <div className="space-y-0.5">
                                    <span className="text-white font-extrabold">{item.label}</span>
                                    <div className="flex gap-2 text-[8px] text-gray-500 leading-none">
                                      <span>Holding: <strong className="text-yellow-500">{item.qty}x</strong></span>
                                      <span>•</span>
                                      <span>Spot: <strong className="text-emerald-400">{item.spot} BSWX</strong></span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                                  {/* SELL BUTTON */}
                                  <div className="flex gap-0.5 bg-red-955/20 p-0.5 rounded border border-red-900/10">
                                    <button 
                                      onClick={() => handleMarketTransaction(item.id as any, 'sell', 1)}
                                      disabled={item.qty < 1}
                                      className="px-1.5 py-1 bg-red-900/60 hover:bg-red-800 disabled:opacity-40 text-white font-bold rounded text-[8.5px] uppercase active:scale-95 transition-all"
                                      title={`Liquidate 1x for ${sellPrice} BSWX`}
                                    >
                                      Sell 1
                                    </button>
                                    <button 
                                      onClick={() => handleMarketTransaction(item.id as any, 'sell', 10)}
                                      disabled={item.qty < 10}
                                      className="px-1.5 py-1 bg-red-900/30 hover:bg-red-800 text-red-350 disabled:opacity-40 disabled:hover:bg-red-900/30 rounded text-[8.5px] uppercase active:scale-95 transition-all"
                                      title={`Liquidate 10x for ${sellPrice * 10} BSWX`}
                                    >
                                      x10
                                    </button>
                                  </div>

                                  {/* BUY BUTTON */}
                                  <div className="flex gap-0.5 bg-emerald-955/20 p-0.5 rounded border border-emerald-900/10">
                                    <button 
                                      onClick={() => handleMarketTransaction(item.id as any, 'buy', 1)}
                                      disabled={bswx < buyPrice}
                                      className="px-1.5 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded text-[8.5px] uppercase active:scale-95 transition-all"
                                      title={`Purchase 1x for ${buyPrice} BSWX`}
                                    >
                                      Buy 1
                                    </button>
                                    <button 
                                      onClick={() => handleMarketTransaction(item.id as any, 'buy', 10)}
                                      disabled={bswx < buyPrice * 10}
                                      className="px-1.5 py-1 bg-emerald-800/30 hover:bg-emerald-700 text-emerald-350 disabled:opacity-40 disabled:hover:bg-emerald-800/30 rounded text-[8.5px] uppercase active:scale-95 transition-all"
                                      title={`Purchase 10x for ${buyPrice * 10} BSWX`}
                                    >
                                      x10
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MODULE 5: achievements and sound controller configurations */}
                    {pauseMenuTab === 'legacy' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="p-3.5 bg-black/80 rounded border border-white/5 space-y-3">
                          <span className="text-[10px] text-amber-550 block font-bold leading-none uppercase">🏆 COOP HISTORIC ACHIEVEMENT LIST</span>
                          <div className="space-y-2 text-[10px]">
                            <div className="flex justify-between items-center bg-zinc-900 px-2 py-1 rounded">
                              <span>🥇 Greenwood Architect</span>
                              <span className="text-emerald-500 font-bold">Completed</span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-900 px-2 py-1 rounded">
                              <span>🌾 Sovereignty Food chain</span>
                              <span className={mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'grocery')) ? "text-emerald-500 font-black" : "text-gray-500"}>
                                {mapGrid.some(row => row.some(t => t.type === 'built_business' && t.businessId === 'grocery')) ? "Completed" : "Locked"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-900 px-2 py-1 rounded">
                              <span>🏡 District Cottage Baron</span>
                              <span className={cottagesCount >= 1 ? "text-emerald-500 font-black" : "text-gray-500"}>
                                {cottagesCount >= 1 ? "Completed" : "Locked"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* MASTER VOLUME KNOB WITH DIRECT SLIDER CONTROL */}
                        <div className="p-3.5 bg-black/80 rounded border border-white/5 space-y-3">
                          <span className="text-[10px] text-amber-550 block font-bold leading-none uppercase">⚙️ SYSTEM SOUND REGULATION</span>
                          
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px]">Audio Status Mute:</span>
                            <button
                              onClick={() => setIsMuted(prev => !prev)}
                              className="p-1 px-3 bg-zinc-900 text-white border border-white/10 rounded active:scale-95 text-[9px] uppercase"
                            >
                              {isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] text-gray-400 block pb-1">Master Physical Slider ({Math.round(masterVolume * 100)}%):</label>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={masterVolume}
                              onChange={e => {
                                setMasterVolume(parseFloat(e.target.value));
                                startBackgroundSoundtrack();
                              }}
                              className="w-full accent-yellow-500 bg-zinc-800 rounded h-1 cursor-pointer"
                            />
                          </div>

                          <p className="text-[9px] text-gray-500 pt-2 leading-relaxed font-sans">
                            Ambient sound regulators will adjust overall audio output level instantly based on system preference settings.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* MODULE 6: COMMUNITY BULLETIN CO-OP FAVORS BOARD */}
                    {pauseMenuTab === 'favors' && (
                      <div className="space-y-4 font-sans text-gray-300">
                        <div className="p-3 bg-yellow-500/5 rounded border border-yellow-500/20 space-y-1">
                          <h4 className="text-xs font-bold text-amber-500 uppercase font-mono tracking-wider flex justify-between items-center">
                            <span>🤝 Greenwood Cooperative Bulletin</span>
                          </h4>
                          <p className="text-[10px] text-gray-400">
                            Greenwood thrives on mutual aid and local co-op networks. Complete these favors for your neighbors to earn Coins, Reputation, and Legacy points!
                          </p>
                        </div>

                        <div className="space-y-3">
                          {civicFavors.map(favor => {
                            let countHeld = 0;
                            if (favor.requiredItem === 'wood') countHeld = wood;
                            if (favor.requiredItem === 'stone') countHeld = stone;
                            if (favor.requiredItem === 'clay') countHeld = clay;
                            if (favor.requiredItem === 'polishedPlank') countHeld = polishedPlank;
                            if (favor.requiredItem === 'reinforcedBrick') countHeld = reinforcedBrick;
                            if (favor.requiredItem === 'ceramics') countHeld = ceramics;

                            const isMet = countHeld >= favor.requiredQty;

                            const itemLabel = {
                              wood: '🌲 Wood Logs',
                              stone: '⛰️ Stone Ore',
                              clay: '🏺 Raw Silt Clay',
                              polishedPlank: '🪵 Polished Planks',
                              reinforcedBrick: '🧱 Reinforced Bricks',
                              ceramics: '🏺 Fine Ceramics'
                            }[favor.requiredItem];

                            return (
                              <div key={favor.id} className="p-3 bg-zinc-950 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{favor.avatarIcon}</span>
                                    <span className="text-xs font-bold text-yellow-500 font-mono">{favor.senderName}</span>
                                  </div>
                                  <h5 className="text-[11px] font-bold text-white uppercase font-mono">{favor.title}</h5>
                                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">{favor.desc}</p>
                                  
                                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
                                    <span className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${isMet ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                      <span>Request:</span>
                                      <strong>{favor.requiredQty}x {itemLabel}</strong>
                                      <span>({countHeld}/{favor.requiredQty})</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-stretch md:items-end justify-between min-w-[120px] gap-2 md:text-right font-mono">
                                  <div className="text-[9px] text-zinc-400 space-y-0.5">
                                    <div className="text-emerald-400">💰 +{favor.bswxReward} Coins</div>
                                    <div className="text-yellow-500 font-bold">🎓 +{favor.repReward} Reputation</div>
                                    <div className="text-cyan-400">👑 +{favor.legacyReward} Legacy Points</div>
                                  </div>
                                  
                                  <button
                                    onClick={() => fulfillCivicFavor(favor)}
                                    disabled={!isMet}
                                    className={`w-full py-1.5 rounded text-[10px] font-black uppercase tracking-wider select-none text-center ${
                                      isMet 
                                        ? 'bg-emerald-650 hover:bg-emerald-600 text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
                                        : 'bg-zinc-900 text-zinc-600 border border-zinc-900/40 cursor-not-allowed'
                                    }`}
                                  >
                                    {isMet ? '🤝 Fulfill Favor!' : 'Need Materials'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* RESET RESET DISTRICT LEDGER FLOATING FOOTER */}
                  <div className="border-t border-amber-600/35 pt-4 flex flex-col sm:flex-row gap-2 justify-between items-center mt-4 text-[10px]">
                    <span className="text-gray-500 uppercase font-sans">New Greenwood Town Cooperative © Lumen Labs</span>
                    <button
                      onClick={handleResetLedger}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded font-sans uppercase font-bold text-[9px]"
                    >
                      ☠ RESET GAME STATE
                    </button>
                  </div>

                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Interactive Walkthrough Modal Overlay */}
          <AnimatePresence>
            {showTutorial && (
              <div id="interactive_tutorial_modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900 border-2 border-yellow-500 max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-left font-sans text-white"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                    <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black">
                      🎓 Greenwood Walkthrough ({tutorialStep + 1} / 10)
                    </span>
                    <button 
                      onClick={() => setShowTutorial(false)}
                      className="text-gray-400 hover:text-white font-bold text-xs"
                    >
                      [Skip]
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tutorialStep === 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Welcome to New Greenwood! 🏠</span>
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          This is a cozy 16-bit history-inspired game about community, local business, and cooperation. Your goal is to grow the local economy by collecting resources, building homes, and upgrading shops!
                        </p>
                        <div className="aspect-[16/9] bg-black/60 border border-white/5 rounded-lg flex items-center justify-center text-[10px] text-yellow-500 font-mono italic">
                          <span>Goal: Learn to trade & thrive safely</span>
                        </div>
                      </div>
                    )}

                    {tutorialStep === 1 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Walk around & Gather resources 🌲</span>
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Move around using the <b>W, A, S, D</b> keys or the standard physical <b>Arrow keys</b>. Walk directly next to a raw Pine Tree or Stone Quarry, and press <b>E</b> or <b>Spacebar</b> to gather Wood and Stone!
                        </p>
                        <div className="p-3 bg-zinc-950 rounded border border-white/5 space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between"><span>🌲 Pine Trees</span><span className="text-emerald-500">Provide Wood Logs</span></div>
                          <div className="flex justify-between"><span>⛰️ Stone Quarries</span><span className="text-yellow-600">Provide Stone Ore</span></div>
                        </div>
                      </div>
                    )}

                    {tutorialStep === 2 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Open your Bag & Create 🪵</span>
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Press the <b>Esc or P</b> key or click the big <b>BAG &amp; CONTROLS</b> button in the bottom menu. Under the <b>&quot;Crafting&quot;</b> tab, you can turn raw timber/ore into building Planks and Bricks, or eat Potato Pies to restore energy!
                        </p>
                        <div className="p-3 bg-zinc-950 rounded border border-white/5 space-y-1.5 text-[10px] font-mono">
                          <div className="flex justify-between"><span>10x Wood Logs</span><span>➔ 1x Polished Plank</span></div>
                          <div className="flex justify-between"><span>10x Stone Ore</span><span>➔ 1x Building Brick</span></div>
                        </div>
                      </div>
                    )}

                    {tutorialStep === 3 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Build Cozy Shops & Homes 🏬</span>
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Walk onto any yellow or brown plot labeled with a <b>Hard Hat</b> or click it on your viewport. Select it to reveal properties like <b>Greenwood Grocery</b>, <b>Co-op Bookstore</b>, or <b>Pioneer Cottages</b> to construct and level up!
                        </p>
                        <div className="text-[10px] text-amber-500 italic font-mono bg-amber-500/5 px-2.5 py-2 border border-amber-500/20 rounded">
                          Constructing buildings gains you automatic hourly income in Greenwood Coins!
                        </div>
                      </div>
                    )}

                    {tutorialStep === 4 && (
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Quests & History Trivia 🎓</span>
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Talk to O.W. Gurley or Sarah Rector standing near the town center. Accept their quests and answer historical context quiz questions. This builds respect/reputation and earns large coin bonuses!
                        </p>
                        <div className="text-[9.5px] italic text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                          Tip: Talk directly to people by standing near them!
                        </div>
                      </div>
                    )}

                    {tutorialStep === 5 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono text-yellow-400">
                          <span>🌧 Weather & Heritage Benefits ☀️</span>
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Greenwood is a living, breathing ecosystem. Visual weather states actively modulate your physical stamina reserves and material harvesting yields:
                        </p>
                        <div className="p-2.5 bg-zinc-950 rounded border border-white/5 space-y-1.5 text-[9.5px] font-mono text-gray-400">
                          <p><strong className="text-yellow-400">🌤 Sunny Day:</strong> Harvesting yields <strong className="text-white">+1 bonus raw material</strong>. Rest recovers energy faster.</p>
                          <p><strong className="text-sky-400">🌧 Spring Rain:</strong> Heavy mud drains stamina, but washed earth yields <strong className="text-white">+7 Stone</strong> (with a slight wood penalty).</p>
                          <p><strong className="text-zinc-400">🌫 Deep Fog:</strong> Low-vis unlocks <strong className="text-white">Mist Discovery events</strong>. Walk paths to search out lost coin pouches/branches (8% chance per step!).</p>
                          <p><strong className="text-amber-500">🌇 Sunset Golden Hour:</strong> Warm winds grant <strong className="text-white">-20% component discounts</strong> for building development!</p>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans italic leading-tight">
                          💡 Your custom Pioneer Identity, Origin State & kept Ancestral Heirlooms further amplify these core gameplay modifiers!
                        </p>
                      </div>
                    )}

                    {tutorialStep === 6 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono text-yellow-500">
                          <span>🤝 Diverse Companions & Co-op Favors</span>
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                          Harness the power of community in Greenwood. Hire historical-style Digital Companions and support local requests:
                        </p>
                        <div className="p-2.5 bg-zinc-950 rounded border border-white/5 space-y-2 text-[9.5px] font-mono text-gray-400">
                          <p><strong className="text-yellow-500">🧑‍🤝‍🧑 Cultural Styles:</strong> Each helper has authentic dapper African American hairstyles (Afro, Locs, Braids, Fades) and rich melanated skin tones.</p>
                          <p><strong className="text-emerald-400">🛠️ Active Harvest:</strong> Stand next to trees/quarries and open your ledger to recruit them. Upgraded tools gather raw building resources around the map automatically!</p>
                          <p><strong className="text-cyan-400">📋 Community Bulletins:</strong> Open your Bag and choose <strong className="text-amber-500">CO-OP BOARD</strong> to fulfill favors for neighbors in return for huge Coin & Legacy rewards!</p>
                        </div>
                      </div>
                    )}

                    {tutorialStep === 7 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono text-yellow-500">
                          <span>🏦 Co-op Bank Reserves & Financial Security</span>
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                          Realize O.W. Gurley's vision of financial self-reliance. Your money and cooperative investments are backed by local community trust:
                        </p>
                        <div className="p-2.5 bg-zinc-950 rounded border border-white/5 space-y-2 text-[9.5px] font-mono text-gray-400">
                          <p><strong className="text-yellow-500">🏛️ Central Square Hub:</strong> Walk to the Central Greenwood Civic Trust Center coordinates to view your cooperative ledger accounts and comparisons.</p>
                          <p><strong className="text-emerald-400">💵 Global Reserves:</strong> Every built business adds to collective town funds, increasing the security rating of your community accounts.</p>
                        </div>
                      </div>
                    )}

                    {tutorialStep === 8 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono text-yellow-500">
                          <span>🏛️ Restoring Historic Landmarks</span>
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                          Historic landmarks around the map stand as sacred proof of sovereign success. Restore them to unlock their wisdom:
                        </p>
                        <div className="p-2.5 bg-zinc-950 rounded border border-white/5 space-y-2 text-[9.5px] font-mono text-gray-400">
                          <p><strong className="text-yellow-500">🗺️ Monument Locations:</strong> Find Mount Zion Baptist, Vernon A.M.E., and the Stradford Hotel around the boundaries of the coordinates grid.</p>
                          <p><strong className="text-purple-400">🔮 Rebuilding LP:</strong> Restore ruined structures to gain large boosts in Reputation and Legacy Points, unlocking specialized upgrades.</p>
                        </div>
                      </div>
                    )}

                    {tutorialStep === 9 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono text-yellow-500">
                          <span>🏘️ Cottages & Community Synergy</span>
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                          Sovereignty is built through thoughtful urban design. Adjacent structures boost each other:
                        </p>
                        <div className="p-2.5 bg-zinc-950 rounded border border-white/5 space-y-2 text-[9.5px] font-mono text-gray-400">
                          <p><strong className="text-teal-400">🏡 Pioneer Cottages:</strong> Build cottages on selected residential plots. Each cottage compounds the output of all shops globally by 1.5x.</p>
                          <p><strong className="text-lime-400">🌻 Community Gardens:</strong> Plant gardens next to built storefronts to passively multiply adjacent Reputation yields by +50%.</p>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                      disabled={tutorialStep === 0}
                      className="px-4 py-1.5 bg-zinc-800 text-gray-300 hover:text-white rounded text-xs font-bold disabled:opacity-40 select-none"
                    >
                      Back
                    </button>
                    {tutorialStep < 9 ? (
                      <button
                        onClick={() => setTutorialStep(prev => prev + 1)}
                        className="px-5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-xs font-bold select-none"
                      >
                        Next Step
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowTutorial(false)}
                        className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold select-none"
                      >
                        Got it, Lets Play!
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Neighbors Thank You/Favor Completed Success Overlay */}
          <AnimatePresence>
            {completedFavorNotice && (
              <div id="favor_completion_overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-zinc-950 border-2 border-emerald-500 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4 text-white font-sans"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl border border-emerald-500/30 animate-bounce">
                    🤝
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black block">FAVOR COMPLETED!</span>
                    <h3 className="text-lg font-extrabold text-white leading-tight">
                      Thank you from {completedFavorNotice.senderName}!
                    </h3>
                  </div>

                  <p className="text-xs text-gray-440 bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed italic">
                    &quot;Bless you, my friend! Your support strengthens the Greenwood cooperative spirit. Together, we are building a legacy that will inspire generations!&quot;
                  </p>

                  <div className="p-2.5 bg-emerald-500/5 rounded border border-emerald-500/10 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coins Received:</span>
                      <span className="text-emerald-400 font-extrabold font-mono">+{completedFavorNotice.bswxReward} BSWX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-450">Reputation Earned:</span>
                      <span className="text-yellow-500 font-extrabold font-mono">+{completedFavorNotice.repReward}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-455">Legacy Gained:</span>
                      <span className="text-cyan-400 font-extrabold font-mono">+{completedFavorNotice.legacyReward} LP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCompletedFavorNotice(null);
                      playRetroTone('strike', 0.5);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-lg border border-emerald-400/20 active:scale-95 transition-all select-none animate-fadeIn"
                  >
                    You&apos;re Welcome!
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Fainted / Exhausted Recovery Screen Overlay */}
          <AnimatePresence>
            {showFaintScreen && (
              <div id="exhausted_recovery_overlay" className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-950 border-2 border-red-500 max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-left font-sans text-white space-y-5"
                >
                  <div className="flex items-center gap-3 text-red-500 border-b border-red-500/20 pb-2.5">
                    <BatteryCharging className="w-8 h-8 animate-pulse text-red-500" />
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-wider font-mono">ENERGY DEPLETED!</h3>
                      <p className="text-[10px] text-gray-400 font-sans tracking-tight">System Status: Fainted &amp; Rescued by neighbors</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    You worked extremely hard growing New Greenwood, but you fainted from pure physical exhaustion! Luckily, the Greenwood town cooperative found you and took care of you.
                  </p>

                  <div className="p-3 bg-zinc-900 rounded-lg border border-red-500/10 space-y-2">
                    <h4 className="text-[11px] font-bold text-red-400 uppercase font-mono tracking-wider">Town Progress Recap</h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300">
                      <div>💰 Coins Held:</div>
                      <div className="text-right text-yellow-500 font-bold">{bswx.toFixed(1)} Coins</div>
                      <div>📈 Reputation:</div>
                      <div className="text-right text-emerald-400 font-bold">{reputation.toFixed(1)} REP</div>
                      <div>👑 Legacy Points:</div>
                      <div className="text-right text-white font-bold">{legacyPoints} LP</div>
                      <div>👥 Helpers Engaged:</div>
                      <div className="text-right text-white font-bold">{apprentices.length} Active</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 italic font-sans leading-normal">
                    Would you like to pay a small contribution from your co-op savings to get back on your feet (restores 50% stamina), or start a fresh town run from Day 1?
                  </p>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        const cost = Math.min(bswx, 50);
                        setBswx(prev => Math.max(0, prev - cost));
                        setStamina(50);
                        setShowFaintScreen(false);
                        addLog(`Rescue: The co-op waives part of the fee. Debited -${cost.toFixed(1)} Coins. Stamina is back to 50%!`);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs font-mono tracking-widest rounded-lg transition-all shadow-[0_4px_10px_rgba(16,185,129,0.2)]"
                    >
                      🤝 Ask Neighbors for Help (Costs -50 Coins)
                    </button>
                    
                    <button
                      onClick={handleResetLedger}
                      className="w-full py-2 bg-red-800 hover:bg-red-700 text-red-100 hover:text-white font-bold uppercase text-[10px] sm:text-xs font-mono tracking-wider rounded-lg border border-red-500/20 transition-all"
                    >
                      ☠ Reset State (Start Day 1 Fresh)
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* RIGHT CLICK FLOATING TILE CONTEXT MENU */}
          <AnimatePresence>
            {gridContextMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.08 }}
                style={{ top: gridContextMenu.y, left: gridContextMenu.x }}
                className="fixed z-50 bg-[#09090c]/98 border-2 border-yellow-500/50 rounded-lg p-1 w-48 shadow-[0_10px_35px_rgba(0,0,0,0.95)] font-mono text-[9px] text-yellow-500 flex flex-col divide-y divide-white/10 select-none pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header info */}
                <div className="px-2 py-1 bg-zinc-950 text-white font-black text-[8px] tracking-wider uppercase flex justify-between items-center rounded-t border-b border-yellow-500/20">
                  <span>CELL OPTIONS</span>
                  <span className="text-[7.5px] text-gray-400">({gridContextMenu.tileX}, {gridContextMenu.tileY})</span>
                </div>

                {/* Statistics tab transition */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedX(gridContextMenu.tileX);
                    setSelectedY(gridContextMenu.tileY);
                    setShowTileStats(true);
                    setGridContextMenu(null);
                    addLog(`Opened cell analysis statistics for plot (${gridContextMenu.tileX}, ${gridContextMenu.tileY}).`);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-yellow-500/10 hover:text-white font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  📊 VIEW STATISTICS
                </button>

                {/* Built assets -> Demolish option */}
                {(gridContextMenu.tileType === 'built_business' || gridContextMenu.tileType === 'cottage') && (
                  <button
                    type="button"
                    onClick={() => {
                      const tile = mapGrid[gridContextMenu.tileY]?.[gridContextMenu.tileX];
                      if (tile) demolishStructure(tile);
                      setGridContextMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-red-950/40 hover:text-red-400 font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    💥 DEMOLISH STRUCT
                  </button>
                )}

                {/* Natural nodes -> Quick Harvest options */}
                {(gridContextMenu.tileType === 'forest_tree' || gridContextMenu.tileType === 'quarry_stone' || gridContextMenu.tileType === 'clay_deposit') && (
                  <button
                    type="button"
                    onClick={() => {
                      const tile = mapGrid[gridContextMenu.tileY]?.[gridContextMenu.tileX];
                      if (tile) {
                        const isNear = Math.abs(playerX - tile.x) <= 1 && Math.abs(playerY - tile.y) <= 1;
                        if (!isNear) {
                          addLog(`Fails: Too far to manual harvest! Walk adjacent to (${tile.x}, ${tile.y}) first.`);
                          playRetroTone('fail');
                        } else if (tile.type === 'clay_deposit') {
                          triggerSuccessfulHarvest(tile, 'clay');
                        } else if (tile.type === 'forest_tree') {
                          triggerSuccessfulHarvest(tile, 'tree');
                        } else if (tile.type === 'quarry_stone') {
                          triggerSuccessfulHarvest(tile, 'stone');
                        }
                      }
                      setGridContextMenu(null);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/40 hover:text-emerald-400 font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    ⛏️ HARVEST NODE
                  </button>
                )}

                {/* Empty plots -> Quick construction shortcuts */}
                {gridContextMenu.tileType === 'leasehold' && (
                  <div className="flex flex-col text-[8.5px] bg-zinc-950/40 py-1 space-y-0.5 font-mono">
                    <span className="px-2 py-0.5 text-gray-500 text-[7px] block font-black border-b border-white/5 select-none tracking-widest uppercase">CONSTRUCT QUICK:</span>
                    {Object.values(BUSINESS_CATALOG).map(biz => (
                      <button
                        key={biz.id}
                        type="button"
                        onClick={() => {
                          setSelectedX(gridContextMenu.tileX);
                          setSelectedY(gridContextMenu.tileY);
                          constructStorefront(biz.id);
                          setGridContextMenu(null);
                        }}
                        className="w-full text-left px-2 py-1 hover:bg-yellow-500 hover:text-black font-semibold flex justify-between items-center cursor-pointer transition-colors"
                      >
                        <span>🏗️ {biz.name.split(' ').slice(-1)[0]}</span>
                        <span className="text-[7.5px] text-gray-500 font-normal">{biz.woodCost}W {biz.stoneCost}S</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Close operation */}
                <button
                  type="button"
                  onClick={() => setGridContextMenu(null)}
                  className="w-full text-left px-2 py-1.5 hover:bg-zinc-900 text-gray-400 text-[8px] flex items-center gap-1 cursor-pointer transition-colors font-medium border-t border-white/10"
                >
                  ✕ CANCEL
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* MOBILE BOTTOM NAVIGATION BAR */}
          <div className="md:hidden flex justify-around items-center bg-zinc-950 border-t border-yellow-500/20 h-16 w-full shrink-0 z-30 select-none px-2 py-1 gap-1">
            <button
              onClick={() => {
                setMobileActiveTab('play');
                playRetroTone('success', 0.4);
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full rounded transition-all active:scale-95 border ${
                mobileActiveTab === 'play'
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 font-extrabold'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-base">🎮</span>
              <span className="text-[9px] font-mono tracking-wider">PLAY</span>
            </button>
            <button
              onClick={() => {
                setMobileActiveTab('radar');
                playRetroTone('success', 0.4);
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full rounded transition-all active:scale-95 border ${
                mobileActiveTab === 'radar'
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 font-extrabold'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-base">🗺️</span>
              <span className="text-[9px] font-mono tracking-wider">RADAR</span>
            </button>
            <button
              onClick={() => {
                setMobileActiveTab('auto');
                playRetroTone('success', 0.4);
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full rounded transition-all active:scale-95 border ${
                mobileActiveTab === 'auto'
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 font-extrabold'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-base">🤖</span>
              <span className="text-[9px] font-mono tracking-wider">AUTO</span>
            </button>
            <button
              onClick={() => {
                setMobileActiveTab('logs');
                playRetroTone('success', 0.4);
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full rounded transition-all active:scale-95 border ${
                mobileActiveTab === 'logs'
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 font-extrabold'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-base">📟</span>
              <span className="text-[9px] font-mono tracking-wider">LOGS</span>
            </button>
          </div>

        </main>
      )}

    </div>
  );
}

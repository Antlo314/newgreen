'use client';

import React from 'react';

export interface RetroCharacterProps {
  skin?: string;         // 'espresso' | 'umber' | 'honey' | 'caramel' or custom hex
  hair?: string;         // 'afro' | 'locs' | 'braids' | 'fade' | 'headwrap' | 'crown-bun' | 'vintage-waves' | 'locs-bob'
  clothing?: string;     // 'emerald' | 'gold' | 'crimson' | 'purple' or custom hex
  accessory?: 'none' | 'glasses' | 'chain' | 'cap';
  direction?: 'N' | 'S' | 'E' | 'W';
  playerDirection?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'; // Upgraded Phase 1 state support
  isMoving?: boolean;
  isNPC?: boolean;
  npcType?: 'gurley' | 'rector' | 'stradford' | 'apprentice' | 'gerumba' | null; // Added 'apprentice' support
  className?: string;
  sizeClassName?: string;
  gender?: 'Male' | 'Female';
  harvestingType?: 'tree' | 'stone' | 'clay' | null;
}

const SKIN_GRADIENTS = {
  espresso: {
    id: 'espressoSkinGrad',
    main: '#3A2214',
    light: '#4E311F',
    dark: '#25140B'
  },
  umber: {
    id: 'umberSkinGrad',
    main: '#5C3826',
    light: '#784D35',
    dark: '#3F2314'
  },
  honey: {
    id: 'honeySkinGrad',
    main: '#91532B',
    light: '#B56F3F',
    dark: '#6B3718'
  },
  caramel: {
    id: 'caramelSkinGrad',
    main: '#C68045',
    light: '#DF9D63',
    dark: '#935325'
  }
};

const CLOTHING_COLORS: Record<string, string> = {
  emerald: '#047857',
  gold: '#D97706',
  crimson: '#DC2626',
  purple: '#6D28D9'
};

export default function RetroCharacter({
  skin = 'espresso',
  hair = 'afro',
  clothing = 'emerald',
  accessory = 'none',
  direction = 'S',
  playerDirection,
  isMoving = false,
  isNPC = false,
  npcType = null,
  className = '',
  sizeClassName = 'w-full h-full',
  gender = 'Male',
  harvestingType = null
}: RetroCharacterProps) {
  
  // Resolve colors & gradients
  const skinKey = (skin in SKIN_GRADIENTS) ? (skin as keyof typeof SKIN_GRADIENTS) : 'espresso';
  const grad = SKIN_GRADIENTS[skinKey];
  const clothingHex = CLOTHING_COLORS[clothing] || clothing;

  // Frame counter (0, 1, 2, 3) driven by continuous loop when moving
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    if (!isMoving) {
      const t = setTimeout(() => {
        setFrame(0);
      }, 0);
      return () => clearTimeout(t);
    }
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 120); // Authentic 16-bit timing
    return () => {
      clearInterval(interval);
    };
  }, [isMoving]);

  // Resolve current active 4-directional movement state
  let currentDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'DOWN';
  if (playerDirection) {
    currentDir = playerDirection;
  } else if (direction) {
    const mapDir = { 'N': 'UP', 'S': 'DOWN', 'E': 'RIGHT', 'W': 'LEFT' } as const;
    currentDir = mapDir[direction] || 'DOWN';
  }

  // Draw general NPC profiles (integrating maximum visual shading and deep character layers)
  if (isNPC && npcType) {
    if (npcType === 'gurley') {
      return (
        <div className={`relative ${sizeClassName} ${className} flex items-center justify-center`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]">
            <defs>
              <linearGradient id="gurlSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4E311F" />
                <stop offset="50%" stopColor="#3A2214" />
                <stop offset="100%" stopColor="#25140B" />
              </linearGradient>
              <linearGradient id="gurlSuit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>
            {/* Ambient Occlusion Drop Shadow */}
            <ellipse cx="50" cy="88" rx="22" ry="5" fill="#000" opacity="0.5" />
            
            {/* Detailed Legs and Boots */}
            <rect x="40" y="78" width="8" height="9" fill="#020617" rx="1.5" />
            <rect x="52" y="78" width="8" height="9" fill="#020617" rx="1.5" />
            <rect x="36" y="85" width="13" height="4" rx="2" fill="#090d16" />
            <rect x="51" y="85" width="13" height="4" rx="2" fill="#090d16" />
            <rect x="42" y="88" width="23" height="1" fill="#ca8a04" opacity="0.8" />

            {/* Suit & Imperial Tie */}
            <rect x="30" y="44" width="40" height="36" rx="5" fill="url(#gurlSuit)" />
            {/* Shadow under head onto chest */}
            <rect x="34" y="44" width="32" height="4" fill="#000000" opacity="0.3" />
            
            <polygon points="42,44 58,44 50,58" fill="#ffffff" />
            <polygon points="48,46 52,46 50,72" fill="#eab308" /> {/* Golden Ledger Tie */}
            <circle cx="50" cy="50" r="2.5" fill="#ca8a04" />

            {/* Arm Sleeves with gold cuffs */}
            <rect x="23" y="44" width="8" height="26" rx="3" fill="#0f172a" />
            <rect x="23" y="66" width="8" height="2" fill="#eab308" />
            <rect x="23" y="68" width="8" height="5" rx="1" fill="url(#gurlSkin)" />

            <rect x="69" y="44" width="8" height="26" rx="3" fill="#0f172a" />
            <rect x="69" y="66" width="8" height="2" fill="#eab308" />
            <rect x="69" y="68" width="8" height="5" rx="1" fill="url(#gurlSkin)" />

            {/* Hand-drawn Head & Neck with 3-tone mapping */}
            <rect x="43" y="40" width="14" height="6" fill="url(#gurlSkin)" />
            <rect x="36" y="16" width="28" height="26" rx="5" fill="url(#gurlSkin)" />
            <rect x="36" y="16" width="28" height="3" fill="#4E311F" opacity="0.25" /> {/* Top Ambient Occlusion */}

            {/* Detailed Wire-frame Glasses & Beard */}
            <circle cx="44" cy="27" r="4.5" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <circle cx="56" cy="27" r="4.5" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <line x1="48.5" y1="27" x2="51.5" y2="27" stroke="#fbbf24" strokeWidth="1.5" />
            
            {/* Eyes */}
            <rect x="43" y="26.3" width="2" height="2.2" fill="#1e293b" />
            <rect x="55" y="26.3" width="2" height="2.2" fill="#1e293b" />
            <rect x="45.5" y="25" width="1" height="1" fill="#ffffff" />
            <rect x="57.5" y="25" width="1" height="1" fill="#ffffff" />

            {/* Noble Groomed Beard & Tech Fade Hair Overlay */}
            <path d="M 36,36 C 36,44, 64,44, 64,36 Z" fill="#18181b" opacity="0.85" />
            <rect x="43" y="38" width="14" height="2" fill="#18181b" />
            
            {/* Crown Bowler Cap */}
            <rect x="34" y="12" width="32" height="6" rx="2" fill="#1e293b" />
            <path d="M 38,12 C 38,4, 62,4, 62,12 Z" fill="#0f172a" />
          </svg>
        </div>
      );
    }

    if (npcType === 'rector') {
      return (
        <div className={`relative ${sizeClassName} ${className} flex items-center justify-center`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]">
            <defs>
              <linearGradient id="rectSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B56F3F" />
                <stop offset="50%" stopColor="#91532B" />
                <stop offset="100%" stopColor="#6B3718" />
              </linearGradient>
              <linearGradient id="royalPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6D28D9" />
                <stop offset="50%" stopColor="#4C1D95" />
                <stop offset="100%" stopColor="#2E1065" />
              </linearGradient>
            </defs>
            {/* Ground Shadow */}
            <ellipse cx="50" cy="88" rx="24" ry="4.5" fill="#000" opacity="0.5" />
            
            {/* Fluid Gown with Detailed Highlights */}
            <path d="M 36,44 L 64,44 L 76,86 L 24,86 Z" fill="url(#royalPurple)" />
            <path d="M 44,44 L 56,44 L 50,86" stroke="#fbbf24" strokeWidth="2.5" fill="none" opacity="0.9" />
            <rect x="22" y="82" width="56" height="5" fill="#ca8a04" rx="1" />
            
            {/* Sleeves */}
            <rect x="23" y="44" width="7" height="24" rx="2" fill="#4C1D95" />
            <rect x="23" y="65" width="7" height="4" fill="url(#rectSkin)" rx="1" />
            <rect x="70" y="44" width="7" height="24" rx="2" fill="#4C1D95" />
            <rect x="70" y="65" width="7" height="4" fill="url(#rectSkin)" rx="1" />

            {/* Sovereign Crown Pearl Necklace */}
            <rect x="42" y="39" width="16" height="6" fill="#fef08a" opacity="0.8" />
            <circle cx="44" cy="44" r="1.5" fill="#ffffff" />
            <circle cx="47" cy="45" r="1.5" fill="#ffffff" />
            <circle cx="50" cy="45.5" r="1.5" fill="#ffffff" />
            <circle cx="53" cy="45" r="1.5" fill="#ffffff" />
            <circle cx="56" cy="44" r="1.5" fill="#ffffff" />

            {/* Head and Royal Gold Accessories */}
            <rect x="43" y="36" width="14" height="6" fill="url(#rectSkin)" />
            <rect x="36" y="14" width="28" height="24" rx="6" fill="url(#rectSkin)" />

            {/* Spark Eyes */}
            <rect x="42" y="22" width="3" height="3.5" fill="#ffffff" />
            <rect x="42" y="23" width="1.5" height="1.5" fill="#000000" />
            <rect x="55" y="22" width="3" height="3.5" fill="#ffffff" />
            <rect x="55" y="23" width="1.5" height="1.5" fill="#000000" />
            <rect x="48" y="30" width="4" height="1.5" fill="#b91c1c" />

            {/* Exquisite Braided Updo Crown */}
            <circle cx="50" cy="11" r="9" fill="#18181b" />
            <rect x="34" y="12" width="32" height="6" rx="3" fill="#18181b" />
            <circle cx="50" cy="5" r="3.5" fill="#ca8a04" /> {/* Gold Tiara Ornament */}
          </svg>
        </div>
      );
    }

    if (npcType === 'stradford') {
      return (
        <div className={`relative ${sizeClassName} ${className} flex items-center justify-center`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]">
            <defs>
              <linearGradient id="stradSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#784D35" />
                <stop offset="50%" stopColor="#5C3826" />
                <stop offset="100%" stopColor="#3F2314" />
              </linearGradient>
              <linearGradient id="maroonTux" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#581c87" />
                <stop offset="50%" stopColor="#3b0764" />
                <stop offset="100%" stopColor="#1e0030" />
              </linearGradient>
            </defs>
            {/* Ground Shadow */}
            <ellipse cx="50" cy="88" rx="22" ry="5" fill="#000" opacity="0.5" />
            
            {/* Legs & Shoes */}
            <rect x="39" y="78" width="8" height="9" fill="#111827" rx="1" />
            <rect x="53" y="78" width="8" height="9" fill="#111827" rx="1" />
            <rect x="36" y="85" width="12" height="4" fill="#090a0f" rx="1.5" />
            <rect x="52" y="85" width="12" height="4" fill="#090a0f" rx="1.5" />

            {/* Maroon double-breasted coat layers */}
            <rect x="30" y="44" width="40" height="36" rx="4" fill="url(#maroonTux)" />
            <rect x="30" y="44" width="12" height="36" fill="#450a0a" opacity="0.35" rx="1" /> {/* Shadow lapel edge */}
            
            {/* White collar underlay */}
            <polygon points="41,44 59,44 50,56" fill="#f8fafc" />
            <rect x="49" y="47" width="2" height="12" fill="#eab308" /> {/* Gold brooch */}

            {/* Arm sleeves */}
            <rect x="23" y="44" width="8" height="24" rx="2.5" fill="#3b0764" />
            <rect x="23" y="66" width="8" height="5" fill="url(#stradSkin)" rx="1" />
            <rect x="69" y="44" width="8" height="24" rx="2.5" fill="#3b0764" />
            <rect x="69" y="66" width="8" height="5" fill="url(#stradSkin)" rx="1" />

            {/* Strut Head & Beard */}
            <rect x="43" y="38" width="14" height="7" fill="url(#stradSkin)" />
            <rect x="36" y="16" width="28" height="24" rx="5" fill="url(#stradSkin)" />

            {/* Regal Profile Eyes */}
            <rect x="42" y="24" width="3.5" height="3" fill="#ffffff" />
            <rect x="42.5" y="24.8" width="1.5" height="1.5" fill="#000000" />
            <rect x="54.5" y="24" width="3.5" height="3" fill="#ffffff" />
            <rect x="55" y="24.8" width="1.5" height="1.5" fill="#000000" />

            {/* Full Beard */}
            <path d="M 36,34 C 36,44, 64,44, 64,34 Z" fill="#1f2937" opacity="0.9" />

            {/* Driving Cap / Newsboy Cap */}
            <ellipse cx="50" cy="15" rx="16" ry="6" fill="#1f2937" />
            <rect x="32" y="14" width="36" height="4" fill="#ca8a04" rx="1" />
          </svg>
        </div>
      );
    }

    if (npcType === 'apprentice') {
      const apprSkinId = `${grad.id}_appr`;
      return (
        <div className={`relative ${sizeClassName} ${className} flex items-center justify-center`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
            <defs>
              <linearGradient id={apprSkinId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={grad.light} />
                <stop offset="50%" stopColor={grad.main} />
                <stop offset="100%" stopColor={grad.dark} />
              </linearGradient>
            </defs>
            {/* Ground Shadow */}
            <ellipse cx="50" cy="88" rx="16" ry="4" fill="#000" opacity="0.4" />
            
            {/* Work boots */}
            <rect x="41" y="78" width="7" height="9" fill="#18181b" rx="1" />
            <rect x="52" y="78" width="7" height="9" fill="#18181b" rx="1" />
            
            {/* Double overalls body with gold brass locks */}
            <rect x="32" y="48" width="36" height="31" rx="3" fill="#1e3a8a" />
            <rect x="35" y="48" width="5" height="15" fill="#ca8a04" />
            <rect x="60" y="48" width="5" height="15" fill="#ca8a04" />
            <circle cx="37.5" cy="56" r="1.5" fill="#facc15" />
            <circle cx="62.5" cy="56" r="1.5" fill="#facc15" />
            
            {/* Under Shirt - color adjusted to clothing selection */}
            <rect x="32" y="45" width="36" height="4" fill={clothingHex} />

            {/* Striking Arm with tool belt indicator */}
            <rect x="24" y="45" width="6" height="22" rx="2" fill={clothingHex} />
            <rect x="24" y="65" width="6" height="5" fill={`url(#${apprSkinId})`} rx="1" />
            <rect x="70" y="45" width="6" height="22" rx="2" fill={clothingHex} />
            <rect x="70" y="65" width="6" height="5" fill={`url(#${apprSkinId})`} rx="1" />

            {/* Face & Head using custom African American melanated skin tones */}
            <rect x="43" y="38" width="14" height="8" fill={`url(#${apprSkinId})`} />
            <rect x="37" y="16" width="26" height="23" rx="4" fill={`url(#${apprSkinId})`} />

            <rect x="42" y="24" width="3" height="3" fill="#ffffff" />
            <rect x="42" y="24.8" width="1.5" height="1.5" fill="#000000" />
            <rect x="55" y="24" width="3" height="3" fill="#ffffff" />
            <rect x="55" y="24.8" width="1.5" height="1.5" fill="#000000" />

            {/* African American Hairstyles for Companions */}
            {hair === 'afro' && (
              <g fill="#18181b">
                <circle cx="50" cy="15" r="13" />
                <circle cx="39" cy="18" r="10" />
                <circle cx="61" cy="18" r="10" />
                <circle cx="43" cy="11" r="11" />
                <circle cx="57" cy="11" r="11" />
              </g>
            )}

            {hair === 'locs' && (
              <g fill="#1a120c">
                <rect x="33" y="11" width="34" height="11" rx="4" />
                <rect x="32" y="18" width="5.5" height="15" rx="2" />
                <rect x="62.5" y="18" width="5.5" height="15" rx="2" />
                {/* Gold Bands */}
                <circle cx="34.5" cy="30" r="1.5" fill="#ca8a04" />
                <circle cx="65.5" cy="30" r="1.5" fill="#ca8a04" />
              </g>
            )}

            {hair === 'braids' && (
              <g fill="#0e0c0d">
                <rect x="34" y="12" width="32" height="10" rx="3" />
                <rect x="31" y="18" width="5" height="16" rx="1.5" />
                <rect x="64" y="18" width="5" height="16" rx="1.5" />
                <rect x="33.5" y="28" width="1.8" height="4" fill="#fbbf24" />
                <rect x="66.5" y="28" width="1.8" height="4" fill="#fbbf24" />
              </g>
            )}

            {hair === 'fade' && (
              <g fill="#0e0e12">
                <rect x="36" y="10" width="28" height="10" rx="3.5" />
                <rect x="35" y="16" width="30" height="4" />
                <rect x="38" y="11" width="24" height="2" fill="#4b5563" rx="1" opacity="0.65" />
                <rect x="34" y="16" width="32" height="1.5" fill="#fbbf24" /> {/* Athletic headband */}
              </g>
            )}

            {/* Default Headband if style was unmatched */}
            {hair !== 'afro' && hair !== 'locs' && hair !== 'braids' && hair !== 'fade' && (
              <g>
                <rect x="37" y="10" width="26" height="7" rx="1" fill="#18181b" />
                <rect x="34" y="12" width="32" height="4" fill="#fbbf24" rx="1" />
              </g>
            )}
          </svg>
        </div>
      );
    }

    if (npcType === 'gerumba') {
      return (
        <div id="gerumba_character" className={`relative ${sizeClassName} ${className} flex items-center justify-center`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]">
            <defs>
              {/* Pharoah Gerumba's Linear Gradients */}
              <linearGradient id="geruSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3A2214" />
                <stop offset="50%" stopColor="#25140B" />
                <stop offset="100%" stopColor="#1C0F08" />
              </linearGradient>
              <linearGradient id="egyptianGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="egyptianWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="nemesBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            {/* Ground Shadow */}
            <ellipse cx="50" cy="88" rx="22" ry="5" fill="#000" opacity="0.5" />
            
            {/* Detailed Legs and Sandals */}
            <rect x="40" y="78" width="7" height="9" fill="#E2E8F0" rx="1" />
            <rect x="53" y="78" width="7" height="9" fill="#E2E8F0" rx="1" />
            <rect x="36" y="85" width="13" height="4" rx="2" fill="url(#egyptianGold)" /> {/* Golden laced sandal left */}
            <rect x="51" y="85" width="13" height="4" rx="2" fill="url(#egyptianGold)" /> {/* Golden laced sandal right */}

            {/* Priestly Egyptian White & Gold Drape Gowns (Kalasiris) */}
            <path d="M 32,44 L 68,44 L 75,82 L 25,82 Z" fill="url(#egyptianWhite)" />
            {/* Golden Sash / Girdle */}
            <rect x="30" y="58" width="40" height="6" fill="url(#egyptianGold)" rx="1" />
            <rect x="46" y="64" width="8" height="15" fill="url(#egyptianGold)" rx="0.5" /> {/* Hanging sash */}
            <rect x="48" y="65" width="4" height="13" fill="#1E3A8A" /> {/* Blue decoration on sash */}
            
            {/* Shadow under collar */}
            <rect x="34" y="44" width="32" height="4" fill="#000000" opacity="0.2" />

            {/* Arms with golden cuffs and priests bracelets */}
            <rect x="23" y="44" width="8" height="24" rx="3" fill="url(#egyptianWhite)" />
            <rect x="23" y="62" width="8" height="4" fill="url(#egyptianGold)" />
            <rect x="23" y="66" width="8" height="5" rx="1.5" fill="url(#geruSkin)" />

            <rect x="69" y="44" width="8" height="24" rx="3" fill="url(#egyptianWhite)" />
            <rect x="69" y="62" width="8" height="4" fill="url(#egyptianGold)" />
            <rect x="69" y="66" width="8" height="5" rx="1.5" fill="url(#geruSkin)" />

            {/* Broad Collar (Wesekh) necklace */}
            <path d="M 35,44 C 35,54, 65,54, 65,44 Z" fill="url(#egyptianGold)" />
            <path d="M 38,44 C 38,51, 62,51, 62,44 Z" fill="#1E3A8A" /> {/* Blue ring */}
            <path d="M 42,44 C 42,48, 58,48, 58,44 Z" fill="url(#egyptianGold)" /> {/* Inner Gold ring */}
            
            {/* Head and Neck */}
            <rect x="44" y="38" width="12" height="8" fill="url(#geruSkin)" />
            <rect x="37" y="16" width="26" height="24" rx="5" fill="url(#geruSkin)" />

            {/* Oracle Eyes (Pharoah style kohl outline with green shimmer) */}
            <g>
              <rect x="41" y="24" width="5.5" height="3" fill="#ffffff" />
              <rect x="41" y="22.5" width="5.5" height="1" fill="#000000" /> {/* Upper liner */}
              <circle cx="44.2" cy="25.5" r="1.3" fill="#047857" /> {/* Green mystic iris */}
              
              <rect x="53.5" y="24" width="5.5" height="3" fill="#ffffff" />
              <rect x="53.5" y="22.5" width="5.5" height="1" fill="#000000" /> {/* Upper liner */}
              <circle cx="55.8" cy="25.5" r="1.3" fill="#047857" /> {/* Green mystic iris */}
              
              {/* Intelligent beard (Sovereign postiche chin touch) */}
              <rect x="48.5" y="38" width="3" height="7" fill="#0c0d12" rx="0.5" />
              <rect x="48.5" y="44" width="3" height="1.5" fill="url(#egyptianGold)" />
            </g>

            {/* Traditional Egyptian Headress (Nemes) stripes gold & blue */}
            <path d="M37,16 C37,8, 63,8, 63,16 Z" fill="url(#egyptianGold)" />
            {/* Side wings of Nemes draped down to shoulders */}
            <path d="M30,22 L37,16 L37,42 L31,42 Z" fill="url(#nemesBlue)" />
            <path d="M70,22 L63,16 L63,42 L69,42 Z" fill="url(#nemesBlue)" />
            {/* Striped overlay layers */}
            <rect x="32" y="25" width="3" height="14" fill="url(#egyptianGold)" />
            <rect x="65" y="25" width="3" height="14" fill="url(#egyptianGold)" />
            <path d="M 44,9 L 46,16 L 40,16 Z" fill="url(#nemesBlue)" />
            <path d="M 56,9 L 54,16 L 60,16 Z" fill="url(#nemesBlue)" />
            <path d="M 48,8 L 52,8 L 50,13 Z" fill="url(#egyptianGold)" /> {/* Uraeus snake symbol on crown */}
          </svg>
        </div>
      );
    }
  }

  // --- ARMED WALKING SHADER CALCULATIONS ---
  // Translate, pivot, rot variables driven by 4-directional matrix
  let torsoY = 0;
  let torsoSkew = 0;
  let headY = 0;
  let leftLegY = 0;
  let leftLegH = 14;
  let rightLegY = 0;
  let rightLegH = 14;
  
  let leftArmY = 0;
  let leftArmX = 0;
  let leftArmRot = 0;
  
  let rightArmY = 0;
  let rightArmX = 0;
  let rightArmRot = 0;

  let faceXOffset = 0;
  let accessoryRot = 0;

  // Handle keyframe oscillations based on movement frames (0-3)
  if (isMoving) {
    if (currentDir === 'UP' || currentDir === 'DOWN') {
      torsoY = (frame === 0 || frame === 2) ? 1.5 : 0;
      headY = (frame === 0 || frame === 2) ? 1.0 : 0;
      
      if (frame === 0) {
        leftLegY = -3;
        leftLegH = 11;
        rightLegY = 0;
        rightLegH = 14;
        leftArmY = 2.5;
        rightArmY = -2.5;
        leftArmRot = -15;
        rightArmRot = 15;
      } else if (frame === 1) {
        leftLegY = -1.5;
        leftLegH = 12.5;
        rightLegY = -1.5;
        rightLegH = 12.5;
        leftArmY = 0;
        rightArmY = 0;
        leftArmRot = 0;
        rightArmRot = 0;
      } else if (frame === 2) {
        leftLegY = 0;
        leftLegH = 14;
        rightLegY = -3;
        rightLegH = 11;
        leftArmY = -2.5;
        rightArmY = 2.5;
        leftArmRot = 15;
        rightArmRot = -15;
      } else {
        leftLegY = -1.5;
        leftLegH = 12.5;
        rightLegY = -1.5;
        rightLegH = 12.5;
        leftArmY = 0;
        rightArmY = 0;
        leftArmRot = 0;
        rightArmRot = 0;
      }
    } else {
      // LEFT / RIGHT Profiles
      torsoY = (frame % 2 === 0) ? 1.2 : 0;
      torsoSkew = (currentDir === 'RIGHT') ? 2.5 : -2.5;
      headY = (frame % 2 === 0) ? 0.8 : 0;
      accessoryRot = (frame === 0) ? -4 : (frame === 2) ? 4 : 0;
      faceXOffset = (currentDir === 'RIGHT') ? 3 : -3;

      if (frame === 0) {
        leftArmX = -3.5;
        leftArmY = 1.2;
        rightArmX = 3.5;
        rightArmY = -1.2;
        leftArmRot = -18;
        rightArmRot = 18;
        
        leftLegY = -3.5;
        leftLegH = 11.5;
        rightLegY = 0;
      } else if (frame === 1) {
        leftArmX = 0;
        leftArmY = 0;
        rightArmX = 0;
        rightArmY = 0;
        leftArmRot = 0;
        rightArmRot = 0;
        
        leftLegY = -1.5;
        leftLegH = 12.5;
        rightLegY = -1.5;
        rightLegH = 12.5;
      } else if (frame === 2) {
        leftArmX = 3.5;
        leftArmY = -1.2;
        rightArmX = -3.5;
        rightArmY = 1.2;
        leftArmRot = 18;
        rightArmRot = -18;
        
        leftLegY = 0;
        rightLegY = -3.5;
        rightLegH = 11.5;
      } else {
        leftArmX = 0;
        leftArmY = 0;
        rightArmX = 0;
        rightArmY = 0;
        leftArmRot = 0;
        rightArmRot = 0;
        
        leftLegY = -1.5;
        leftLegH = 12.5;
        rightLegY = -1.5;
        rightLegH = 12.5;
      }
    }
  }

  // Flip horizontally based on profile aspect direction to align face vectors
  const scaleX = (currentDir === 'LEFT') ? '-1' : '1';

  return (
    <div 
      className={`relative ${sizeClassName} ${className} flex items-center justify-center`}
      style={{ 
        transform: `scaleX(${scaleX})`,
        transition: 'transform 0.12s ease-out'
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {/* Dynamic 16-bit multi-toned linear gradients */}
          <linearGradient id={grad.id} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={grad.light} />
            <stop offset="55%" stopColor={grad.main} />
            <stop offset="100%" stopColor={grad.dark} />
          </linearGradient>

          {/* 32-bit fabric overlay pattern */}
          <pattern id="fabricOverlay" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="4" y2="0" stroke="rgba(0,0,0,0.15)" strokeWidth="0.55" />
            <line x1="0" y1="0" x2="4" y2="4" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
          </pattern>

          {/* Golden chain premium shine */}
          <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ca8a04" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Core high-contrast vector gradient presets for harvesting tools */}
          <linearGradient id="axeBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="pickaxeSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="shovelScoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <style>{`
            @keyframes harvestSwingAnim {
              0% { transform: rotate(0deg); }
              15% { transform: rotate(-55deg); }
              40% { transform: rotate(45deg); }
              65% { transform: rotate(-15deg); }
              85% { transform: rotate(15deg); }
              100% { transform: rotate(0deg); }
            }
            .animate-harvest-swing {
              animation: harvestSwingAnim 0.75s ease-in-out infinite;
              transform-origin: 75px 60px;
            }
            @keyframes bobTorsoAnim {
              0%, 100% { transform: translateY(0px) scaleY(1); }
              50% { transform: translateY(1.2px) scaleY(0.98); }
            }
            @keyframes bobHeadAnim {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(1.8px) rotate(0.6deg); }
            }
            .animate-walk-bob-torso {
              animation: bobTorsoAnim 0.32s ease-in-out infinite;
              transform-origin: 50px 75px;
            }
            .animate-walk-bob-head {
              animation: bobHeadAnim 0.32s ease-in-out infinite;
              transform-origin: 50px 47px;
            }
          `}</style>
        </defs>

        {/* --- DEEP AMBIENT OCCLUSION SHADOWS --- */}
        <g opacity="0.45">
          {/* Broad anchor shadow */}
          <ellipse cx="50" cy="87" rx="19" ry="5" fill="#000000" />
          {/* Deep physical foot shadows */}
          <ellipse cx="43" cy="85.5" rx="6.5" ry="2.2" fill="#000000" />
          <ellipse cx="57" cy="85.5" rx="6.5" ry="2.2" fill="#000000" />
        </g>

        {/* --- LOWER VERTICAL ARMS & BOOTS --- */}
        <g transform={`translate(0, ${leftLegY})`}>
          <rect x="38" y="70" width="9" height={leftLegH} fill="#0f172a" rx="1.5" />
          <rect x="36" y={70 + leftLegH - 4} width="11" height="5" rx="2" fill="#0c0d0e" />
          <rect x="36" y={70 + leftLegH} width="11" height="1.5" fill="#eab308" /> {/* Gold sole strip */}
        </g>
        
        <g transform={`translate(0, ${rightLegY})`}>
          <rect x="53" y="70" width="9" height={rightLegH} fill="#0f172a" rx="1.5" />
          <rect x="52" y={70 + rightLegH - 4} width="11" height="5" rx="2" fill="#0c0d0e" />
          <rect x="52" y={70 + rightLegH} width="11" height="1.5" fill="#eab308" /> {/* Gold sole strip */}
        </g>

        {/* --- DUAL SWING ARM MATRICES --- */}
        <g transform={`translate(${leftArmX}, ${leftArmY}) rotate(${leftArmRot}, 25, 60)`}>
          <rect x="23" y="52" width="7" height="18" rx="2.5" fill={clothingHex} />
          {/* Arm seam shadow */}
          <rect x="23" y="52" width="2" height="18" fill="#ffffff" opacity="0.12" />
          <rect x="23" y="68" width="7" height="4" rx="2.5" fill={`url(#${grad.id})`} />
        </g>

        <g 
          className={harvestingType ? "animate-harvest-swing" : ""}
          transform={harvestingType ? undefined : `translate(${rightArmX}, ${rightArmY}) rotate(${rightArmRot}, 75, 60)`}
        >
          <rect x="70" y="52" width="7" height="18" rx="2.5" fill={clothingHex} />
          {/* Arm seam shadow */}
          <rect x="74" y="52" width="3" height="18" fill="#000000" opacity="0.2" />
          <rect x="70" y="68" width="7" height="4" rx="2.5" fill={`url(#${grad.id})`} />

          {/* DYNAMIC TOOL RENDER */}
          {harvestingType === 'tree' && (
             <g id="logger_axe" style={{ transformOrigin: '73.5px 70px' }}>
               {/* Axe Shaft */}
               <rect x="72" y="32" width="3" height="38" rx="1" fill="#854d0e" />
               <rect x="72" y="32" width="1" height="38" fill="#a16207" />
               <rect x="71" y="64" width="5" height="4" rx="0.5" fill="#ca8a04" />
               
               {/* Axe Head */}
               <path d="M 75 34 C 82 28, 86 24, 88 34 C 86 44, 82 40, 75 35" fill="url(#axeBladeGrad)" stroke="#1e293b" strokeWidth="0.5" />
               <path d="M 72 34 L 75 34 L 75 38 L 72 38 Z" fill="#475569" />
             </g>
          )}

          {harvestingType === 'stone' && (
             <g id="stone_pickaxe" style={{ transformOrigin: '73.5px 70px' }}>
               {/* Pickaxe Shaft */}
               <rect x="72" y="30" width="3" height="40" rx="1" fill="#78350f" />
               <rect x="72" y="30" width="1" height="40" fill="#92400e" />
               <rect x="71" y="64" width="5" height="4" rx="0.5" fill="#ca8a04" />

               {/* Pickaxe Curved Blades */}
               <path d="M 58 32 C 67 29, 72 32, 75 34 C 72 36, 67 35, 58 32 Z" fill="url(#pickaxeSteelGrad)" stroke="#0f172a" strokeWidth="0.5" />
               <path d="M 75 34 C 78 32, 83 29, 92 32 C 83 35, 78 36, 75 34 Z" fill="url(#pickaxeSteelGrad)" stroke="#0f172a" strokeWidth="0.5" />
               
               {/* Gold tip highlights */}
               <circle cx="58" cy="32" r="1.5" fill="#facc15" />
               <circle cx="92" cy="32" r="1.5" fill="#facc15" />
               
               {/* Center mount collar */}
               <rect x="71" y="32" width="5" height="4" fill="#334155" rx="0.5" />
             </g>
          )}

          {harvestingType === 'clay' && (
             <g id="clay_shovel" style={{ transformOrigin: '73.5px 70px' }}>
               {/* Shovel Shaft */}
               <rect x="72" y="28" width="3" height="42" rx="1" fill="#5c2e0b" />
               <rect x="72" y="28" width="1" height="42" fill="#7c3f12" />
               
               {/* Shovel Grip */}
               <rect x="70" y="24" width="7" height="4" rx="1" fill="url(#goldShine)" />
               <rect x="72" y="26" width="3" height="4" fill="#ca8a04" />
               
               <rect x="71" y="66" width="5" height="4" rx="1" fill="#1e293b" />
               
               {/* Spade Head (Top of shaft) */}
               <path d="M 73.5 28 L 73.5 16 C 68 18, 68 24, 73.5 28 Z" fill="url(#shovelScoopGrad)" stroke="#1e293b" strokeWidth="0.5" />
               <path d="M 73.5 28 L 73.5 16 C 79 18, 79 24, 73.5 28 Z" fill="url(#shovelScoopGrad)" stroke="#1e293b" strokeWidth="0.5" />
               <line x1="73.5" y1="18" x2="73.5" y2="28" stroke="#475569" strokeWidth="1" />
             </g>
          )}
        </g>

        {/* --- PREMIUM TORSO LAYER WITH AMBIENT SHADOWS --- */}
        <g transform={`translate(0, ${torsoY}) skewX(${torsoSkew})`}>
          <g className={isMoving ? "animate-walk-bob-torso" : ""}>
            <rect x="30" y="51" width="40" height="24" rx="5" fill={clothingHex} />
            <rect x="30" y="51" width="40" height="24" rx="5" fill="url(#fabricOverlay)" />
            {/* Edge Specular Outline */}
            <rect x="30" y="51" width="40" height="2" fill="#ffffff" opacity="0.15" />

            {/* Gold Crest Ornament and Cord sash */}
            <rect x="34" y="62" width="32" height="3.5" fill="url(#goldShine)" />
            <circle cx="50" cy="63.7" r="3.8" fill="#fcd34d" stroke="#ca8a04" strokeWidth="0.8" />

            {/* Luxury Gold Chain accessory */}
            {accessory === 'chain' && (
              currentDir !== 'UP' ? (
                <g>
                  <path d="M 36 52 Q 50 67 64 52" stroke="url(#goldShine)" strokeWidth="2.8" fill="none" />
                  <path d="M 38 52 Q 50 64 62 52" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" fill="none" opacity="0.6" />
                  <rect x="49" y="61" width="2" height="4" fill="#ca8a04" />
                  <circle cx="50" cy="66" r="4.5" fill="#fcd34d" stroke="#ca8a04" strokeWidth="1" />
                  <polygon points="50,63.5 53,66 50,68.5 47,66" fill="#ffffff" />
                </g>
              ) : (
                <path d="M 36 52 Q 50 61 64 52" stroke="url(#goldShine)" strokeWidth="2.8" fill="none" />
              )
            )}
          </g>
        </g>

        {/* --- EXPANDED TYPOGRAPHY HEAD MATRIX --- */}
        <g transform={`translate(${faceXOffset}, ${headY})`}>
          <g className={isMoving ? "animate-walk-bob-head" : ""}>
          {/* Head & Neck Base */}
          <rect x="44" y="47" width="12" height="5.5" fill={`url(#${grad.id})`} />
          <rect x="36" y="24" width="28" height="26" rx="5" fill={`url(#${grad.id})`} />

          {/* Deep Hair Occlusion onto Face */}
          {currentDir !== 'UP' && (
            <path d="M36,24 L64,24 L64,29 L36,29 Z" fill="#000000" opacity="0.25" />
          )}

          {/* Eyes with white specular sparkles */}
          {currentDir !== 'UP' && (
            <g>
              <rect x="42" y="34" width="3.5" height="3.5" fill="#ffffff" />
              <rect x="43" y="35" width="1.8" height="1.8" fill="#0c0d12" />
              <rect x="54.5" y="34" width="3.5" height="3.5" fill="#ffffff" />
              <rect x="55.5" y="35" width="1.8" height="1.8" fill="#0c0d12" />
              
              {/* Confident smile */}
              <path d="M 47,42.5 Q 50,44.5 53,42.5" stroke="#4b0f0f" strokeWidth="1.5" fill="none" />

              {/* Female eyelashes overlay if gender is Female */}
              {gender === 'Female' && (
                <g stroke="#0c0d12" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="41" y1="33" x2="43.5" y2="31" />
                  <line x1="44" y1="33" x2="46.5" y2="31" />
                  <line x1="56.5" y1="33" x2="59" y2="31" />
                  <line x1="54" y1="33" x2="51.5" y2="31" />
                </g>
              )}
            </g>
          )}

          {/* Hairstyles Geometry & Specular lines */}
          {hair === 'afro' && (
            <g>
              <g fill="#18181b">
                <circle cx="50" cy="18" r="14.5" />
                <circle cx="34" cy="24" r="10.5" />
                <circle cx="66" cy="24" r="10.5" />
                <circle cx="39" cy="16" r="12.5" />
                <circle cx="61" cy="16" r="12.5" />
              </g>
              {/* Highlight Shading */}
              <g fill="#43434b" opacity="0.45">
                <circle cx="49" cy="13" r="10" />
                <circle cx="34" cy="20" r="7.5" />
                <circle cx="66" cy="20" r="7.5" />
              </g>
              <path d="M 31 16 Q 38 10 47 12" stroke="#eab308" strokeWidth="1.5" fill="none" opacity="0.4" />
              <path d="M 69 16 Q 62 10 53 12" stroke="#eab308" strokeWidth="1.5" fill="none" opacity="0.4" />
            </g>
          )}

          {hair === 'locs' && (
            <g>
              <rect x="33" y="15" width="34" height="13" rx="4.5" fill="#2e1065" /> {/* Underlay */}
              <g fill="#1a120c">
                <rect x="28" y="22" width="7.5" height="25" rx="3.5" />
                <rect x="64.5" y="22" width="7.5" height="25" rx="3.5" />
              </g>
              {/* Individual detailed lock ridges */}
              <path d="M 28,25 L 35.5,28 M 28,31 L 35.5,34 M 28,37 L 35.5,40" stroke="#000000" strokeWidth="1.5" />
              <path d="M 64.5,25 L 72,28 M 64.5,31 L 72,34 M 64.5,37 L 72,40" stroke="#000000" strokeWidth="1.5" />
              {/* Gold bands */}
              <circle cx="31.5" cy="42" r="2.2" fill="url(#goldShine)" />
              <circle cx="68.5" cy="42" r="2.2" fill="url(#goldShine)" />
            </g>
          )}

          {hair === 'braids' && (
            <g>
              <g fill="#0e0c0d">
                <rect x="33" y="14" width="34" height="13" rx="3.5" />
                <rect x="29" y="21" width="6.5" height="26" rx="2" />
                <rect x="64.5" y="21" width="6.5" height="26" rx="2" />
              </g>
              {/* Geometric braid overlaps */}
              <path d="M29,23 L35.5,26 M29,29 L35.5,32 M29,35 L35.5,38" stroke="#374151" strokeWidth="1.5" />
              <path d="M64.5,23 L71,26 M64.5,29 L71,32 M64.5,35 L71,38" stroke="#374151" strokeWidth="1.5" />
              {/* Gold end-tips */}
              <rect x="30" y="41" width="4.5" height="4.5" fill="url(#goldShine)" rx="1" />
              <rect x="65.5" y="41" width="4.5" height="4.5" fill="url(#goldShine)" rx="1" />
            </g>
          )}

          {hair === 'fade' && (
            <g>
              <rect x="34" y="16.5" width="32" height="11" rx="4" fill="#0c0d0f" />
              <rect x="34" y="24" width="32" height="4" fill="#0c0d0f" />
              <rect x="36" y="18.5" width="28" height="3" fill="#4b5563" rx="1.5" opacity="0.6" />
              <path d="M 33,23.5 L 45,23.5" stroke="#eab308" strokeWidth="1.2" opacity="0.65" />
            </g>
          )}

          {hair === 'headwrap' && (
            <g>
              {/* A beautiful heritage patterned wrap in vibrant styling */}
              <path d="M 33,26 C 29,10, 71,10, 67,26 Z" fill="#b91c1c" />
              {/* Folds and accents */}
              <path d="M 34,21 L 66,15" stroke="url(#goldShine)" strokeWidth="2.8" />
              <path d="M 36,16 L 64,22" stroke="#1d4ed8" strokeWidth="2.8" />
              <circle cx="50" cy="11" r="3.2" fill="url(#goldShine)" />
            </g>
          )}

          {hair === 'crown-bun' && (
            <g>
              {/* Coiled crown-bun style */}
              <circle cx="50" cy="10" r="9" fill="#0e0c0d" />
              <circle cx="50" cy="10" r="7.2" stroke="url(#goldShine)" strokeWidth="1.2" fill="none" opacity="0.3" />
              <rect x="33" y="16.5" width="34" height="11.5" rx="4" fill="#0e0c0d" />
            </g>
          )}

          {hair === 'vintage-waves' && (
            <g fill="#18181b">
              {/* Retro side styled finger waves */}
              <ellipse cx="50" cy="19" rx="14" ry="10" />
              <circle cx="34" cy="26" r="7.5" />
              <circle cx="66" cy="26" r="7.5" />
              <ellipse cx="33" cy="32" rx="4.5" ry="6.5" />
              <ellipse cx="67" cy="32" rx="4.5" ry="6.5" />
              <ellipse cx="50" cy="15" rx="11" ry="5.5" fill="#43434b" opacity="0.45" />
            </g>
          )}

          {hair === 'locs-bob' && (
            <g fill="#110c08">
              {/* Short styled side locs bob */}
              <rect x="33" y="15" width="34" height="13.5" rx="4.5" />
              <rect x="30" y="21" width="6" height="15" rx="2" />
              <rect x="64" y="21" width="6" height="15" rx="2" />
              <circle cx="33" cy="36" r="2" fill="url(#goldShine)" />
              <circle cx="67" cy="36" r="2" fill="url(#goldShine)" />
            </g>
          )}

          {/* Accessory: Vintage Wire Glasses */}
          {accessory === 'glasses' && currentDir !== 'UP' && (
            <g transform={`rotate(${accessoryRot}, 50, 34)`}>
              <circle cx="44" cy="35" r="4.8" fill="#000" opacity="0.2" />
              <circle cx="56" cy="35" r="4.8" fill="#000" opacity="0.2" />
              <circle cx="44" cy="34" r="4.8" stroke="url(#goldShine)" strokeWidth="1.8" fill="rgba(255, 255, 255, 0.18)" />
              <circle cx="56" cy="34" r="4.8" stroke="url(#goldShine)" strokeWidth="1.8" fill="rgba(255, 255, 255, 0.18)" />
              <path d="M 48.8 34 Q 50 32 51.2 34" stroke="url(#goldShine)" strokeWidth="1.8" fill="none" />
              <path d="M 39.2 34 Q 37 34 36 32" stroke="url(#goldShine)" strokeWidth="1.5" fill="none" />
              <path d="M 60.8 34 Q 63 34 64 32" stroke="url(#goldShine)" strokeWidth="1.5" fill="none" />
              <line x1="42.5" y1="36" x2="45.5" y2="33" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" strokeLinecap="round" />
              <line x1="54.5" y1="36" x2="57.5" y2="33" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" strokeLinecap="round" />
            </g>
          )}

          {/* Accessory: Historical Driving Cap */}
          {accessory === 'cap' && (
            <g transform={`rotate(${accessoryRot}, 50, 23)`}>
              {/* Main fabric shape with highlights */}
              <path d="M 31 23 C 31 8, 69 8, 69 23 C 69 27, 31 27, 31 23 Z" fill="#2d2d30" stroke="#18181b" strokeWidth="1.2" />
              <path d="M 50 10 L 50 23" stroke="#3f3f46" strokeWidth="1" />
              <path d="M 40 13 L 44 23" stroke="#3f3f46" strokeWidth="1" />
              <path d="M 60 13 L 56 23" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="50" cy="10" r="2.5" fill="url(#goldShine)" />
              
              {currentDir === 'UP' ? (
                <path d="M 31 23 Q 50 21 69 23 Z" fill="#18181b" />
              ) : (
                <g>
                   <path d="M 29 23 Q 50 19 71 23 Q 73 2550 25 Q 27 25 29 23 Z" fill="#18181b" />
                   <path d="M 35 25 Q 50 28.5 65 25 L 65 27 Q 50 30.5 35 27 Z" fill="#000000" opacity="0.4" />
                </g>
              )}
            </g>
          )}
          </g>
        </g>
      </svg>
    </div>
  );
}

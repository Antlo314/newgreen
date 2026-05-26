'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';

export interface MapTile {
  x: number;
  y: number;
  type: 'grass' | 'forest_tree' | 'quarry_stone' | 'clay_deposit' | 'road_brick' | 'center_greenwood' | 'leasehold' | 'river' | 'built_business' | 'cottage' | 'landmark';
  isDirt?: boolean;
  isStump?: boolean;
  isRubble?: boolean;
  isSilt?: boolean;
  cooldownRemaining?: number;
  level?: number;
  specialization?: 'A' | 'B' | 'C' | null;
  landmarkId?: string;
  landmarkName?: string;
  businessId?: string;
}

export interface NPCState {
  id: string;
  name: string;
  x: number;
  y: number;
  npcType: 'gurley' | 'rector' | 'stradford' | 'gerumba';
  bio: string;
}

export interface DigitalApprentice {
  id: number;
  x: number;
  y: number;
  type: 'wood' | 'stone' | 'clay';
  state: 'walking' | 'harvesting' | 'idle';
  targetX: number;
  targetY: number;
  actionTimer: number;
  skin: string;
  hair: string;
  clothing: string;
}

interface MiniMapProps {
  mapGrid: MapTile[][];
  playerX: number;
  playerY: number;
  npcs: NPCState[];
  apprentices: DigitalApprentice[];
  discoveredLandmarks: string[];
  restoredLandmarks: string[];
  selectedX: number;
  selectedY: number;
  visitedCoordinates: string[];
  onSelectTile: (x: number, y: number) => void;
}

export default function MiniMap({
  mapGrid,
  playerX,
  playerY,
  npcs,
  apprentices,
  discoveredLandmarks,
  restoredLandmarks,
  selectedX,
  selectedY,
  visitedCoordinates,
  onSelectTile,
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number; tile: MapTile | null } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'legend'>('map');

  const MAP_SIZE = mapGrid.length || 64;

  const REVEAL_RADIUS = 3;

  // Calculate Fog of War revealed Set
  const exploredSet = useMemo(() => {
    const set = new Set<string>();

    // Add current player surroundings
    for (let dy = -REVEAL_RADIUS; dy <= REVEAL_RADIUS; dy++) {
      for (let dx = -REVEAL_RADIUS; dx <= REVEAL_RADIUS; dx++) {
        const ex = playerX + dx;
        const ey = playerY + dy;
        if (ex >= 0 && ex < MAP_SIZE && ey >= 0 && ey < MAP_SIZE) {
          set.add(`${ex},${ey}`);
        }
      }
    }

    // Add visited coordinates surroundings
    visitedCoordinates.forEach(coord => {
      const parts = coord.split(',');
      const vx = parseInt(parts[0], 10);
      const vy = parseInt(parts[1], 10);
      if (isNaN(vx) || isNaN(vy)) return;
      for (let dy = -REVEAL_RADIUS; dy <= REVEAL_RADIUS; dy++) {
        for (let dx = -REVEAL_RADIUS; dx <= REVEAL_RADIUS; dx++) {
          const ex = vx + dx;
          const ey = vy + dy;
          if (ex >= 0 && ex < MAP_SIZE && ey >= 0 && ey < MAP_SIZE) {
            set.add(`${ex},${ey}`);
          }
        }
      }
    });

    return set;
  }, [visitedCoordinates, playerX, playerY, MAP_SIZE]);

  const totalTiles = MAP_SIZE * MAP_SIZE;
  const exploredTileCount = exploredSet.size;
  const exploredPercentage = ((exploredTileCount / totalTiles) * 100).toFixed(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution high-contrast
    const size = 192;
    ctx.clearRect(0, 0, size, size);

    const tileSize = size / MAP_SIZE; // 192 / 64 = 3px per tile

    // Draw Terrain
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const isRevealed = exploredSet.has(`${x},${y}`);

        if (!isRevealed) {
          // Unexplored fog: deep space slate color with a faint dot pattern of grid ticks
          ctx.fillStyle = '#060608';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          
          // Draw subtle radar microgrid trace
          if ((x + y) % 6 === 0) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.04)';
            ctx.fillRect(x * tileSize + 1, y * tileSize + 1, 1, 1);
          }
          continue;
        }

        const tile = mapGrid[y]?.[x];
        if (!tile) continue;

        let color = '#022c22'; // Default dark forest co-op green

        switch (tile.type) {
          case 'grass':
            color = '#0b2e16'; // Deep grass
            break;
          case 'forest_tree':
            color = tile.isStump ? '#451a03' : '#15803d'; // Forest
            break;
          case 'quarry_stone':
            color = tile.isRubble ? '#27272a' : '#71717a'; // Stone Quarry
            break;
          case 'clay_deposit':
            color = '#b45309'; // Clay deposit
            break;
          case 'road_brick':
            color = tile.isDirt ? '#543d2c' : '#7c2d12'; // Brick highway
            break;
          case 'center_greenwood':
            color = '#450a0a'; // Central Greenwood block
            break;
          case 'river':
            color = '#1e3a8a'; // River
            break;
          case 'landmark': {
            const isRestored = restoredLandmarks.includes(tile.landmarkId || '');
            const isDiscovered = discoveredLandmarks.includes(tile.landmarkId || '');
            color = isRestored ? '#eab308' : isDiscovered ? '#ca8a04' : '#4f46e5'; // Purple/Yellow
            break;
          }
          case 'built_business':
            color = '#ea580c'; // Vibrant storefront orange
            break;
          case 'cottage':
            color = '#0d9488'; // Teal residence
            break;
          case 'leasehold':
            color = '#3f3f46'; // Grid plots
            break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Grid overlays for boundaries
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Border boundaries
    ctx.strokeRect(0, 0, size, size);

    // Draw Apprentices only if inside revealed area (Vibrant emerald green dots)
    apprentices.forEach(app => {
      if (exploredSet.has(`${app.x},${app.y}`)) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(app.x * tileSize, app.y * tileSize, tileSize, tileSize);
      }
    });

    // Draw Ancestor NPCs positions only if inside revealed area (Glowing hot pink dots with concentric blips)
    npcs.forEach(npc => {
      if (exploredSet.has(`${npc.x},${npc.y}`)) {
        const npcX = npc.x * tileSize + tileSize / 2;
        const npcY = npc.y * tileSize + tileSize / 2;

        // Radar pulse
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(npcX, npcY, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#db2777';
        ctx.fillRect(npc.x * tileSize, npc.y * tileSize, tileSize, tileSize);
      }
    });

    // Draw Selected tile crosshair (Dotted red outline)
    if (selectedX !== playerX || selectedY !== playerY) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(selectedX * tileSize - 2, selectedY * tileSize - 2, tileSize + 4, tileSize + 4);
    }

    // Draw Player positional crosshairs and blinking golden dot
    const px = playerX * tileSize + tileSize / 2;
    const py = playerY * tileSize + tileSize / 2;

    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, size);
    ctx.moveTo(0, py);
    ctx.lineTo(size, py);
    ctx.stroke();

    // Central pulsing ring
    const pulseRadius = 5 + (Math.sin(Date.now() / 150) * 1.5);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, pulseRadius), 0, Math.PI * 2);
    ctx.stroke();

    // Player marker
    ctx.fillStyle = '#facc15';
    ctx.fillRect(playerX * tileSize - 1, playerY * tileSize - 1, tileSize + 2, tileSize + 2);

  }, [mapGrid, playerX, playerY, npcs, apprentices, discoveredLandmarks, restoredLandmarks, selectedX, selectedY, MAP_SIZE, exploredSet]);

  // Support mini map animation cycles
  useEffect(() => {
    const intv = setInterval(() => {
      // Triggers redraw for pulsing player radar
      const canvas = canvasRef.current;
      if (canvas) {
        // Simple force trigger update
        canvas.style.transform = canvas.style.transform ? '' : 'scale(1)';
      }
    }, 250);
    return () => clearInterval(intv);
  }, []);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverY = e.clientY - rect.top;

    const gridX = Math.floor((hoverX / rect.width) * MAP_SIZE);
    const gridY = Math.floor((hoverY / rect.height) * MAP_SIZE);

    const safeX = Math.max(0, Math.min(MAP_SIZE - 1, gridX));
    const safeY = Math.max(0, Math.min(MAP_SIZE - 1, gridY));

    const isRevealed = exploredSet.has(`${safeX},${safeY}`);
    const tile = isRevealed ? (mapGrid[safeY]?.[safeX] || null) : null;
    setHoveredTile({ x: safeX, y: safeY, tile });
  };

  const handleCanvasMouseLeave = () => {
    setHoveredTile(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const gridX = Math.floor((clickX / rect.width) * MAP_SIZE);
    const gridY = Math.floor((clickY / rect.height) * MAP_SIZE);

    const safeX = Math.max(0, Math.min(MAP_SIZE - 1, gridX));
    const safeY = Math.max(0, Math.min(MAP_SIZE - 1, gridY));

    onSelectTile(safeX, safeY);
  };

  return (
    <div id="live_radar_minimap" className="p-4 bg-[#0a0a0d]/98 border-2 border-yellow-500/30 rounded-xl space-y-3 shadow-2xl relative overflow-hidden">
      
      {/* GLOWING AMBIENT RADAR GRID OVERLAY */}
      <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-yellow-500/5 filter blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center border-b border-yellow-500/20 pb-2">
        <div className="flex flex-col">
          <span className="text-xs font-black text-yellow-400 font-mono tracking-wider flex items-center gap-1.5 uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
            LIVE SATELLITE HUD
          </span>
          <span className="text-[7.5px] font-mono text-gray-500 font-bold uppercase tracking-widest block">
            🌌 Mapped: <span className="text-yellow-400 font-black">{exploredPercentage}%</span> ({exploredTileCount}/{totalTiles})
          </span>
        </div>
        
        <div className="flex gap-1 bg-zinc-950 p-0.5 rounded border border-white/5 text-[8px] font-mono">
          <button 
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-2 py-0.5 rounded uppercase font-black transition-all ${
              activeTab === 'map' ? 'bg-yellow-600 text-black' : 'text-gray-400'
            }`}
          >
            HUD
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('legend')}
            className={`px-2 py-0.5 rounded uppercase font-black transition-all ${
              activeTab === 'legend' ? 'bg-yellow-600 text-black' : 'text-gray-400'
            }`}
          >
            Keys
          </button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="flex flex-col items-center space-y-2">
          {/* Main Canvas Frame */}
          <div className="relative border-2 border-yellow-500/20 bg-black p-1 rounded-lg shadow-inner shadow-black group overflow-hidden">
            {/* Horizontal sweep radar line simulation */}
            <div className="absolute inset-x-0 h-0.5 bg-yellow-500/20 top-0 pointer-events-none animate-radarSweep z-10" />
            
            <canvas
              ref={canvasRef}
              width={192}
              height={192}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick}
              className="block cursor-crosshair rounded w-[192px] h-[192px] bg-emerald-950/10"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Interactive Coordinates Indicator */}
          <div className="w-full h-8 px-2.5 py-1 bg-zinc-950/90 border border-white/5 rounded-lg flex items-center justify-between text-[8px] font-mono">
            {hoveredTile ? (
              <>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="text-yellow-400">🛰️ GPS X:{hoveredTile.x} Y:{hoveredTile.y}</span>
                  <span className="text-gray-650 font-black">|</span>
                  <span className="text-white uppercase truncate max-w-[100px]">
                    {hoveredTile.tile ? hoveredTile.tile.type.replace('_', ' ') : '☁️ UNCHARTED FOG'}
                  </span>
                </div>
                {hoveredTile.tile?.landmarkId && (
                  <span className="text-purple-400 font-black select-none uppercase truncate text-[7.5px] max-w-[70px]">
                    ANCIENT SITE
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="text-yellow-500/70">📍 PLAYER: ({playerX}, {playerY})</span>
                  <span className="text-zinc-800 font-black">|</span>
                  <span className="text-gray-400 uppercase">Selected: ({selectedX}, {selectedY})</span>
                </div>
                <span className="text-gray-600 text-[7px] uppercase font-black select-none">
                  MAP: 64x64
                </span>
              </>
            )}
          </div>
          
          <p className="text-[7.5px] font-mono text-gray-500 text-center uppercase tracking-normal">
            🖱️ CLICK DIRECTLY ON SCANNER TO INSTANT JUMP PLOT INSPECTION
          </p>
        </div>
      ) : (
        <div className="p-2 bg-zinc-950/80 border border-white/5 rounded-lg text-[9px] font-mono space-y-2 h-[224px] overflow-y-auto pr-1 select-none">
          <div className="border-b border-white/5 pb-1 text-yellow-400 font-bold uppercase text-[8.5px]">GPS Color Index Keys:</div>
          <div className="grid grid-cols-2 gap-1.5 leading-normal">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#facc15] inline-block border border-white/10" />
              <span className="text-gray-300">Player Pointer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#db2777] inline-block border border-white/10" />
              <span className="text-gray-350">Elder NPC Base</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#eab308] inline-block border border-white/10" />
              <span className="text-gray-350">Site Restored</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#4f46e5] inline-block border border-white/10" />
              <span className="text-gray-350">Site Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#10b981] inline-block border border-white/10" />
              <span className="text-gray-350">Labor Apprentice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#ea580c] inline-block border border-white/10" />
              <span className="text-gray-350">Store Co-Op</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#0d9488] inline-block border border-white/10" />
              <span className="text-gray-350">Cottage Shelter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#15803d] inline-block border border-white/10" />
              <span className="text-gray-350">Forest Wood</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#71717a] inline-block border border-white/10" />
              <span className="text-gray-350">Stone Mounts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#b45309] inline-block border border-white/10" />
              <span className="text-gray-350">Clay Deposit</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2 border-b border-white/5 pb-1">
              <span className="w-2.5 h-2.5 rounded bg-[#1e3a8a] inline-block border border-white/10" />
              <span className="text-gray-350">Eastern Exodus River</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-3.5 h-2.5 rounded bg-[#060608] inline-block border border-yellow-500/20 text-[7px] text-center text-yellow-500">••</span>
              <span className="text-yellow-500/90 font-bold">Fog of War: Unexplored</span>
            </div>
          </div>
          <div className="text-[7.5px] leading-relaxed text-gray-500 border-t border-white/5 pt-1.5 mt-2">
            The telemetry tracking coordinates synchronize in real-time. Use the Mini Map to efficiently plot paths and locate resources. Fog of War obscures terrain and nodes; explore to clear the mist and claim dynamic Cartography Bonus rewards!
          </div>
        </div>
      )}
    </div>
  );
}

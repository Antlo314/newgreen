'use client';

import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, Coins, LineChart, ShieldCheck } from 'lucide-react';

interface TradingDeskProps {
  // Commodities
  wood: number;
  stone: number;
  clay: number;
  polishedPlank: number;
  reinforcedBrick: number;
  ceramics: number;
  bswx: number;
  setBswx: React.Dispatch<React.SetStateAction<number>>;
  spotPrices: {
    wood: number;
    stone: number;
    clay: number;
    polishedPlank: number;
    reinforcedBrick: number;
    ceramics: number;
  };
  handleMarketTransaction: (asset: 'wood' | 'stone' | 'clay' | 'polishedPlank' | 'reinforcedBrick' | 'ceramics', action: 'buy' | 'sell', qty: number) => void;
  
  // Co-op Shares (passed from parent for persistence)
  sharesGurl: number;
  setSharesGurl: React.Dispatch<React.SetStateAction<number>>;
  sharesShal: number;
  setSharesShal: React.Dispatch<React.SetStateAction<number>>;
  sharesSreg: number;
  setSharesSreg: React.Dispatch<React.SetStateAction<number>>;
  
  // Game metrics for index calculations
  builtBusinessesCount: number;
  reputation: number;
  weather: 'sunny' | 'rainy' | 'foggy' | 'sunset_glow';
  addLog: (msg: string) => void;
  playRetroTone: (type: 'strike' | 'success' | 'fail' | 'level', volumeMult?: number) => void;
}

export default function TradingDesk({
  wood, stone, clay, polishedPlank, reinforcedBrick, ceramics,
  bswx, setBswx, spotPrices, handleMarketTransaction,
  sharesGurl, setSharesGurl, sharesShal, setSharesShal, sharesSreg, setSharesSreg,
  builtBusinessesCount, reputation, weather, addLog, playRetroTone
}: TradingDeskProps) {
  
  const [activeTab, setActiveTab] = useState<'commodities' | 'shares'>('commodities');

  // Calculate live Co-op Stock Prices
  const getSharePrices = () => {
    // GURL (Real Estate): base 100 + built businesses * 15 + cottages * 25
    let gurlSpot = 100 + builtBusinessesCount * 12;
    // SHAL (Hospitality): base 150 + reputation * 0.4
    let shalSpot = 150 + Math.floor(reputation * 0.35);
    // SREG (Energy): base 200, highly volatile to weather
    let sregSpot = 200;
    if (weather === 'rainy') sregSpot += 45; // oil drills wet, high demand
    if (weather === 'foggy') sregSpot -= 20;

    return {
      gurl: Math.max(50, Math.round(gurlSpot)),
      shal: Math.max(50, Math.round(shalSpot)),
      sreg: Math.max(50, Math.round(sregSpot))
    };
  };

  const prices = getSharePrices();

  // Stock histories states for canvas charts
  const [gurlHistory, setGurlHistory] = useState<number[]>([100, 100, 100, 100, 100]);
  const [shalHistory, setShalHistory] = useState<number[]>([150, 150, 150, 150, 150]);
  const [sregHistory, setSregHistory] = useState<number[]>([200, 200, 200, 200, 200]);

  useEffect(() => {
    const current = getSharePrices();
    // Pre-populate with current values to avoid flatlines
    setGurlHistory(prev => [...prev.slice(-14), current.gurl]);
    setShalHistory(prev => [...prev.slice(-14), current.shal]);
    setSregHistory(prev => [...prev.slice(-14), current.sreg]);
  }, [builtBusinessesCount, reputation, weather]);

  useEffect(() => {
    const histTimer = setInterval(() => {
      const current = getSharePrices();
      setGurlHistory(prev => [...prev.slice(-14), current.gurl]);
      setShalHistory(prev => [...prev.slice(-14), current.shal]);
      setSregHistory(prev => [...prev.slice(-14), current.sreg]);
    }, 5000);
    return () => clearInterval(histTimer);
  }, [builtBusinessesCount, reputation, weather]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab !== 'shares') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw 8-bit dark grid lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 12) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Drawing helper for histories
    const drawLine = (history: number[], color: string, minVal: number, maxVal: number) => {
      if (history.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const stepX = canvas.width / 14;
      const range = maxVal - minVal || 1;
      
      history.forEach((val, index) => {
        const x = index * stepX;
        const ratio = (val - minVal) / range;
        const y = canvas.height - 6 - (ratio * (canvas.height - 12));
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw pixelated dots at joints
      ctx.fillStyle = color;
      history.forEach((val, index) => {
        const x = index * stepX;
        const ratio = (val - minVal) / range;
        const y = canvas.height - 6 - (ratio * (canvas.height - 12));
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      });
    };

    // Calculate overall min/max to fit all three series
    const allVals = [...gurlHistory, ...shalHistory, ...sregHistory];
    const minVal = Math.min(...allVals, 50) - 10;
    const maxVal = Math.max(...allVals, 250) + 10;

    drawLine(gurlHistory, '#facc15', minVal, maxVal); // GURL (Yellow)
    drawLine(shalHistory, '#10b981', minVal, maxVal); // SHAL (Emerald Green)
    drawLine(sregHistory, '#ec4899', minVal, maxVal); // SREG (Hot Pink)

  }, [activeTab, gurlHistory, shalHistory, sregHistory]);

  // Buy Share
  const buyShare = (company: 'gurl' | 'shal' | 'sreg') => {
    const price = company === 'gurl' ? prices.gurl : company === 'shal' ? prices.shal : prices.sreg;
    if (bswx < price) {
      addLog(`Fails: Awaiting BSWX reserves. Needs ${price} BSWX to acquire 1 share.`);
      playRetroTone('fail');
      return;
    }
    setBswx(prev => Number((prev - price).toFixed(2)));
    if (company === 'gurl') setSharesGurl(s => s + 1);
    if (company === 'shal') setSharesShal(s => s + 1);
    if (company === 'sreg') setSharesSreg(s => s + 1);
    addLog(`📈 Acquired 1 Share of ${company.toUpperCase()} for ${price} BSWX.`);
    playRetroTone('success');
  };

  // Sell Share
  const sellShare = (company: 'gurl' | 'shal' | 'sreg') => {
    const price = company === 'gurl' ? prices.gurl : company === 'shal' ? prices.shal : prices.sreg;
    const currentHolding = company === 'gurl' ? sharesGurl : company === 'shal' ? sharesShal : sharesSreg;
    if (currentHolding <= 0) {
      addLog(`Fails: No shares of ${company.toUpperCase()} in portfolio.`);
      playRetroTone('fail');
      return;
    }
    if (company === 'gurl') setSharesGurl(s => s - 1);
    if (company === 'shal') setSharesShal(s => s - 1);
    if (company === 'sreg') setSharesSreg(s => s - 1);
    setBswx(prev => Number((prev + price).toFixed(2)));
    addLog(`📉 Liquidated 1 Share of ${company.toUpperCase()} for ${price} BSWX.`);
    playRetroTone('success', 0.85);
  };

  // Dividends tick effect
  useEffect(() => {
    const divTimer = setInterval(() => {
      let divEarned = 0;
      if (sharesGurl > 0) divEarned += sharesGurl * 1.5;   // GURL pays 1.5 BSWX per share
      if (sharesShal > 0) divEarned += sharesShal * 2.2;   // SHAL pays 2.2 BSWX per share
      if (sharesSreg > 0) divEarned += sharesSreg * 3.0;   // SREG pays 3.0 BSWX per share

      if (divEarned > 0) {
        setBswx(prev => Number((prev + divEarned).toFixed(2)));
        addLog(`🤝 Shareholder Dividends: Received +${divEarned.toFixed(1)} BSWX from co-op holdings.`);
        playRetroTone('success', 0.4);
      }
    }, 15000); // every 15s

    return () => clearInterval(divTimer);
  }, [sharesGurl, sharesShal, sharesSreg]);

  return (
    <div className="p-3.5 bg-black/80 rounded border border-white/5 space-y-3 text-xs leading-normal">
      <div className="flex justify-between items-center border-b border-white/10 pb-2 select-none">
        <div>
          <span className="text-xs font-black text-amber-500 block uppercase tracking-wide font-mono">📈 Greenwood Exchange & Trading Desk</span>
          <span className="text-[8.5px] text-gray-400 font-sans block mt-0.5">Commodities Spot Trading & Cooperative Share Registry</span>
        </div>

        <div className="flex gap-1 bg-zinc-950 p-0.5 rounded border border-white/5 text-[8.5px] font-mono">
          <button
            onClick={() => setActiveTab('commodities')}
            className={`px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer ${
              activeTab === 'commodities' ? 'bg-amber-500 text-black' : 'text-gray-400'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('shares')}
            className={`px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer ${
              activeTab === 'shares' ? 'bg-amber-500 text-black' : 'text-gray-400'
            }`}
          >
            Co-op Stocks
          </button>
        </div>
      </div>

      {activeTab === 'commodities' ? (
        <div className="space-y-2">
          {/* Commodities pricing index */}
          <div className="p-2.5 bg-[#09090c] rounded border border-white/5 text-[9px] text-gray-305 leading-normal font-sans">
            Weather conditions heavily dictate resource prices: 
            {weather === 'sunny' && <span className="text-amber-400"> Sunny heat dries clay up, driving Clay spot prices up (+30%)!</span>}
            {weather === 'rainy' && <span className="text-sky-400"> Rain makes stone quarrying risky, driving Stone spot prices up!</span>}
            {weather === 'foggy' && <span className="text-zinc-400"> Fog blocks distribution lines. All resources cost 25% premium.</span>}
            {weather === 'sunset_glow' && <span className="text-rose-400"> Golden Sunset increases local building demand, spiking Planks & Bricks sell value!</span>}
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
            {[
              { id: 'wood', label: '🌲 Wood Logs', qty: wood, spot: spotPrices.wood },
              { id: 'stone', label: '⛰️ Stone Ore', qty: stone, spot: spotPrices.stone },
              { id: 'clay', label: '🏺 Silt Clay', qty: clay, spot: spotPrices.clay },
              { id: 'polishedPlank', label: '🪵 Polished Planks', qty: polishedPlank, spot: spotPrices.polishedPlank },
              { id: 'reinforcedBrick', label: '🧱 Reinforced Bricks', qty: reinforcedBrick, spot: spotPrices.reinforcedBrick },
              { id: 'ceramics', label: '🏺 Fine Ceramics', qty: ceramics, spot: spotPrices.ceramics }
            ].map(item => {
              const buyPrice = Math.round(item.spot * 1.25 * 10) / 10;
              const sellPrice = Math.round(item.spot * 0.95 * 10) / 10;
              return (
                <div key={item.id} className="p-2 bg-zinc-950 border border-white/5 rounded flex justify-between items-center text-[10px] font-mono">
                  <div className="text-left">
                    <span className="text-white font-extrabold block">{item.label}</span>
                    <span className="text-gray-500 text-[8px] block">Holding: {item.qty}x | Spot: {item.spot} BSWX</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <button
                      onClick={() => handleMarketTransaction(item.id as any, 'sell', 1)}
                      disabled={item.qty < 1}
                      className="px-2 py-0.5 bg-red-900/60 hover:bg-red-800 disabled:opacity-40 text-white rounded text-[8px] font-bold uppercase transition-all"
                    >
                      Sell 1 (+{sellPrice} B)
                    </button>
                    <button
                      onClick={() => handleMarketTransaction(item.id as any, 'buy', 1)}
                      disabled={bswx < buyPrice}
                      className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded text-[8px] font-bold uppercase transition-all"
                    >
                      Buy 1 (-{buyPrice} B)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Dynamic canvas stock index history */}
          <div className="p-2 bg-[#09090c] rounded border border-white/5 flex flex-col items-center gap-1.5 relative overflow-hidden">
            <span className="text-[8px] text-gray-400 font-mono self-start uppercase tracking-wider">📈 LIVE CO-OP TRAJECTORY (GURL: Yellow | SHAL: Green | SREG: Pink)</span>
            <canvas
              ref={canvasRef}
              width={260}
              height={70}
              className="bg-black/90 rounded border border-zinc-900 w-full h-[70px] block"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          <div className="p-2.5 bg-zinc-950/80 rounded border border-[#22c55e]/25 text-[9px] text-gray-300 leading-normal flex items-start gap-2 shadow-inner">
            <ShieldCheck size={12} className="text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Invest in communal Greenwood Corporations to build shared wealth. Shares fluctuate based on built infrastructure and pay **BSWX Dividends** directly to your ledger balance every 15 seconds!
            </p>
          </div>

          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-0.5">
            {/* GURL */}
            <div className="p-2 bg-zinc-950 border border-white/5 rounded flex justify-between items-center text-[10px] font-mono">
              <div>
                <span className="text-white font-bold block">🏠 O.W. Gurley Real Estate (GURL)</span>
                <span className="text-gray-500 text-[8px] block mt-0.5">Holding: <strong className="text-yellow-500">{sharesGurl}x</strong> | Cost: {prices.gurl} BSWX | Div: +1.5 BSWX/15s</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => sellShare('gurl')} disabled={sharesGurl <= 0} className="px-2 py-1 bg-red-900/60 hover:bg-red-800 disabled:opacity-45 text-white rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer">SELL</button>
                <button onClick={() => buyShare('gurl')} disabled={bswx < prices.gurl} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-650 disabled:opacity-45 text-white rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer">BUY</button>
              </div>
            </div>

            {/* SHAL */}
            <div className="p-2 bg-zinc-950 border border-white/5 rounded flex justify-between items-center text-[10px] font-mono">
              <div>
                <span className="text-white font-bold block">🏨 Stradford Luxury Hotels (SHAL)</span>
                <span className="text-gray-500 text-[8px] block mt-0.5">Holding: <strong className="text-yellow-500">{sharesShal}x</strong> | Cost: {prices.shal} BSWX | Div: +2.2 BSWX/15s</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => sellShare('shal')} disabled={sharesShal <= 0} className="px-2 py-1 bg-red-900/60 hover:bg-red-800 disabled:opacity-45 text-white rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer">SELL</button>
                <button onClick={() => buyShare('shal')} disabled={bswx < prices.shal} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-650 disabled:opacity-45 text-white rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer">BUY</button>
              </div>
            </div>

            {/* SREG */}
            <div className="p-2 bg-zinc-950 border border-white/5 rounded flex justify-between items-center text-[10px] font-mono">
              <div>
                <span className="text-white font-bold block">🛢️ Sarah Rector Energy Group (SREG)</span>
                <span className="text-gray-500 text-[8px] block mt-0.5">Holding: <strong className="text-yellow-500">{sharesSreg}x</strong> | Cost: {prices.sreg} BSWX | Div: +3.0 BSWX/15s</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => sellShare('sreg')} disabled={sharesSreg <= 0} className="px-2 py-1 bg-red-900/60 hover:bg-red-800 disabled:opacity-45 text-white rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer">SELL</button>
                <button onClick={() => buyShare('sreg')} disabled={bswx < prices.sreg} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-650 disabled:opacity-45 text-white rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer">BUY</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Candle, SupportResistanceZone, SwingPoint, Timeframe, PivotLevels } from '../../types';

function clusterLevels(levels: number[], atr: number, timeframe: Timeframe): SupportResistanceZone[] {
  if (levels.length === 0) return [];
  const tolerance = atr * 0.5;
  const sorted = [...levels].sort((a, b) => a - b);
  const zones: SupportResistanceZone[] = [];
  let cluster: number[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - cluster[cluster.length - 1] <= tolerance) {
      cluster.push(sorted[i]);
    } else {
      zones.push({
        low: cluster[0] * (1 - 0.0005),
        high: cluster[cluster.length - 1] * (1 + 0.0005),
        strength: Math.min(cluster.length / 5, 1),
        touchCount: cluster.length,
        timeframe,
        lastTouchTimestamp: Date.now(),
        broken: false,
      });
      cluster = [sorted[i]];
    }
  }
  if (cluster.length > 0) {
    zones.push({
      low: cluster[0] * (1 - 0.0005),
      high: cluster[cluster.length - 1] * (1 + 0.0005),
      strength: Math.min(cluster.length / 5, 1),
      touchCount: cluster.length,
      timeframe,
      lastTouchTimestamp: Date.now(),
      broken: false,
    });
  }
  return zones;
}

export function buildZones(
  candles: Candle[],
  swingPoints: SwingPoint[],
  pivotLevels: PivotLevels,
  timeframe: Timeframe,
  atr: number
): { support: SupportResistanceZone[]; resistance: SupportResistanceZone[] } {
  const currentPrice = candles[candles.length - 1].close;
  
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];
  
  swingPoints.forEach(sp => {
    if (sp.type === 'low' && sp.price < currentPrice) supportLevels.push(sp.price);
    if (sp.type === 'high' && sp.price > currentPrice) resistanceLevels.push(sp.price);
  });
  
  const pivotValues = [pivotLevels.pp, pivotLevels.r1, pivotLevels.r2, pivotLevels.r3, pivotLevels.s1, pivotLevels.s2, pivotLevels.s3];
  pivotValues.forEach(v => {
    if (v < currentPrice) supportLevels.push(v);
    else resistanceLevels.push(v);
  });
  
  const recent = candles.slice(-20);
  const prevHighs = recent.map(c => c.high);
  const prevLows = recent.map(c => c.low);
  prevHighs.forEach(v => { if (v > currentPrice) resistanceLevels.push(v); });
  prevLows.forEach(v => { if (v < currentPrice) supportLevels.push(v); });
  
  const support = clusterLevels(supportLevels, atr, timeframe).slice(-4);
  const resistance = clusterLevels(resistanceLevels, atr, timeframe).slice(0, 4);
  
  support.forEach(z => { if (currentPrice < z.low) z.broken = true; });
  resistance.forEach(z => { if (currentPrice > z.high) z.broken = true; });
  
  return { support, resistance };
}

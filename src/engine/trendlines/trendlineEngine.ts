import { Candle, SwingPoint, Trendline } from '../../types';

function projectPrice(tl: { point1: { timestamp: number; price: number }; point2: { timestamp: number; price: number } }, timestamp: number): number {
  const slope = (tl.point2.price - tl.point1.price) / (tl.point2.timestamp - tl.point1.timestamp);
  return tl.point1.price + slope * (timestamp - tl.point1.timestamp);
}

function countTouches(candles: Candle[], p1: { timestamp: number; price: number }, p2: { timestamp: number; price: number }, atr: number): number {
  let count = 0;
  const tolerance = atr * 0.3;
  for (const c of candles) {
    const projected = projectPrice({ point1: p1, point2: p2 }, c.timestamp);
    if (Math.abs(c.low - projected) <= tolerance || Math.abs(c.high - projected) <= tolerance) count++;
  }
  return count;
}

function isLineBroken(candles: Candle[], p1: { timestamp: number; price: number }, p2: { timestamp: number; price: number }, type: 'support' | 'resistance', atr: number): boolean {
  const lastFew = candles.slice(-3);
  const penetrationThreshold = atr * 0.2;
  let penetrations = 0;
  for (const c of lastFew) {
    const projected = projectPrice({ point1: p1, point2: p2 }, c.timestamp);
    if (type === 'support' && c.close < projected - penetrationThreshold) penetrations++;
    if (type === 'resistance' && c.close > projected + penetrationThreshold) penetrations++;
  }
  return penetrations >= 2;
}

function calculateTrendlineScore(touches: number, broken: boolean, candles: Candle[], p1: { timestamp: number; price: number }, p2: { timestamp: number; price: number }, atr: number, currentTimestamp: number): number {
  if (broken) return 0;
  let score = 0;
  score += Math.min(touches * 15, 45);
  if (touches >= 3) score += 20;
  let bodyPenetrations = 0;
  const tolerance = atr * 0.2;
  for (const c of candles) {
    const projected = projectPrice({ point1: p1, point2: p2 }, c.timestamp);
    const bodyLow = Math.min(c.open, c.close);
    const bodyHigh = Math.max(c.open, c.close);
    if (bodyLow < projected - tolerance || bodyHigh > projected + tolerance) bodyPenetrations++;
  }
  const cleanScore = Math.max(0, 20 - bodyPenetrations);
  score += cleanScore;
  const currentPrice = projectPrice({ point1: p1, point2: p2 }, currentTimestamp);
  const lastClose = candles[candles.length - 1].close;
  const distanceRatio = Math.abs(lastClose - currentPrice) / lastClose;
  if (distanceRatio < 0.02) score += 15;
  else if (distanceRatio < 0.05) score += 8;
  return score;
}

export function detectTrendlines(candles: Candle[], swingPoints: SwingPoint[], atr: number): Trendline[] {
  const trendlines: Trendline[] = [];
  const swingHighs = swingPoints.filter(s => s.type === 'high').slice(-8);
  const swingLows = swingPoints.filter(s => s.type === 'low').slice(-8);
  const currentTimestamp = candles[candles.length - 1].timestamp;
  
  for (let i = 0; i < swingHighs.length - 1; i++) {
    for (let j = i + 1; j < swingHighs.length; j++) {
      const p1 = { timestamp: swingHighs[i].timestamp, price: swingHighs[i].price };
      const p2 = { timestamp: swingHighs[j].timestamp, price: swingHighs[j].price };
      const slope = (p2.price - p1.price) / (p2.timestamp - p1.timestamp);
      if (slope >= 0) continue;
      const touches = countTouches(candles, p1, p2, atr);
      const currentPrice = projectPrice({ point1: p1, point2: p2 }, currentTimestamp);
      const broken = isLineBroken(candles, p1, p2, 'resistance', atr);
      const score = calculateTrendlineScore(touches, broken, candles, p1, p2, atr, currentTimestamp);
      if (score > 20) {
        trendlines.push({ id: `dn-${i}-${j}`, type: 'resistance', point1: p1, point2: p2, touchCount: touches, score, currentPrice, broken });
      }
    }
  }
  
  for (let i = 0; i < swingLows.length - 1; i++) {
    for (let j = i + 1; j < swingLows.length; j++) {
      const p1 = { timestamp: swingLows[i].timestamp, price: swingLows[i].price };
      const p2 = { timestamp: swingLows[j].timestamp, price: swingLows[j].price };
      const slope = (p2.price - p1.price) / (p2.timestamp - p1.timestamp);
      if (slope <= 0) continue;
      const touches = countTouches(candles, p1, p2, atr);
      const currentPrice = projectPrice({ point1: p1, point2: p2 }, currentTimestamp);
      const broken = isLineBroken(candles, p1, p2, 'support', atr);
      const score = calculateTrendlineScore(touches, broken, candles, p1, p2, atr, currentTimestamp);
      if (score > 20) {
        trendlines.push({ id: `up-${i}-${j}`, type: 'support', point1: p1, point2: p2, touchCount: touches, score, currentPrice, broken });
      }
    }
  }
  
  return trendlines.sort((a, b) => b.score - a.score).slice(0, 4);
}

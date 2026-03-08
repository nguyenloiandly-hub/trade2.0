import { SupportResistanceZone, EntryPlan } from '../../types';

export function calculateRisk(
  direction: 'LONG' | 'SHORT',
  currentPrice: number,
  atr: number,
  supportZones: SupportResistanceZone[],
  resistanceZones: SupportResistanceZone[],
  swingLow: number,
  swingHigh: number
): EntryPlan | null {
  const slBuffer = atr * 0.6;
  
  if (direction === 'LONG') {
    const nearestSupport = supportZones.filter(z => !z.broken && z.high <= currentPrice)
      .sort((a, b) => b.high - a.high)[0];
    
    const zoneLow = nearestSupport ? nearestSupport.low : swingLow;
    const sl = Math.min(zoneLow, swingLow) - slBuffer;
    const entryZone: [number, number] = [currentPrice, currentPrice + atr * 0.3];
    const triggerPrice = currentPrice + atr * 0.1;
    
    const resistanceLevels = resistanceZones
      .filter(z => !z.broken && z.low > currentPrice)
      .sort((a, b) => a.low - b.low);
    
    const tp1 = resistanceLevels[0] ? resistanceLevels[0].low : currentPrice + atr * 2;
    const tp2 = resistanceLevels[1] ? resistanceLevels[1].low : currentPrice + atr * 3;
    const tp3 = currentPrice + (currentPrice - sl) * 2;
    const rr = (tp1 - triggerPrice) / (triggerPrice - sl);
    
    if (rr < 1.2) return null;
    
    return { direction, entryZone, triggerPrice, stopLoss: sl, takeProfit: [tp1, tp2, tp3], rr: Math.round(rr * 10) / 10 };
  } else {
    const nearestResistance = resistanceZones.filter(z => !z.broken && z.low >= currentPrice)
      .sort((a, b) => a.low - b.low)[0];
    
    const zoneHigh = nearestResistance ? nearestResistance.high : swingHigh;
    const sl = Math.max(zoneHigh, swingHigh) + slBuffer;
    const entryZone: [number, number] = [currentPrice - atr * 0.3, currentPrice];
    const triggerPrice = currentPrice - atr * 0.1;
    
    const supportLevels = supportZones
      .filter(z => !z.broken && z.high < currentPrice)
      .sort((a, b) => b.high - a.high);
    
    const tp1 = supportLevels[0] ? supportLevels[0].high : currentPrice - atr * 2;
    const tp2 = supportLevels[1] ? supportLevels[1].high : currentPrice - atr * 3;
    const tp3 = currentPrice - (sl - currentPrice) * 2;
    const rr = (triggerPrice - tp1) / (sl - triggerPrice);
    
    if (rr < 1.2) return null;
    
    return { direction, entryZone, triggerPrice, stopLoss: sl, takeProfit: [tp1, tp2, tp3], rr: Math.round(rr * 10) / 10 };
  }
}

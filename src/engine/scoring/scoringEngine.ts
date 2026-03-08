import { Candle, CandlePattern, SupportResistanceZone, TimeframeScore, Timeframe, Trendline } from '../../types';
import { TrendAnalysis } from '../marketStructure/trend';
import { getLatestRSI } from '../indicators/rsi';
import { calculateMACD } from '../indicators/macd';

export function scoreTimeframe(
  timeframe: Timeframe,
  candles: Candle[],
  trend: TrendAnalysis,
  supportZones: SupportResistanceZone[],
  resistanceZones: SupportResistanceZone[],
  patterns: CandlePattern[],
  trendlines: Trendline[],
  atr: number
): TimeframeScore {
  const currentPrice = candles[candles.length - 1].close;
  
  let bullTrend = 0, bearTrend = 0;
  if (trend.state === 'uptrend') { bullTrend += 20; if (trend.bosDetected) bullTrend += 10; }
  else if (trend.state === 'downtrend') { bearTrend += 20; if (trend.bosDetected) bearTrend += 10; }
  else { bullTrend += 5; bearTrend += 5; }
  
  let bullZone = 0, bearZone = 0;
  const nearestSupport = supportZones.filter(z => !z.broken).sort((a, b) => b.high - a.high)[0];
  const nearestResistance = resistanceZones.filter(z => !z.broken).sort((a, b) => a.low - b.low)[0];
  
  if (nearestSupport) {
    const distToSupport = currentPrice - nearestSupport.high;
    if (distToSupport >= 0 && distToSupport <= atr * 0.5) bullZone += 15 * nearestSupport.strength;
    else if (distToSupport >= 0 && distToSupport <= atr * 1.0) bullZone += 8 * nearestSupport.strength;
  }
  if (nearestResistance) {
    const distToResistance = nearestResistance.low - currentPrice;
    if (distToResistance >= 0 && distToResistance <= atr * 0.5) bearZone += 15 * nearestResistance.strength;
    else if (distToResistance >= 0 && distToResistance <= atr * 1.0) bearZone += 8 * nearestResistance.strength;
  }
  const allSupports = supportZones.filter(z => !z.broken);
  const allResistances = resistanceZones.filter(z => !z.broken);
  if (allSupports.length > 0 && allResistances.length > 0) {
    const lowestResistance = Math.min(...allResistances.map(z => z.low));
    const highestSupport = Math.max(...allSupports.map(z => z.high));
    const rangeSize = lowestResistance - highestSupport;
    if (rangeSize > 0) {
      const posInRange = (currentPrice - highestSupport) / rangeSize;
      if (posInRange > 0.3 && posInRange < 0.7) { bullZone -= 5; bearZone -= 5; }
    }
  }
  
  let bullPattern = 0, bearPattern = 0;
  patterns.forEach(p => {
    if (p.direction === 'bullish') bullPattern += p.strength * 20;
    else if (p.direction === 'bearish') bearPattern += p.strength * 20;
  });
  bullPattern = Math.min(bullPattern, 20);
  bearPattern = Math.min(bearPattern, 20);
  
  let bullTrendline = 0, bearTrendline = 0;
  trendlines.forEach(tl => {
    const dist = Math.abs(currentPrice - tl.currentPrice);
    if (dist <= atr * 0.5 && !tl.broken) {
      if (tl.type === 'support') bullTrendline += 5;
      else bearTrendline += 5;
    }
  });
  bullTrendline = Math.min(bullTrendline, 10);
  bearTrendline = Math.min(bearTrendline, 10);
  
  let bullMomentum = 0, bearMomentum = 0;
  const rsi = getLatestRSI(candles);
  const macd = calculateMACD(candles);
  if (rsi > 55) bullMomentum += 5; else if (rsi < 45) bearMomentum += 5;
  if (macd) {
    if (macd.histogram > 0) bullMomentum += 5; else bearMomentum += 5;
  }
  
  let bullVolatility = 5, bearVolatility = 5;
  if (atr > 0 && currentPrice > 0) {
    const atrPct = atr / currentPrice;
    if (atrPct > 0.005 && atrPct < 0.05) { bullVolatility = 10; bearVolatility = 10; }
    else if (atrPct < 0.002) { bullVolatility = 0; bearVolatility = 0; }
  }
  
  const bullScore = Math.max(0, Math.min(100, bullTrend + bullZone + bullPattern + bullTrendline + bullMomentum + bullVolatility));
  const bearScore = Math.max(0, Math.min(100, bearTrend + bearZone + bearPattern + bearTrendline + bearMomentum + bearVolatility));
  
  return {
    timeframe,
    bullScore,
    bearScore,
    trendState: trend.state,
    details: {
      trendScore: bullTrend - bearTrend,
      zoneScore: bullZone - bearZone,
      patternScore: bullPattern - bearPattern,
      trendlineScore: bullTrendline - bearTrendline,
      momentumScore: bullMomentum - bearMomentum,
      volatilityScore: bullVolatility,
    },
  };
}

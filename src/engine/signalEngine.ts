import { Candle, Timeframe, SignalOutput, SentimentSummary, SupportResistanceZone } from '../types';
import { getLatestATR } from './indicators/atr';
import { calculatePivotPoints } from './indicators/pivot';
import { detectSwingPoints } from './marketStructure/swingPoints';
import { analyzeTrend } from './marketStructure/trend';
import { buildZones } from './zones/zoneEngine';
import { detectPatterns } from './patterns/candlePatterns';
import { detectTrendlines } from './trendlines/trendlineEngine';
import { scoreTimeframe } from './scoring/scoringEngine';
import { aggregateMTF } from './aggregation/mtfAggregation';
import { validateEntry } from './entry/entryEngine';
import { calculateRisk } from './risk/riskEngine';
import { calculateConfidence } from './confidence/confidenceEngine';

export function runSignalEngine(
  symbol: string,
  candlesByTF: Partial<Record<Timeframe, Candle[]>>,
  sentiment: SentimentSummary,
  timeframeMode: 'intraday' | 'swing' = 'intraday'
): SignalOutput {
  const availableTFs = Object.keys(candlesByTF) as Timeframe[];
  if (availableTFs.length === 0) throw new Error('No candle data provided');
  
  const primaryTF: Timeframe = availableTFs.includes('15m') ? '15m' : availableTFs[0];
  const primaryCandles = candlesByTF[primaryTF]!;
  const currentPrice = primaryCandles[primaryCandles.length - 1].close;
  const atr = getLatestATR(primaryCandles);
  
  const dailyCandles = candlesByTF['1d'] || primaryCandles;
  const prevDailyCandle = dailyCandles[dailyCandles.length - 2] || dailyCandles[dailyCandles.length - 1];
  const pivotLevels = calculatePivotPoints(prevDailyCandle);
  
  const allPatterns: ReturnType<typeof detectPatterns> = [];
  const allSupportZones: SupportResistanceZone[] = [];
  const allResistanceZones: SupportResistanceZone[] = [];
  const allTrendlines: ReturnType<typeof detectTrendlines> = [];
  const tfScores: ReturnType<typeof scoreTimeframe>[] = [];
  
  availableTFs.forEach(tf => {
    const candles = candlesByTF[tf]!;
    const tfATR = getLatestATR(candles);
    const swingPoints = detectSwingPoints(candles);
    const { support, resistance } = buildZones(candles, swingPoints, pivotLevels, tf, tfATR || atr);
    allSupportZones.push(...support);
    allResistanceZones.push(...resistance);
  });
  
  const mergedSupport = mergeZones(allSupportZones, currentPrice, 'support');
  const mergedResistance = mergeZones(allResistanceZones, currentPrice, 'resistance');
  
  availableTFs.forEach(tf => {
    const candles = candlesByTF[tf]!;
    const tfATR = getLatestATR(candles) || atr;
    const swingPoints = detectSwingPoints(candles);
    const trend = analyzeTrend(candles);
    const patterns = detectPatterns(candles, tf, mergedSupport, mergedResistance, tfATR);
    const trendlines = detectTrendlines(candles, swingPoints, tfATR);
    
    allPatterns.push(...patterns);
    allTrendlines.push(...trendlines);
    
    const score = scoreTimeframe(tf, candles, trend, mergedSupport, mergedResistance, patterns, trendlines, tfATR);
    tfScores.push(score);
  });
  
  const { longPercent, shortPercent } = aggregateMTF(tfScores);
  
  const marketBias: 'LONG' | 'SHORT' | 'NEUTRAL' =
    longPercent >= 55 ? 'LONG' : shortPercent >= 55 ? 'SHORT' : 'NEUTRAL';
  
  const primaryTrend = analyzeTrend(primaryCandles);
  const swingHighs = primaryTrend.swingHighs;
  const swingLows = primaryTrend.swingLows;
  const swingHighPrice = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1].price : currentPrice * 1.02;
  const swingLowPrice = swingLows.length > 0 ? swingLows[swingLows.length - 1].price : currentPrice * 0.98;
  
  const { direction: entryDirection, reason: entryReasons } = validateEntry(
    currentPrice, atr, tfScores, mergedSupport, mergedResistance, allPatterns, longPercent, shortPercent
  );
  
  let entryPlan = null;
  let confidence = 50;
  const warnings: string[] = [];
  const reasons: string[] = [...entryReasons];
  
  if (entryDirection) {
    entryPlan = calculateRisk(
      entryDirection, currentPrice, atr, mergedSupport, mergedResistance, swingLowPrice, swingHighPrice
    );
    
    if (entryPlan) {
      confidence = calculateConfidence(
        tfScores, mergedSupport, mergedResistance, allPatterns, sentiment,
        longPercent, entryDirection, entryPlan.rr, atr, currentPrice
      );
    } else {
      warnings.push('Invalid RR (< 1.2), signal not emitted');
    }
  }
  
  const atrPct = atr / currentPrice;
  if (atrPct < 0.002) warnings.push('ATR too low - tight sideways market');
  if (sentiment.bias !== 'neutral') {
    if ((marketBias === 'LONG' && sentiment.bias === 'bearish') ||
        (marketBias === 'SHORT' && sentiment.bias === 'bullish')) {
      warnings.push('News sentiment contradicts technical signal');
    }
  }
  
  const topTrendlines = allTrendlines.sort((a, b) => b.score - a.score).slice(0, 4);
  
  return {
    symbol,
    timeframeMode,
    marketBias,
    longPercent,
    shortPercent,
    confidence,
    supportZones: mergedSupport,
    resistanceZones: mergedResistance,
    pivotLevels,
    patterns: allPatterns.sort((a, b) => b.strength - a.strength).slice(0, 5),
    trendlines: topTrendlines,
    timeframeScores: tfScores,
    entryPlan: entryPlan || null,
    sentiment,
    reasons,
    warnings,
    timestamp: Date.now(),
    currentPrice,
    atr,
  };
}

function mergeZones(zones: SupportResistanceZone[], currentPrice: number, type: 'support' | 'resistance'): SupportResistanceZone[] {
  const sorted = [...zones].sort((a, b) => a.low - b.low);
  const merged: SupportResistanceZone[] = [];
  
  for (const z of sorted) {
    const existing = merged.find(m => Math.abs((m.low + m.high) / 2 - (z.low + z.high) / 2) < (m.high - m.low) * 2 + 50);
    if (existing) {
      existing.low = Math.min(existing.low, z.low);
      existing.high = Math.max(existing.high, z.high);
      existing.touchCount += z.touchCount;
      existing.strength = Math.min(existing.strength + z.strength * 0.3, 1);
    } else {
      merged.push({ ...z });
    }
  }
  
  if (type === 'support') {
    return merged.filter(z => z.high <= currentPrice * 1.01).sort((a, b) => b.high - a.high).slice(0, 4);
  } else {
    return merged.filter(z => z.low >= currentPrice * 0.99).sort((a, b) => a.low - b.low).slice(0, 4);
  }
}

import { TimeframeScore, SupportResistanceZone, CandlePattern, SentimentSummary } from '../../types';

export function calculateConfidence(
  tfScores: TimeframeScore[],
  supportZones: SupportResistanceZone[],
  resistanceZones: SupportResistanceZone[],
  patterns: CandlePattern[],
  sentiment: SentimentSummary,
  longPercent: number,
  direction: 'LONG' | 'SHORT',
  rr: number,
  atr: number,
  currentPrice: number
): number {
  const signalScore = direction === 'LONG' ? longPercent : 100 - longPercent;
  let confidence = signalScore * 0.8;
  
  const agreementCount = direction === 'LONG'
    ? tfScores.filter(s => s.bullScore > s.bearScore + 5).length
    : tfScores.filter(s => s.bearScore > s.bullScore + 5).length;
  confidence += agreementCount * 2;
  
  const relevantZones = direction === 'LONG' ? supportZones : resistanceZones;
  const strongZone = relevantZones.filter(z => !z.broken && z.strength > 0.6).length > 0;
  if (strongZone) confidence += 6;
  
  const strongPatterns = patterns.filter(p =>
    ((direction === 'LONG' && p.direction === 'bullish') || (direction === 'SHORT' && p.direction === 'bearish')) && p.strength > 0.7
  );
  if (strongPatterns.length > 0) confidence += 4;
  
  if (rr >= 2.0) confidence += 4;
  else if (rr >= 1.5) confidence += 2;
  
  if (sentiment.bias === (direction === 'LONG' ? 'bullish' : 'bearish')) confidence += 5;
  else if (sentiment.bias === (direction === 'LONG' ? 'bearish' : 'bullish')) confidence -= 5;
  
  const higherTFAgainst = tfScores.filter(s =>
    ['4h', '6h', '8h', '12h', '1d'].includes(s.timeframe) &&
    ((direction === 'LONG' && s.bearScore > s.bullScore + 10) || (direction === 'SHORT' && s.bullScore > s.bearScore + 10))
  ).length;
  confidence -= higherTFAgainst * 8;
  
  const atrPct = atr / currentPrice;
  if (atrPct < 0.002) confidence -= 15;
  
  return Math.max(0, Math.min(99, Math.round(confidence)));
}

import { SupportResistanceZone, CandlePattern, TimeframeScore, Timeframe } from '../../types';

const HIGHER_TFS: Timeframe[] = ['4h', '6h', '8h', '12h', '1d'];

export function validateEntry(
  currentPrice: number,
  atr: number,
  tfScores: TimeframeScore[],
  supportZones: SupportResistanceZone[],
  resistanceZones: SupportResistanceZone[],
  patterns: CandlePattern[],
  longPercent: number,
  shortPercent: number
): { direction: 'LONG' | 'SHORT' | null; reason: string[] } {
  const reasons: string[] = [];
  
  const higherTFScores = tfScores.filter(s => HIGHER_TFS.includes(s.timeframe));
  
  const htfBullish = higherTFScores.filter(s => s.bullScore > s.bearScore + 10).length;
  const htfBearish = higherTFScores.filter(s => s.bearScore > s.bullScore + 10).length;
  
  const nearestSupport = supportZones.filter(z => !z.broken)
    .sort((a, b) => b.high - a.high)[0];
  const nearestResistance = resistanceZones.filter(z => !z.broken)
    .sort((a, b) => a.low - b.low)[0];
  
  const nearSupport = nearestSupport !== undefined && (currentPrice - nearestSupport.high) <= atr * 0.5;
  const nearResistance = nearestResistance !== undefined && (nearestResistance.low - currentPrice) <= atr * 0.5;
  
  const bullishPatterns = patterns.filter(p => p.direction === 'bullish' && p.strength > 0.5);
  const bearishPatterns = patterns.filter(p => p.direction === 'bearish' && p.strength > 0.5);
  
  if (htfBullish >= 2 && nearSupport && bullishPatterns.length > 0 && longPercent > 55) {
    higherTFScores.filter(s => s.bullScore > s.bearScore).forEach(s => {
      reasons.push(`${s.timeframe} bullish (${s.bullScore}/${s.bearScore})`);
    });
    if (nearestSupport) reasons.push(`Gần support zone ${nearestSupport.low.toFixed(2)}-${nearestSupport.high.toFixed(2)}`);
    reasons.push(`Pattern: ${bullishPatterns.map(p => p.name).join(', ')}`);
    return { direction: 'LONG', reason: reasons };
  }
  
  if (htfBearish >= 2 && nearResistance && bearishPatterns.length > 0 && shortPercent > 55) {
    higherTFScores.filter(s => s.bearScore > s.bullScore).forEach(s => {
      reasons.push(`${s.timeframe} bearish (${s.bearScore}/${s.bullScore})`);
    });
    if (nearestResistance) reasons.push(`Gần resistance zone ${nearestResistance.low.toFixed(2)}-${nearestResistance.high.toFixed(2)}`);
    reasons.push(`Pattern: ${bearishPatterns.map(p => p.name).join(', ')}`);
    return { direction: 'SHORT', reason: reasons };
  }
  
  return { direction: null, reason: ['Không đủ điều kiện vào lệnh'] };
}

import { Candle } from '../../types';

export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) return [];
  const closes = candles.map(c => c.close);
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(Math.max(diff, 0));
    losses.push(Math.max(-diff, 0));
  }
  const rsiValues: number[] = [];
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues.push(100 - 100 / (1 + rs));
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + rs2));
  }
  return rsiValues;
}

export function getLatestRSI(candles: Candle[], period: number = 14): number {
  const vals = calculateRSI(candles, period);
  return vals.length > 0 ? vals[vals.length - 1] : 50;
}

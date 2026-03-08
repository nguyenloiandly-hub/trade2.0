import { Candle } from '../../types';

export function calculateEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const emas: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  emas.push(sum / period);
  for (let i = period; i < values.length; i++) {
    emas.push(values[i] * k + emas[emas.length - 1] * (1 - k));
  }
  return emas;
}

export function getEMAAt(candles: Candle[], period: number, offsetFromEnd: number = 0): number {
  const closes = candles.map(c => c.close);
  const emas = calculateEMA(closes, period);
  if (emas.length === 0) return 0;
  const idx = emas.length - 1 - offsetFromEnd;
  return idx >= 0 ? emas[idx] : 0;
}

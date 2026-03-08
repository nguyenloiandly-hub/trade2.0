import { Candle } from '../../types';

export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < 2) return [];
  
  const trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trValues.push(tr);
  }
  
  const atrValues: number[] = [];
  if (trValues.length < period) return [];
  
  let sum = 0;
  for (let i = 0; i < period; i++) sum += trValues[i];
  atrValues.push(sum / period);
  
  for (let i = period; i < trValues.length; i++) {
    const prevATR = atrValues[atrValues.length - 1];
    atrValues.push((prevATR * (period - 1) + trValues[i]) / period);
  }
  
  return atrValues;
}

export function getLatestATR(candles: Candle[], period: number = 14): number {
  const atrs = calculateATR(candles, period);
  return atrs.length > 0 ? atrs[atrs.length - 1] : 0;
}

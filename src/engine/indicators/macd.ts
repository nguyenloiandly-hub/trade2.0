import { Candle } from '../../types';
import { calculateEMA } from './ema';

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(candles: Candle[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDResult | null {
  if (candles.length < slowPeriod + signalPeriod) return null;
  const closes = candles.map(c => c.close);
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const diff = slowPeriod - fastPeriod;
  const macdLine = fastEMA.slice(diff).map((v, i) => v - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const lastMACD = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return { macd: lastMACD, signal: lastSignal, histogram: lastMACD - lastSignal };
}

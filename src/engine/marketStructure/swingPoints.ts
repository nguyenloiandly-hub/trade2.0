import { Candle, SwingPoint } from '../../types';

export function detectSwingPoints(candles: Candle[], lookback: number = 2): SwingPoint[] {
  const points: SwingPoint[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= c.high || candles[i + j].high >= c.high) isSwingHigh = false;
      if (candles[i - j].low <= c.low || candles[i + j].low <= c.low) isSwingLow = false;
    }
    if (isSwingHigh) points.push({ index: i, price: c.high, timestamp: c.timestamp, type: 'high' });
    if (isSwingLow) points.push({ index: i, price: c.low, timestamp: c.timestamp, type: 'low' });
  }
  return points;
}

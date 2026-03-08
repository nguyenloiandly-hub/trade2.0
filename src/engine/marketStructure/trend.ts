import { Candle, SwingPoint, TrendState } from '../../types';
import { detectSwingPoints } from './swingPoints';
import { calculateEMA } from '../indicators/ema';

export interface TrendAnalysis {
  state: TrendState;
  ema20: number;
  ema50: number;
  ema200: number;
  ema50Slope: number;
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];
  hasHH: boolean;
  hasHL: boolean;
  hasLH: boolean;
  hasLL: boolean;
  bosDetected: boolean;
  cochDetected: boolean;
}

export function analyzeTrend(candles: Candle[]): TrendAnalysis {
  const closes = candles.map(c => c.close);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);
  
  const ema20 = ema20Arr.length > 0 ? ema20Arr[ema20Arr.length - 1] : closes[closes.length - 1];
  const ema50 = ema50Arr.length > 0 ? ema50Arr[ema50Arr.length - 1] : closes[closes.length - 1];
  const ema200 = ema200Arr.length > 0 ? ema200Arr[ema200Arr.length - 1] : closes[closes.length - 1];
  
  const ema50Slope = ema50Arr.length >= 5
    ? (ema50Arr[ema50Arr.length - 1] - ema50Arr[ema50Arr.length - 5]) / ema50Arr[ema50Arr.length - 5]
    : 0;
  
  const allSwings = detectSwingPoints(candles, 2);
  const swingHighs = allSwings.filter(s => s.type === 'high').slice(-6);
  const swingLows = allSwings.filter(s => s.type === 'low').slice(-6);
  
  let hasHH = false, hasHL = false, hasLH = false, hasLL = false;
  if (swingHighs.length >= 2) {
    hasHH = swingHighs[swingHighs.length - 1].price > swingHighs[swingHighs.length - 2].price;
    hasLH = swingHighs[swingHighs.length - 1].price < swingHighs[swingHighs.length - 2].price;
  }
  if (swingLows.length >= 2) {
    hasHL = swingLows[swingLows.length - 1].price > swingLows[swingLows.length - 2].price;
    hasLL = swingLows[swingLows.length - 1].price < swingLows[swingLows.length - 2].price;
  }
  
  const currentPrice = closes[closes.length - 1];
  const priceAboveEMA50 = currentPrice > ema50;
  
  const lastSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1].price : Infinity;
  const lastSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1].price : 0;
  const bosDetected = currentPrice > lastSwingHigh || currentPrice < lastSwingLow;
  
  const cochDetected = (hasHH && hasHL && currentPrice < lastSwingLow) ||
    (hasLH && hasLL && currentPrice > lastSwingHigh);
  
  let state: TrendState;
  if ((hasHH && hasHL) && priceAboveEMA50 && ema50Slope > 0.0001) {
    state = 'uptrend';
  } else if ((hasLH && hasLL) && !priceAboveEMA50 && ema50Slope < -0.0001) {
    state = 'downtrend';
  } else {
    state = 'sideway';
  }
  
  return { state, ema20, ema50, ema200, ema50Slope, swingHighs, swingLows, hasHH, hasHL, hasLH, hasLL, bosDetected, cochDetected };
}

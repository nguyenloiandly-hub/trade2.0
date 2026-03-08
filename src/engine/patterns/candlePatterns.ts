import { Candle, CandlePattern, Timeframe, SupportResistanceZone } from '../../types';

function getCandleStructure(c: Candle) {
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  const isBullish = c.close > c.open;
  const isValid = range > 0;
  return { body, range, upperWick, lowerWick, isBullish, isValid, bodyRatio: range > 0 ? body / range : 0 };
}

function isNearZone(price: number, zones: SupportResistanceZone[], atr: number): boolean {
  return zones.some(z => Math.abs(price - (z.low + z.high) / 2) <= atr * 1.0);
}

export function detectPatterns(candles: Candle[], timeframe: Timeframe, supportZones: SupportResistanceZone[], resistanceZones: SupportResistanceZone[], atr: number): CandlePattern[] {
  const patterns: CandlePattern[] = [];
  if (candles.length < 3) return patterns;
  
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];
  
  const s = getCandleStructure(last);
  const sp = getCandleStructure(prev);
  
  if (!s.isValid) return patterns;
  
  const nearSupport = isNearZone(last.low, supportZones, atr);
  const nearResistance = isNearZone(last.high, resistanceZones, atr);
  
  // Hammer
  if (s.lowerWick >= s.body * 2 && s.upperWick <= s.body * 0.5 && s.bodyRatio <= 0.35) {
    const strength = nearSupport ? 0.75 : 0.35;
    patterns.push({ name: 'Hammer', timeframe, strength, direction: 'bullish', candleIndex: candles.length - 1 });
  }
  
  // Inverted Hammer
  if (s.upperWick >= s.body * 2 && s.lowerWick <= s.body * 0.5 && s.bodyRatio <= 0.35) {
    const strength = nearSupport ? 0.65 : 0.25;
    patterns.push({ name: 'Inverted Hammer', timeframe, strength, direction: 'bullish', candleIndex: candles.length - 1 });
  }
  
  // Shooting Star (needs at least 4 candles)
  if (candles.length >= 4) {
    const recentUptrend = prev.close > prev2.close && prev2.close > candles[candles.length - 4].close;
    if (s.upperWick >= s.body * 2 && s.lowerWick <= s.body * 0.5 && s.bodyRatio <= 0.35 && (nearResistance || recentUptrend)) {
      const strength = nearResistance ? 0.75 : 0.4;
      patterns.push({ name: 'Shooting Star', timeframe, strength, direction: 'bearish', candleIndex: candles.length - 1 });
    }
  }
  
  // Doji
  if (s.bodyRatio <= 0.1) {
    patterns.push({ name: 'Doji', timeframe, strength: 0.3, direction: 'neutral', candleIndex: candles.length - 1 });
  }
  
  // Gravestone Doji
  if (s.bodyRatio <= 0.1 && s.upperWick > s.range * 0.6 && s.lowerWick < s.range * 0.1) {
    patterns.push({ name: 'Gravestone Doji', timeframe, strength: nearResistance ? 0.7 : 0.35, direction: 'bearish', candleIndex: candles.length - 1 });
  }
  
  // Bullish Engulfing
  if (!sp.isBullish && s.isBullish && s.body > sp.body && last.open < prev.close && last.close > prev.open) {
    const strength = nearSupport ? 0.8 : 0.4;
    patterns.push({ name: 'Bullish Engulfing', timeframe, strength, direction: 'bullish', candleIndex: candles.length - 1 });
  }
  
  // Bearish Engulfing
  if (sp.isBullish && !s.isBullish && s.body > sp.body && last.open > prev.close && last.close < prev.open) {
    const strength = nearResistance ? 0.8 : 0.4;
    patterns.push({ name: 'Bearish Engulfing', timeframe, strength, direction: 'bearish', candleIndex: candles.length - 1 });
  }
  
  // Morning Star (3 candles)
  {
    const c1 = prev2, c2 = prev, c3 = last;
    const s1 = getCandleStructure(c1);
    const s2 = getCandleStructure(c2);
    const s3 = getCandleStructure(c3);
    const midpoint1 = (c1.open + c1.close) / 2;
    if (!s1.isBullish && s1.bodyRatio > 0.3 && s2.bodyRatio < 0.3 && s3.isBullish && c3.close > midpoint1) {
      const strength = nearSupport ? 0.85 : 0.5;
      patterns.push({ name: 'Morning Star', timeframe, strength, direction: 'bullish', candleIndex: candles.length - 1 });
    }
    // Evening Star
    if (s1.isBullish && s1.bodyRatio > 0.3 && s2.bodyRatio < 0.3 && !s3.isBullish && c3.close < (c1.open + c1.close) / 2) {
      const strength = nearResistance ? 0.85 : 0.5;
      patterns.push({ name: 'Evening Star', timeframe, strength, direction: 'bearish', candleIndex: candles.length - 1 });
    }
  }
  
  // Three White Soldiers
  {
    const c1 = prev2, c2 = prev, c3 = last;
    const s1 = getCandleStructure(c1), s2 = getCandleStructure(c2), s3 = getCandleStructure(c3);
    if (s1.isBullish && s2.isBullish && s3.isBullish &&
        s1.bodyRatio > 0.5 && s2.bodyRatio > 0.5 && s3.bodyRatio > 0.5 &&
        c2.open > c1.open && c2.open < c1.close &&
        c3.open > c2.open && c3.open < c2.close) {
      patterns.push({ name: 'Three White Soldiers', timeframe, strength: 0.7, direction: 'bullish', candleIndex: candles.length - 1 });
    }
    // Three Black Crows
    if (!s1.isBullish && !s2.isBullish && !s3.isBullish &&
        s1.bodyRatio > 0.5 && s2.bodyRatio > 0.5 && s3.bodyRatio > 0.5 &&
        c2.open < c1.open && c2.open > c1.close &&
        c3.open < c2.open && c3.open > c2.close) {
      patterns.push({ name: 'Three Black Crows', timeframe, strength: 0.7, direction: 'bearish', candleIndex: candles.length - 1 });
    }
  }
  
  return patterns;
}

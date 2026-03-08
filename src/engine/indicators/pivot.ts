import { Candle, PivotLevels } from '../../types';

export function calculatePivotPoints(candle: Candle): PivotLevels {
  const { high: H, low: L, close: C } = candle;
  const PP = (H + L + C) / 3;
  return {
    pp: PP,
    r1: 2 * PP - L,
    s1: 2 * PP - H,
    r2: PP + (H - L),
    s2: PP - (H - L),
    r3: H + 2 * (PP - L),
    s3: L - 2 * (H - PP),
  };
}

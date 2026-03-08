import { TimeframeScore, Timeframe } from '../../types';

const TF_WEIGHTS: Record<Timeframe, number> = {
  '15m': 1.0,
  '1h': 1.5,
  '2h': 1.8,
  '4h': 2.4,
  '6h': 2.6,
  '8h': 2.8,
  '12h': 3.0,
  '1d': 3.2,
};

export function aggregateMTF(scores: TimeframeScore[]): { longPercent: number; shortPercent: number; weightedBull: number; weightedBear: number } {
  let weightedBull = 0;
  let weightedBear = 0;
  let totalWeight = 0;
  
  scores.forEach(s => {
    const w = TF_WEIGHTS[s.timeframe];
    weightedBull += s.bullScore * w;
    weightedBear += s.bearScore * w;
    totalWeight += w;
  });
  
  void totalWeight;
  
  const total = weightedBull + weightedBear;
  if (total === 0) return { longPercent: 50, shortPercent: 50, weightedBull: 0, weightedBear: 0 };
  
  const longPercent = Math.round((weightedBull / total) * 100);
  const shortPercent = 100 - longPercent;
  
  return { longPercent, shortPercent, weightedBull, weightedBear };
}

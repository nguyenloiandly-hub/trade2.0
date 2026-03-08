export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '15m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d';

export type TrendState = 'uptrend' | 'downtrend' | 'sideway';

export interface SwingPoint {
  index: number;
  price: number;
  timestamp: number;
  type: 'high' | 'low';
}

export interface SupportResistanceZone {
  low: number;
  high: number;
  strength: number;
  touchCount: number;
  timeframe: Timeframe;
  lastTouchTimestamp: number;
  broken: boolean;
}

export interface PivotLevels {
  pp: number;
  r1: number; r2: number; r3: number;
  s1: number; s2: number; s3: number;
}

export interface CandlePattern {
  name: string;
  timeframe: Timeframe;
  strength: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  candleIndex: number;
}

export interface Trendline {
  id: string;
  type: 'support' | 'resistance';
  point1: { timestamp: number; price: number };
  point2: { timestamp: number; price: number };
  touchCount: number;
  score: number;
  currentPrice: number;
  broken: boolean;
}

export interface TimeframeScore {
  timeframe: Timeframe;
  bullScore: number;
  bearScore: number;
  trendState: TrendState;
  details: {
    trendScore: number;
    zoneScore: number;
    patternScore: number;
    trendlineScore: number;
    momentumScore: number;
    volatilityScore: number;
  };
}

export interface EntryPlan {
  direction: 'LONG' | 'SHORT';
  entryZone: [number, number];
  triggerPrice: number;
  stopLoss: number;
  takeProfit: number[];
  rr: number;
}

export interface NewsItem {
  headline: string;
  source: string;
  time: number;
  sentimentScore: number;
  impactScore: number;
  url?: string;
}

export interface SentimentSummary {
  overallScore: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  newsItems: NewsItem[];
}

export interface SignalOutput {
  symbol: string;
  timeframeMode: 'intraday' | 'swing';
  marketBias: 'LONG' | 'SHORT' | 'NEUTRAL';
  longPercent: number;
  shortPercent: number;
  confidence: number;
  supportZones: SupportResistanceZone[];
  resistanceZones: SupportResistanceZone[];
  pivotLevels: PivotLevels;
  patterns: CandlePattern[];
  trendlines: Trendline[];
  timeframeScores: TimeframeScore[];
  entryPlan: EntryPlan | null;
  sentiment: SentimentSummary;
  reasons: string[];
  warnings: string[];
  timestamp: number;
  currentPrice: number;
  atr: number;
}

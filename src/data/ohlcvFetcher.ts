import axios from 'axios';
import { Candle, Timeframe } from '../types';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

const TF_TO_BINANCE: Record<Timeframe, string> = {
  '15m': '15m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '8h': '8h',
  '12h': '12h',
  '1d': '1d',
};

export async function fetchOHLCV(symbol: string, timeframe: Timeframe, limit: number = 200): Promise<Candle[]> {
  const interval = TF_TO_BINANCE[timeframe];
  const response = await axios.get(`${BINANCE_BASE}/klines`, {
    params: { symbol: symbol.toUpperCase(), interval, limit },
  });
  
  return (response.data as unknown[][]).map((k) => ({
    timestamp: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));
}

export async function fetchAllTimeframes(symbol: string): Promise<Partial<Record<Timeframe, Candle[]>>> {
  const timeframes: Timeframe[] = ['15m', '1h', '2h', '4h', '6h', '8h', '12h', '1d'];
  const results: Partial<Record<Timeframe, Candle[]>> = {};
  
  await Promise.allSettled(
    timeframes.map(async (tf) => {
      const candles = await fetchOHLCV(symbol, tf);
      results[tf] = candles;
    })
  );
  
  return results;
}

export async function fetchNews(symbol: string): Promise<{ headline: string; source: string; time: number; url: string }[]> {
  try {
    const asset = symbol.replace('USDT', '').replace('BUSD', '');
    const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/', {
      params: { categories: asset, excludeCategories: 'Sponsored', lang: 'EN', sortOrder: 'popular' },
    });
    return ((response.data as { Data: Record<string, unknown>[] }).Data || []).slice(0, 10).map((item) => ({
      headline: item['title'] as string,
      source: ((item['source_info'] as Record<string, unknown>)?.['name'] as string) || item['source'] as string,
      time: (item['published_on'] as number) * 1000,
      url: item['url'] as string,
    }));
  } catch {
    return [];
  }
}

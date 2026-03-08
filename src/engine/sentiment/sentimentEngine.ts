import { NewsItem, SentimentSummary } from '../../types';

export function processSentiment(newsItems: NewsItem[]): SentimentSummary {
  if (newsItems.length === 0) {
    return { overallScore: 0, bias: 'neutral', newsItems: [] };
  }
  
  const now = Date.now();
  let totalWeight = 0;
  let weightedScore = 0;
  
  newsItems.forEach(item => {
    const ageHours = (now - item.time) / (1000 * 60 * 60);
    const freshnessWeight = Math.max(0, 1 - ageHours / 48);
    const headlineImpact = item.sentimentScore * item.impactScore * freshnessWeight;
    weightedScore += headlineImpact;
    totalWeight += item.impactScore * freshnessWeight;
  });
  
  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  let bias: 'bullish' | 'bearish' | 'neutral';
  if (overallScore > 0.25) bias = 'bullish';
  else if (overallScore < -0.25) bias = 'bearish';
  else bias = 'neutral';
  
  return { overallScore, bias, newsItems };
}

import { SentimentSummary } from '../../types';
interface Props { sentiment: SentimentSummary; }
export default function NewsPanel({ sentiment }: Props) {
  return (
    <div>
      <div className={`rounded p-3 mb-4 text-center font-bold ${
        sentiment.bias === 'bullish' ? 'bg-green-900/20 text-green-400 border border-green-700' :
        sentiment.bias === 'bearish' ? 'bg-red-900/20 text-red-400 border border-red-700' :
        'bg-gray-800 text-gray-400 border border-gray-700'
      }`}>
        News Sentiment: {sentiment.bias.toUpperCase()} ({(sentiment.overallScore * 100).toFixed(1)})
      </div>
      {sentiment.newsItems.length === 0 ? (
        <div className="text-gray-500 text-center">No news available</div>
      ) : (
        sentiment.newsItems.map((item, i) => (
          <div key={i} className="bg-gray-800 rounded p-3 mb-2 border border-gray-700">
            <div className="text-sm text-gray-200 mb-1">{item.headline}</div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{item.source}</span>
              <span>{new Date(item.time).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

import { TimeframeScore } from '../../types';
interface Props { scores: TimeframeScore[]; }
export default function TimeframeGrid({ scores }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {scores.map(score => (
        <div key={score.timeframe} className="bg-gray-800 rounded p-3 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-200">{score.timeframe}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              score.trendState === 'uptrend' ? 'bg-green-800 text-green-300' :
              score.trendState === 'downtrend' ? 'bg-red-800 text-red-300' :
              'bg-gray-700 text-gray-400'
            }`}>{score.trendState}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center mb-2">
            <div><div className="text-green-400 text-xl font-bold">{score.bullScore}</div><div className="text-xs text-gray-500">Bull</div></div>
            <div><div className="text-red-400 text-xl font-bold">{score.bearScore}</div><div className="text-xs text-gray-500">Bear</div></div>
          </div>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between"><span>Trend</span><span className={score.details.trendScore > 0 ? 'text-green-400' : 'text-red-400'}>{score.details.trendScore > 0 ? '+' : ''}{score.details.trendScore.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Zone</span><span className={score.details.zoneScore > 0 ? 'text-green-400' : 'text-red-400'}>{score.details.zoneScore > 0 ? '+' : ''}{score.details.zoneScore.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Pattern</span><span className={score.details.patternScore > 0 ? 'text-green-400' : 'text-red-400'}>{score.details.patternScore > 0 ? '+' : ''}{score.details.patternScore.toFixed(0)}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

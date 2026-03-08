import { SignalOutput } from '../../types';
interface Props { signal: SignalOutput; }
export default function SignalCard({ signal }: Props) {
  return (
    <div className="bg-gray-800 rounded p-3 text-xs">
      <div className="font-semibold text-gray-300 mb-2">Signal Details</div>
      {signal.patterns.slice(0, 3).map((p, i) => (
        <div key={i} className={`flex justify-between mb-1 ${p.direction === 'bullish' ? 'text-green-400' : p.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
          <span>{p.name} ({p.timeframe})</span>
          <span>{(p.strength * 100).toFixed(0)}%</span>
        </div>
      ))}
      {signal.reasons.slice(0, 4).map((r, i) => (
        <div key={i} className="text-gray-400 mt-1">✓ {r}</div>
      ))}
      {signal.warnings.slice(0, 3).map((w, i) => (
        <div key={i} className="text-yellow-500 mt-1">⚠ {w}</div>
      ))}
    </div>
  );
}

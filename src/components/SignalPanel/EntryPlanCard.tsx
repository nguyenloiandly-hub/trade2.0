import { EntryPlan } from '../../types';
interface Props { plan: EntryPlan; currentPrice: number; }
export default function EntryPlanCard({ plan, currentPrice: _currentPrice }: Props) {
  return (
    <div className={`rounded p-3 text-xs border ${plan.direction === 'LONG' ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
      <div className={`font-bold text-sm mb-2 ${plan.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
        {plan.direction} Signal
      </div>
      <div className="space-y-1 text-gray-300">
        <div className="flex justify-between"><span>Entry Zone:</span><span>{plan.entryZone[0].toFixed(2)} - {plan.entryZone[1].toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Trigger:</span><span className="text-blue-400">{plan.triggerPrice.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Stop Loss:</span><span className="text-red-400">{plan.stopLoss.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold"><span>RR:</span><span className="text-yellow-400">1:{plan.rr}</span></div>
        {plan.takeProfit.map((tp, i) => (
          <div key={i} className="flex justify-between"><span>TP{i + 1}:</span><span className="text-green-400">{tp.toFixed(2)}</span></div>
        ))}
      </div>
    </div>
  );
}

interface Props { longPercent: number; shortPercent: number; }
export default function LongShortBar({ longPercent, shortPercent }: Props) {
  return (
    <div className="bg-gray-800 rounded p-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-green-400 font-bold">LONG {longPercent}%</span>
        <span className="text-red-400 font-bold">SHORT {shortPercent}%</span>
      </div>
      <div className="h-4 rounded overflow-hidden flex">
        <div className="bg-green-600 transition-all duration-500" style={{ width: `${longPercent}%` }} />
        <div className="bg-red-600 transition-all duration-500" style={{ width: `${shortPercent}%` }} />
      </div>
    </div>
  );
}

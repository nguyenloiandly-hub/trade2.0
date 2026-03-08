import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { SignalOutput } from '../../types';

interface Props { signal: SignalOutput; }

export default function TradingChart({ signal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 400,
      timeScale: { borderColor: '#334155' },
    });
    
    chartRef.current = chart;
    
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !signal) return;
    // Chart series would be populated with actual OHLCV data
  }, [signal]);

  return (
    <div className="flex-1 relative min-h-0" style={{ minHeight: '400px' }}>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      {signal && (
        <div className="absolute top-2 left-2 bg-gray-900/80 rounded p-2 text-xs pointer-events-none">
          <div className="text-gray-300 font-bold">{signal.symbol} | ATR: {signal.atr.toFixed(2)}</div>
          <div className="flex gap-3 mt-1">
            <span className="text-green-400">S: {signal.supportZones[0]?.high.toFixed(2) ?? '-'}</span>
            <span className="text-red-400">R: {signal.resistanceZones[0]?.low.toFixed(2) ?? '-'}</span>
            <span className="text-yellow-400">PP: {signal.pivotLevels.pp.toFixed(2)}</span>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="text-blue-400">Price: {signal.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className={signal.marketBias === 'LONG' ? 'text-green-400' : signal.marketBias === 'SHORT' ? 'text-red-400' : 'text-gray-400'}>
              {signal.marketBias}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

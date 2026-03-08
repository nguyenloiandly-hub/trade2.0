import { useState, useEffect, useCallback } from 'react';
import { SignalOutput } from './types';
import { fetchAllTimeframes, fetchNews } from './data/ohlcvFetcher';
import { runSignalEngine } from './engine/signalEngine';
import { processSentiment } from './engine/sentiment/sentimentEngine';
import { NewsItem } from './types';
import LongShortBar from './components/SignalPanel/LongShortBar';
import SignalCard from './components/SignalPanel/SignalCard';
import EntryPlanCard from './components/SignalPanel/EntryPlanCard';
import TimeframeGrid from './components/TimeframeGrid/TimeframeGrid';
import TradingChart from './components/Chart/TradingChart';
import NewsPanel from './components/NewsPanel/NewsPanel';

type TabType = 'signals' | 'analysis' | 'trendlines' | 'news';

export default function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [inputSymbol, setInputSymbol] = useState('BTCUSDT');
  const [signal, setSignal] = useState<SignalOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('signals');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [candlesByTF, rawNews] = await Promise.all([
        fetchAllTimeframes(symbol),
        fetchNews(symbol),
      ]);
      
      const newsItems: NewsItem[] = rawNews.map(n => ({
        ...n,
        sentimentScore: 0,
        impactScore: 0.5,
      }));
      
      const sentiment = processSentiment(newsItems);
      const result = runSignalEngine(symbol, candlesByTF, sentiment);
      setSignal(result);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    analyze();
    const interval = setInterval(analyze, 60000);
    return () => clearInterval(interval);
  }, [analyze]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-4">
        <div className="text-blue-400 font-bold text-xl">⚡ Trade2.0</div>
        <div className="flex items-center gap-2">
          <input
            value={inputSymbol}
            onChange={e => setInputSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') { setSymbol(inputSymbol); } }}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm w-32 focus:outline-none focus:border-blue-400"
            placeholder="BTCUSDT"
          />
          <button
            onClick={() => setSymbol(inputSymbol)}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm transition-colors"
          >
            Analyze
          </button>
          <button
            onClick={analyze}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '⟳ Loading...' : '↺ Refresh'}
          </button>
        </div>
        {signal && (
          <div className={`ml-auto px-4 py-1 rounded font-bold text-sm ${
            signal.marketBias === 'LONG' ? 'bg-green-600/20 text-green-400 border border-green-600' :
            signal.marketBias === 'SHORT' ? 'bg-red-600/20 text-red-400 border border-red-600' :
            'bg-gray-600/20 text-gray-400 border border-gray-600'
          }`}>
            {signal.marketBias} | {signal.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
        {lastUpdate && <div className="text-gray-500 text-xs">Updated: {lastUpdate.toLocaleTimeString()}</div>}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 text-sm">
          Error: {error}
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Sidebar */}
        <div className="w-72 bg-gray-900 border-r border-gray-700 overflow-y-auto p-3 flex flex-col gap-3">
          {signal ? (
            <>
              <LongShortBar longPercent={signal.longPercent} shortPercent={signal.shortPercent} />
              <div className="bg-gray-800 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">Confidence</div>
                <div className={`text-2xl font-bold ${
                  signal.confidence >= 70 ? 'text-green-400' :
                  signal.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>{signal.confidence}%</div>
              </div>
              <SignalCard signal={signal} />
              {signal.entryPlan && <EntryPlanCard plan={signal.entryPlan} currentPrice={signal.currentPrice} />}
            </>
          ) : loading ? (
            <div className="text-gray-500 text-center mt-10">Analyzing...</div>
          ) : null}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="bg-gray-900 border-b border-gray-700 flex">
            {(['signals', 'analysis', 'trendlines', 'news'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'signals' ? 'Live Signals' : tab === 'analysis' ? 'Market Analysis' : tab === 'trendlines' ? 'Trendlines' : 'News Sentiment'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'signals' && signal && (
              <div className="h-full flex flex-col gap-2 p-3">
                <TradingChart signal={signal} />
              </div>
            )}
            {activeTab === 'analysis' && signal && (
              <div className="h-full overflow-y-auto p-3">
                <TimeframeGrid scores={signal.timeframeScores} />
              </div>
            )}
            {activeTab === 'trendlines' && signal && (
              <div className="h-full overflow-y-auto p-3">
                <div className="text-sm text-gray-400 mb-3">Trendlines detected: {signal.trendlines.length}</div>
                {signal.trendlines.map(tl => (
                  <div key={tl.id} className={`bg-gray-800 rounded p-3 mb-2 border ${tl.type === 'support' ? 'border-green-700' : 'border-red-700'}`}>
                    <div className="flex justify-between">
                      <span className={tl.type === 'support' ? 'text-green-400' : 'text-red-400'}>
                        {tl.type === 'support' ? '↗ Uptrend Line' : '↘ Downtrend Line'}
                      </span>
                      <span className="text-gray-400">Score: {tl.score}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Touches: {tl.touchCount} | Current: {tl.currentPrice.toFixed(2)} | {tl.broken ? '⚠ Broken' : '✓ Active'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'news' && signal && (
              <div className="h-full overflow-y-auto p-3">
                <NewsPanel sentiment={signal.sentiment} />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - TF Grid */}
        {signal && (
          <div className="w-64 bg-gray-900 border-l border-gray-700 overflow-y-auto p-3">
            <div className="text-xs text-gray-400 mb-2 font-semibold uppercase">Timeframe Analysis</div>
            {signal.timeframeScores.map(score => (
              <div key={score.timeframe} className="bg-gray-800 rounded p-2 mb-2 border border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-200">{score.timeframe}</span>
                  <span className={`text-xs px-1 rounded ${
                    score.trendState === 'uptrend' ? 'bg-green-800 text-green-300' :
                    score.trendState === 'downtrend' ? 'bg-red-800 text-red-300' :
                    'bg-gray-700 text-gray-400'
                  }`}>{score.trendState}</span>
                </div>
                <div className="flex gap-1 text-xs">
                  <div className="flex-1 text-center">
                    <div className="text-green-400 font-bold">{score.bullScore}</div>
                    <div className="text-gray-500">Bull</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-red-400 font-bold">{score.bearScore}</div>
                    <div className="text-gray-500">Bear</div>
                  </div>
                </div>
                <div className="mt-1 h-1 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded"
                    style={{ width: `${score.bullScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

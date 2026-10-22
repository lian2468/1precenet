import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Target, FileText, Activity, Trash2, Award, Plus, Sparkles, RefreshCw } from 'lucide-react';

const PAIR_OPTIONS = [
  'EUR/USD', 'USD/CHF', 'NZD/USD', 'XAU/USD', 'USD/JPY',
  'EUR/GBP', 'GBP/USD', 'USD/CAD', 'EUR/CHF', 'EUR/JPY', 'AUD/USD', 'CUSTOM'
];

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('scalp_journal_trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [pair, setPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [tradeType, setTradeType] = useState('LONG');
  const [tradeStatus, setTradeStatus] = useState('ACTIVE');
  const [session, setSession] = useState('London');
  const [accountSize] = useState('10900');
  const [tradeResult, setTradeResult] = useState('WIN');
  const [pnlAmount, setPnlAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Confluence Factors
  const [htfTrend, setHtfTrend] = useState(false);
  const [mtfTrend, setMtfTrend] = useState(false);
  const [ltfTrend, setLtfTrend] = useState(false);
  const [hasImbalance, setHasImbalance] = useState(false);
  const [selectedModel, setSelectedModel] = useState('none');

  useEffect(() => {
    localStorage.setItem('scalp_journal_trades', JSON.stringify(trades));
  }, [trades]);

  // Account Balance calculation starting from $10,900
  const currentAccountBalance = useMemo(() => {
    const closedPnL = trades
      .filter(t => t.status === 'CLOSED')
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    return (parseFloat(accountSize) || 10900) + closedPnL;
  }, [trades, accountSize]);

  // Confluence Score calculation
  const calculatedScore = useMemo(() => {
    let score = 0;
    if (htfTrend) score += 20;
    if (mtfTrend) score += 20;
    if (ltfTrend) score += 10;
    if (hasImbalance) score += 25;
    if (selectedModel !== 'none') score += 25;
    return Math.min(score, 100);
  }, [htfTrend, mtfTrend, ltfTrend, hasImbalance, selectedModel]);

  const handleSaveTrade = () => {
    const finalPair = pair === 'CUSTOM' ? customPair.toUpperCase() : pair;
    if (!finalPair) return alert('נא להזין צמד מטבעות');

    const risk = currentAccountBalance * 0.01;
    let pnl = 0;

    if (tradeStatus === 'CLOSED') {
      pnl = parseFloat(pnlAmount) || (tradeResult === 'WIN' ? risk * 3 : -risk);
    }

    const newTrade = {
      id: `tr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      pair: finalPair,
      type: tradeType,
      session,
      status: tradeStatus,
      riskAmount: risk.toFixed(0),
      result: tradeStatus === 'CLOSED' ? tradeResult : 'PENDING',
      pnl: pnl.toFixed(0),
      score: calculatedScore,
      model: selectedModel,
      notes
    };

    setTrades([newTrade, ...trades]);
    alert('העסקה נשמרה ביומן!');
    setNotes('');
    setPnlAmount('');
  };

  const handleDeleteTrade = (id) => {
    if (confirm('האם למחוק עסקה זו?')) {
      setTrades(trades.filter(t => t.id !== id));
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans p-4 lg:p-8">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-8 bg-[#121724] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ScalpConfluence AI & Journal</h1>
            <p className="text-xs text-slate-400">1% Percent Club Strategy (Brad)</p>
          </div>
        </div>

        <div className="flex gap-4 items-center bg-[#182032] px-4 py-2 rounded-xl border border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 block">יתרת חשבון עדכנית</span>
            <span className="text-base font-bold font-mono text-emerald-400">${currentAccountBalance.toLocaleString()}</span>
          </div>
          <div className="border-r border-slate-700 pr-4">
            <span className="text-[10px] text-slate-400 block">סיכון (1%)</span>
            <span className="text-base font-bold font-mono text-cyan-400">${(currentAccountBalance * 0.01).toFixed(0)}</span>
          </div>
        </div>

        <div className="flex gap-1 bg-[#0a0d14] p-1 rounded-xl border border-slate-800 text-xs">
          <button onClick={() => setActiveTab('calculator')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'calculator' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
            <Target className="w-4 h-4" />
            <span>מחשבון & הזנה</span>
          </button>
          <button onClick={() => setActiveTab('journal')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'journal' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
            <FileText className="w-4 h-4" />
            <span>יומן ({trades.length})</span>
          </button>
        </div>
      </header>

      {/* CALCULATOR TAB */}
      {activeTab === 'calculator' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#121724] p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-3">קריטריוני Confluence</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 bg-[#182032] p-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={htfTrend} onChange={(e) => setHtfTrend(e.target.checked)} className="accent-cyan-500" />
                <span>HTF Trend (1H) +20%</span>
              </label>
              <label className="flex items-center gap-2 bg-[#182032] p-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={mtfTrend} onChange={(e) => setMtfTrend(e.target.checked)} className="accent-cyan-500" />
                <span>MTF Trend (15m) +20%</span>
              </label>
              <label className="flex items-center gap-2 bg-[#182032] p-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={ltfTrend} onChange={(e) => setLtfTrend(e.target.checked)} className="accent-cyan-500" />
                <span>LTF Trend (1m) +10%</span>
              </label>
              <label className="flex items-center gap-2 bg-[#182032] p-3 rounded-xl cursor-pointer">
                <input type="checkbox" checked={hasImbalance} onChange={(e) => setHasImbalance(e.target.checked)} className="accent-emerald-500" />
                <span>FVG / Imbalance +25%</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-2">מודל כניסה נבחר (+25%):</label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100">
                <option value="none">ללא מודל ספציפי (0%)</option>
                <option value="model3">מודל 3 - Fake Market Shift (+25%)</option>
                <option value="model4">מודל 4 - Equal Highs / Lows (+25%)</option>
                <option value="model5">מודל 5 - Fake Flip (+25%)</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#121724] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="text-center bg-[#182032] p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">ציון Confluence</span>
                <span className="text-4xl font-black font-mono text-cyan-400">{calculatedScore}%</span>
              </div>
              <Award className="w-8 h-8 text-cyan-400 opacity-80" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">צמד מטבעות</label>
                <select value={pair} onChange={(e) => setPair(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2 text-white">
                  {PAIR_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">סשן מסחר</label>
                <select value={session} onChange={(e) => setSession(e.target.value)} className="w-full bg-[#182032] border border-slate-700 rounded-xl p-2 text-white">
                  <option value="London">London Session</option>
                  <option value="New York">New York Session</option>
                  <option value="Asia">Asia Session</option>
                </select>
              </div>

              <button onClick={handleSaveTrade} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>שמור עסקה ביומן</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOURNAL TAB */}
      {activeTab === 'journal' && (
        <div className="max-w-7xl mx-auto bg-[#121724] p-6 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-base text-white mb-4">יומן עסקאות שמור</h2>
          {trades.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">אין עסקאות רשומות עדיין.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs font-mono">
                <thead>
                  <tr className="bg-[#182032] text-slate-400 border-b border-slate-800">
                    <th className="p-3">תאריך</th>
                    <th className="p-3">צמד</th>
                    <th className="p-3">סשן</th>
                    <th className="p-3">ציון</th>
                    <th className="p-3">סיכון</th>
                    <th className="p-3">PnL</th>
                    <th className="p-3 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trades.map(t => (
                    <tr key={t.id}>
                      <td className="p-3 text-slate-300">{t.date}</td>
                      <td className="p-3 font-bold text-white">{t.pair}</td>
                      <td className="p-3">{t.session}</td>
                      <td className="p-3 text-cyan-400 font-bold">{t.score}%</td>
                      <td className="p-3">${t.riskAmount}</td>
                      <td className={`p-3 font-bold ${parseFloat(t.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${t.pnl}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeleteTrade(t.id)} className="p-1 text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

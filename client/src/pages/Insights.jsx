import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { calculate503020 } from '../utils/insights';
import AlertBanner from '../components/AlertBanner';
import { Sparkles, Activity, Target, SlidersHorizontal, Loader2, ArrowRight, Send, MessageSquareText, 
  RefreshCw, TrendingUp, TrendingDown, Minus, Plus, Trash2, Trophy, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Insights = () => {
  const { transactions, api, settings } = useFinance();
  
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);
  
  const [anomalies, setAnomalies] = useState([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);

  // New feature states
  const [recurring, setRecurring] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', deadline: '' });
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Budget Simulator state
  const [reduceNeeds, setReduceNeeds] = useState(0);
  const [reduceWants, setReduceWants] = useState(0);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setAnomaliesLoading(true);
        const [anomalyRes, recurringRes, comparisonRes, goalsRes] = await Promise.all([
          api.get('/insights/anomalies'),
          api.get('/insights/recurring'),
          api.get('/insights/comparison'),
          api.get('/insights/goals'),
        ]);
        setAnomalies(anomalyRes.data);
        setRecurring(recurringRes.data);
        setComparison(comparisonRes.data);
        setGoals(goalsRes.data);
      } catch (error) {
        console.error("Failed to fetch insights", error);
      } finally {
        setAnomaliesLoading(false);
      }
    };
    fetchAll();
  }, [api]);

  const generateDigest = async () => {
    setDigestLoading(true);
    try {
      const res = await api.get('/insights/digest');
      setDigest(res.data.digest);
    } catch (error) {
      setDigest("Failed to generate digest. Ensure your API key is correct.");
    } finally { setDigestLoading(false); }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await api.post('/insights/chat', { message: userMsg });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Failed to connect to the advisor. Try again later." }]);
    } finally { setChatLoading(false); }
  };

  // Goal handlers
  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount) return;
    try {
      const res = await api.post('/insights/goals', newGoal);
      setGoals(prev => [res.data, ...prev]);
      setNewGoal({ name: '', targetAmount: '', deadline: '' });
      setShowGoalForm(false);
    } catch (err) { console.error(err); }
  };

  const updateGoalAmount = async (goalId, currentAmount, delta) => {
    const newAmount = Math.max(0, currentAmount + delta);
    try {
      await api.put(`/insights/goals/${goalId}`, { currentAmount: newAmount });
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: newAmount } : g));
    } catch (err) { console.error(err); }
  };

  const deleteGoal = async (goalId) => {
    try {
      await api.delete(`/insights/goals/${goalId}`);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) { console.error(err); }
  };

  // 50/30/20 data
  const budgetStats = useMemo(() => calculate503020(transactions), [transactions]);
  const simulatedNeedsAmnt = budgetStats.actual.needsAmnt * (1 - reduceNeeds / 100);
  const simulatedWantsAmnt = budgetStats.actual.wantsAmnt * (1 - reduceWants / 100);
  const extraSavings = (budgetStats.actual.needsAmnt - simulatedNeedsAmnt) + (budgetStats.actual.wantsAmnt - simulatedWantsAmnt);

  const freqBadge = (f) => {
    const colors = { monthly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', weekly: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', 'bi-weekly': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', quarterly: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', irregular: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    return colors[f] || colors.irregular;
  };

  return (
    <motion.div 
      className="space-y-8 pb-12"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" /> Financial Insights
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">AI-powered analysis, subscriptions, goals, and budget forecasting.</p>
      </div>

      {/* Anomalies */}
      {!anomaliesLoading && anomalies.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">Spending Alerts</h2>
          {anomalies.map(tx => (
            <AlertBanner 
              key={tx.id} type="warning"
              title={`Unusual ${tx.category} Expense: ₹${Math.abs(tx.amount)}`}
              message={`You spent ${tx.multiplier}x your average on ${tx.description} (${tx.date}).`}
            />
          ))}
        </div>
      )}

      {/* Two Column: Recurring + Category Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recurring Transactions */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Recurring / Subscriptions</h2>
          </div>
          {recurring.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">No recurring patterns detected yet.</div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {recurring.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{item.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${freqBadge(item.frequency)}`}>{item.frequency}</span>
                      <span className="text-xs text-muted-foreground">{item.occurrences}x seen</span>
                    </div>
                  </div>
                  <div className="text-right pl-3">
                    <div className="font-bold text-sm text-foreground">₹{item.avgAmount.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-muted-foreground">Next: {new Date(item.nextExpected).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Comparison */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">This Month vs Last Month</h2>
          </div>
          {comparison.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Not enough data for comparison.</div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {comparison.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg ${item.trend === 'up' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : item.trend === 'down' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                      {item.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : item.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{item.category}</div>
                      <div className="text-xs text-muted-foreground">
                        ₹{item.lastMonth.toLocaleString('en-IN')} → ₹{item.thisMonth.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals Tracker */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold tracking-tight">Savings Goals</h2>
          </div>
          <button 
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>

        {/* Goal Form */}
        {showGoalForm && (
          <form onSubmit={addGoal} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-muted/40 rounded-xl border border-border/50">
            <input type="text" placeholder="Goal name (e.g. Vacation)" value={newGoal.name} onChange={e => setNewGoal(p => ({...p, name: e.target.value}))} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            <input type="number" placeholder="Target ₹" value={newGoal.targetAmount} onChange={e => setNewGoal(p => ({...p, targetAmount: e.target.value}))} className="w-32 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" required />
            <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({...p, deadline: e.target.value}))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Save</button>
          </form>
        )}

        {goals.length === 0 && !showGoalForm ? (
          <div className="text-center text-muted-foreground py-8 text-sm">No savings goals yet. Add one to start tracking!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              const radius = 40;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (pct / 100) * circumference;
              const ringColor = pct >= 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b';

              return (
                <div key={goal.id} className="bg-muted/40 rounded-xl border border-border/50 p-4 flex flex-col items-center relative group">
                  <button onClick={() => deleteGoal(goal.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* SVG Progress Ring */}
                  <div className="relative w-24 h-24 mb-3">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
                      <circle 
                        cx="50" cy="50" r={radius} fill="none" 
                        stroke={ringColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground">{pct}%</span>
                    </div>
                  </div>
                  
                  <div className="text-sm font-semibold text-foreground text-center mb-1">{goal.name}</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => updateGoalAmount(goal.id, goal.currentAmount, 1000)} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors font-medium">+₹1,000</button>
                    <button onClick={() => updateGoalAmount(goal.id, goal.currentAmount, 5000)} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors font-medium">+₹5,000</button>
                  </div>
                  {goal.deadline && (
                    <div className="text-xs text-muted-foreground mt-2">Deadline: {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly AI Digest */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 bg-gradient-to-bl from-primary to-transparent w-full h-full rounded-tr-xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Weekly AI Digest
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Get a personalized 3-sentence summary of your recent spending habits, top categories, and an actionable tip generated by Gemini AI.
            </p>
            
            {digest ? (
              <div className="p-5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-line">{digest}</p>
              </div>
            ) : (
              <button 
                onClick={generateDigest}
                disabled={digestLoading}
                className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shimmer-btn"
              >
                {digestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {digestLoading ? "Analyzing..." : "Generate Digest"}
              </button>
            )}
            
            {!settings.geminiApiKey && !digest && (
              <div className="mt-4 text-xs text-amber-600 flex items-center gap-1">
                Gemini API Key missing. <Link to="/settings" className="underline font-bold">Configure in Settings <ArrowRight className="inline w-3 h-3"/></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 50/30/20 Budget Simulator */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">50/30/20 Budget Simulator</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2">Current Month Breakdown</h3>
            {[
              { label: 'Needs (Housing, Utils)', actual: budgetStats.actual.needsPct, target: 50, color: 'bg-blue-500' },
              { label: 'Wants (Food, Shopping)', actual: budgetStats.actual.wantsPct, target: 30, color: 'bg-amber-500' },
              { label: 'Savings & Investments', actual: budgetStats.actual.savingsPct, target: 20, color: 'bg-green-500' }
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.actual}% <span className="text-xs opacity-50">(Target: {item.target}%)</span></span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <motion.div className={`${item.color} h-2.5 rounded-full`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, item.actual)}%` }} transition={{ duration: 1, delay: 0.2 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-secondary/30 rounded-xl p-5 border border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4" /> What-If Simulator
            </h3>
            <div className="space-y-5">
              <div>
                <label className="flex justify-between text-sm font-medium mb-2"><span>Reduce Needs Spending</span><span className="text-primary font-bold">{reduceNeeds}%</span></label>
                <input type="range" min="0" max="50" value={reduceNeeds} onChange={(e) => setReduceNeeds(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
              <div>
                <label className="flex justify-between text-sm font-medium mb-2"><span>Reduce Wants Spending</span><span className="text-primary font-bold">{reduceWants}%</span></label>
                <input type="range" min="0" max="100" value={reduceWants} onChange={(e) => setReduceWants(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
              <div className="pt-4 border-t border-border mt-4">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-xl flex items-center justify-between">
                  <div><div className="text-sm font-medium opacity-90">Projected Extra Savings</div><div className="text-xs mt-0.5 opacity-75">If you follow this plan</div></div>
                  <div className="text-2xl font-bold">+₹{Math.round(extraSavings).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="glass-card p-6 md:p-8 flex flex-col h-[500px]">
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
          <MessageSquareText className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Financial AI Assistant</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 custom-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-2 opacity-50" />
              <p>Ask anything about your finances.</p>
              <span className="text-xs mt-1 bg-muted px-2 py-1 rounded-full">"How much did I spend on food this month?"</span>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted text-foreground rounded-bl-none border border-border/50'
                }`}>
                  <p className="text-sm break-words whitespace-pre-line leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-3 border border-border/50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing transactions...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChat} className="flex gap-2">
          <input
            type="text" value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question (e.g. How much did I spend on food?)..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <button 
            type="submit" 
            disabled={!chatInput.trim() || chatLoading}
            className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </motion.div>
  );
};

export default Insights;

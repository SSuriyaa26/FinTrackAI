import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { calculateHealthScore } from '../utils/insights';
import { exportToCSV } from '../utils/csvExport';
import { Download, TrendingUp, TrendingDown, IndianRupee, Activity, Loader2, Zap, Target } from 'lucide-react';

import SpendingPieChart from '../components/Charts/SpendingPieChart';
import MonthlyBarChart from '../components/Charts/MonthlyBarChart';
import TrendLineChart from '../components/Charts/TrendLineChart';
import TransactionList from '../components/TransactionList';
import HealthScore from '../components/HealthScore';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const { transactions, settings, loading } = useFinance();

  const { thisMonthIncome, thisMonthExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let totalBal = 0;
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    transactions.forEach(tx => {
      totalBal += tx.amount;
      if (tx.date.startsWith(currentMonth)) {
        if (tx.amount > 0) income += tx.amount;
        else expense += Math.abs(tx.amount);
      }
    });
    
    return { thisMonthIncome: income, thisMonthExpense: expense, balance: totalBal };
  }, [transactions]);

  const healthScore = useMemo(() => {
    const budget = settings?.monthlyBudget || '30000';
    return calculateHealthScore(transactions, budget);
  }, [transactions, settings]);

  // Budget Progress 
  const monthlyBudget = parseFloat(settings?.monthlyBudget || '30000');
  const budgetPercent = Math.min(100, Math.round((thisMonthExpense / monthlyBudget) * 100));
  const budgetColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  // Spending Forecast
  const forecast = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    if (dayOfMonth < 2) return null;

    const dailyAvg = thisMonthExpense / dayOfMonth;
    const projected = Math.round(dailyAvg * daysInMonth);
    const daysLeft = daysInMonth - dayOfMonth;
    const remainingBudget = monthlyBudget - thisMonthExpense;
    const dailyAllowance = daysLeft > 0 ? Math.max(0, Math.round(remainingBudget / daysLeft)) : 0;

    return { projected, dailyAvg: Math.round(dailyAvg), dailyAllowance, daysLeft };
  }, [thisMonthExpense, monthlyBudget]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 pb-12"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back! Here's your financial snapshot.</p>
        </div>
        <button 
          onClick={() => exportToCSV(transactions)}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl font-medium text-sm transition-all border shadow-sm w-fit hover:shadow-md"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Budget Progress Bar */}
      <motion.div 
        className="glass-card p-5"
        initial={{ opacity: 0, scaleX: 0.9 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Monthly Budget</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            ₹{thisMonthExpense.toLocaleString('en-IN')} 
            <span className="text-muted-foreground font-normal"> / ₹{monthlyBudget.toLocaleString('en-IN')}</span>
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <motion.div 
            className={`${budgetColor} h-3 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${budgetPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>{budgetPercent}% used</span>
          <span>₹{Math.max(0, monthlyBudget - thisMonthExpense).toLocaleString('en-IN')} remaining</span>
        </div>
      </motion.div>

      {/* Top Metrics Row */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Total Balance */}
        <motion.div variants={item} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground truncate">Total Balance</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground relative z-10 animate-count">
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </motion.div>

        {/* Income */}
        <motion.div variants={item} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground truncate">Income (This Month)</h3>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground relative z-10 animate-count">
            +₹{thisMonthIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </motion.div>

        {/* Expenses */}
        <motion.div variants={item} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground truncate">Expenses (This Month)</h3>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground relative z-10 animate-count">
            -₹{thisMonthExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </motion.div>
        
        {/* Health Score */}
        <motion.div variants={item} className="glass-card p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute opacity-5 -right-4 -bottom-4 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground w-full text-center tracking-wide uppercase mb-1">Health Score</h3>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-bold tracking-tighter ${healthScore > 75 ? 'text-green-500' : healthScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {healthScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Spending Forecast */}
      {forecast && (
        <motion.div 
          className="glass-card p-5 border-l-4 border-l-primary"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Spending Forecast</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Projected Month Total</div>
              <div className={`text-xl font-bold ${forecast.projected > monthlyBudget ? 'text-red-500' : 'text-foreground'}`}>
                ₹{forecast.projected.toLocaleString('en-IN')}
              </div>
              {forecast.projected > monthlyBudget && (
                <div className="text-xs text-red-500 mt-0.5 font-medium">⚠ Over budget by ₹{(forecast.projected - monthlyBudget).toLocaleString('en-IN')}</div>
              )}
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Daily Average Spend</div>
              <div className="text-xl font-bold text-foreground">₹{forecast.dailyAvg.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Safe Daily Limit ({forecast.daysLeft}d left)</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{forecast.dailyAllowance.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Daily Spend (This Month)
            </h2>
            <TrendLineChart transactions={transactions} />
          </div>
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
               Cashflow (Last 6 Months)
            </h2>
            <MonthlyBarChart transactions={transactions} />
          </div>
        </motion.div>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-lg font-semibold mb-2 self-start text-foreground">Financial Health</h2>
            <HealthScore score={healthScore} />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Category Breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4 -mt-2">Expenses for the current month</p>
            <SpendingPieChart transactions={transactions} />
          </div>
        </motion.div>

      </div>

      {/* Transaction List */}
      <motion.div 
        className="glass-card p-6 flex flex-col h-[500px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">All Transactions</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <TransactionList transactions={transactions} limit={0} showDelete={true} />
        </div>
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;

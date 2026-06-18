import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

const MonthlyBarChart = ({ transactions }) => {
  const data = useMemo(() => {
    if (!transactions.length) return [];
    
    const months = {};
    transactions.forEach(tx => {
      const monthStr = tx.date.slice(0, 7);
      if (!months[monthStr]) months[monthStr] = { month: monthStr, Income: 0, Expense: 0 };
      
      if (tx.amount > 0) {
        months[monthStr].Income += tx.amount;
      } else {
        months[monthStr].Expense += Math.abs(tx.amount);
      }
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(item => {
        const d = new Date(item.month + '-01');
        item.displayMonth = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        return item;
      });
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No monthly data available.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.12} />
          <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
          <Legend 
            iconType="circle" 
            iconSize={8}
            formatter={(value) => <span className="text-xs text-foreground/80">{value}</span>}
          />
          <Bar dataKey="Income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Expense" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyBarChart;

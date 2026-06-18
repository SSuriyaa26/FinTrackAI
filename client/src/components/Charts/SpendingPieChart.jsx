import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-sm" style={{ color: payload[0].payload.fill }}>₹{payload[0].value.toLocaleString('en-IN')}</p>
    </div>
  );
};

const SpendingPieChart = ({ transactions }) => {
  const data = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthTxs = transactions.filter(t => t.date.startsWith(currentMonth) && t.amount < 0);
    
    const catMap = {};
    thisMonthTxs.forEach(tx => {
      const amt = Math.abs(tx.amount);
      catMap[tx.category] = (catMap[tx.category] || 0) + amt;
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No expense data for this month.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((_, i) => (
              <linearGradient key={`grad-${i}`} id={`pieGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index})`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-foreground/80">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingPieChart;

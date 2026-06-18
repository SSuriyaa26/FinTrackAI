import React, { useMemo } from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';

const TrendLineChart = ({ transactions }) => {
  const data = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthExpenses = transactions.filter(t => t.date.startsWith(currentMonth) && t.amount < 0);
    
    // Group by day
    const daysMap = {};

    thisMonthExpenses.forEach(tx => {
      const day = parseInt(tx.date.split('-')[2], 10);
      const amt = Math.abs(tx.amount);
      daysMap[day] = (daysMap[day] || 0) + amt;
    });

    const today = new Date();
    const isCurrentMonthNow = today.toISOString().slice(0, 7) === currentMonth;
    const cutoffDay = isCurrentMonthNow ? today.getDate() : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let cumulative = 0;
    const finalData = [];

    for (let d = 1; d <= cutoffDay; d++) {
      const daily = daysMap[d] || 0;
      cumulative += daily;
      finalData.push({
        day: d,
        daily: Math.round(daily),
        cumulative: Math.round(cumulative),
      });
    }

    return finalData;
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No daily spending data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-1">Day {label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name === 'daily' ? 'Daily' : 'Cumulative'}: ₹{entry.value.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(v) => v} 
            minTickGap={15}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
            tick={{ fontSize: 11 }}
            hide
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            yAxisId="left"
            dataKey="daily" 
            fill="url(#barGrad)" 
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#areaGrad)"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendLineChart;

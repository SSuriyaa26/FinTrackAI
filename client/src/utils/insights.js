/**
 * Calculates financial health score (0-100)
 * Formula specifics:
 * - Savings rate > 20% (+30 pts)
 * - Under budget (+25 pts)
 * - No recent overspending anomalies (+20 pts)
 * - Consistent income (+25 pts)
 */
export const calculateHealthScore = (transactions, monthlyBudgetStr) => {
  if (!transactions || transactions.length === 0) return 50; // Default if no data
  
  const monthlyBudget = parseFloat(monthlyBudgetStr) || 30000;
  
  // Only look at current month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTxs = transactions.filter(t => t.date.startsWith(currentMonthStr));
  
  let income = 0;
  let expenses = 0;
  
  thisMonthTxs.forEach(tx => {
    if (tx.amount > 0) income += tx.amount;
    else expenses += Math.abs(tx.amount);
  });
  
  let score = 0;
  
  // 1. Savings rate (Income - Expenses) / Income
  if (income > 0) {
    const savingsRate = (income - expenses) / income;
    if (savingsRate >= 0.20) score += 30; // excellent
    else if (savingsRate >= 0.10) score += 20; // good
    else if (savingsRate > 0) score += 10; // okay
    else score += 0; // negative savings
  } else {
    // No income this month yet, but has expenses
    score += 5; // give minimal baseline
  }
  
  // 2. Under Budget
  if (expenses < monthlyBudget) {
    score += 25;
  } else if (expenses < monthlyBudget * 1.1) {
    score += 15; // slightly over
  } else if (expenses < monthlyBudget * 1.3) {
    score += 5;
  }
  
  // 3. No overspend anomaly
  // Simplify: Are there multiple very large transactions?
  const largeExpenses = thisMonthTxs.filter(t => t.amount < 0 && Math.abs(t.amount) > (monthlyBudget * 0.25));
  if (largeExpenses.length === 0) {
    score += 20;
  } else if (largeExpenses.length === 1) {
    score += 10;
  }
  
  // 4. Consistent income
  // Check if they had income in previous months
  const lastMonthStr = new Date();
  lastMonthStr.setMonth(lastMonthStr.getMonth() - 1);
  const prevMonthStr = lastMonthStr.toISOString().slice(0, 7);
  const prevMonthIncome = transactions.find(t => t.date.startsWith(prevMonthStr) && t.amount > 0);
  
  if (income > 0 && prevMonthIncome) {
    score += 25;
  } else if (income > 0) {
    score += 15;
  }

  // Cap at 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculates the classic 50/30/20 rule
 * Needs vs Wants vs Savings/Investments
 * 
 * Simplified mapping for Hackathon:
 * Needs 50%: Housing, Utilities, Health, Transport -> 50%
 * Wants 30%: Food, Shopping, Entertainment, Other -> 30%
 * Savings 20%: Remaining Income - Expenses -> 20%
 */
export const calculate503020 = (transactions) => {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTxs = transactions.filter(t => t.date.startsWith(currentMonthStr));
  
  let income = 0;
  let needs = 0;
  let wants = 0;
  
  thisMonthTxs.forEach(tx => {
    if (tx.amount > 0) {
      income += tx.amount;
    } else {
      const amt = Math.abs(tx.amount);
      const cat = tx.category;
      if (["Housing", "Utilities", "Health", "Transport"].includes(cat)) {
        needs += amt;
      } else {
        wants += amt;
      }
    }
  });

  const savings = Math.max(0, income - needs - wants);
  
  // Calculate percentages (avoid 0 division and blow-up if income is 0)
  const needsPct = income > 0 ? Math.round((needs / income) * 100) : 0;
  const wantsPct = income > 0 ? Math.round((wants / income) * 100) : 0;
  const savingsPct = income > 0 ? Math.round((savings / income) * 100) : 0;
  
  return {
    actual: {
      needsPct,
      needsAmnt: needs,
      wantsPct,
      wantsAmnt: wants,
      savingsPct,
      savingsAmnt: savings,
    },
    target: {
      needsAmnt: Math.round(income * 0.50),
      wantsAmnt: Math.round(income * 0.30),
      savingsAmnt: Math.round(income * 0.20),
    },
    income
  };
};

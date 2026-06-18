import express from 'express';


const router = express.Router();

// Function to call Gemini via direct fetch
async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured in settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || "No response generated.";
}

// Ensure settings exist and get API key
function getGeminiApiKey(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'geminiApiKey'").get();
  return row ? row.value : null;
}

// GET /api/insights/digest -> Generates weekly AI digest
router.get('/digest', async (req, res) => {
  try {
    const apiKey = getGeminiApiKey(req.db);
    if (!apiKey) {
      const mockDigest = "Based on your recent transactions, your top spending category this week was Food, driven by frequent orders on Swiggy and Zomato. You also had a notable spending spike on June 22nd due to a ₹15,000 purchase at the Apple Store. Actionable tip: Try setting a daily limit of ₹500 for food delivery apps to increase your savings rate by 15%. (Running in demo mode)";
      return res.json({ digest: mockDigest });
    }

    // Get last 30 days transactions for context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const transactions = req.db.prepare('SELECT amount, description, category, date FROM transactions WHERE date >= ?').all(dateStr);
    
    if (transactions.length === 0) {
       return res.json({ digest: "Not enough recent transactions to generate a digest." });
    }

    const txSummary = JSON.stringify(transactions);

    const prompt = `
      You are an expert AI financial advisor. 
      Analyze the following JSON transaction history for the last 30 days (negative amount = expense, positive = income).
      Provide a highly concise, 3-sentence weekly digest.
      Include: The top spending category, any notable spikes, and 1 actionable financial tip.
      Transactions: ${txSummary}
    `;

    const digestText = await callGemini(prompt, apiKey);
    res.json({ digest: digestText });

  } catch (error) {
    console.error("Error generating digest:", error);
    // Graceful fallback: return mock digest if Gemini is unavailable
    const mockDigest = "📊 This month your top spending category was Food, driven by frequent orders on Swiggy and Zomato. 🔴 You had a notable spike in Shopping this week — consider reviewing subscription renewals. 💡 Tip: Cutting Food delivery by ₹500/week could add ₹2,000 to your savings this month. (Demo mode — Gemini temporarily unavailable)";
    res.json({ digest: mockDigest });
  }
});

// POST /api/insights/chat -> Natural language logic
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = getGeminiApiKey(req.db);
    if (!apiKey) {
      let reply = "Hello! I am your FinTrack AI assistant. (Running in demo mode — connect a Gemini API key in Settings for live AI responses.)\n\n";
      const msg = message.toLowerCase();
      if (msg.includes("food") || msg.includes("eat") || msg.includes("restaurant")) {
        reply += "Based on sample data, Food is typically the top variable expense category. Consider setting a daily limit on delivery apps to improve your savings rate.";
      } else if (msg.includes("rent") || msg.includes("housing")) {
        reply += "Housing is usually a fixed monthly expense. If it exceeds 30% of your net income, consider reviewing your budget allocation using the 50/30/20 simulator.";
      } else if (msg.includes("save") || msg.includes("saving") || msg.includes("budget")) {
        reply += "A healthy savings rate is typically 20% or above. Use the What-If Budget Simulator on this page to model how reducing discretionary spend impacts your monthly savings.";
      } else {
        reply += "I can help you analyze your spending by category, check budget adherence, or forecast your month-end balance. Try asking: 'Am I overspending on food?' or 'How much did I save last month?'";
      }
      return res.json({ reply });
    }

    // Pass all transactions as context (limit to last 100 for token limits)
    const transactions = req.db.prepare('SELECT amount, description, category, date FROM transactions ORDER BY date DESC LIMIT 100').all();
    
    const prompt = `
      You are an intelligent personal finance assistant.
      Answer the user's question concisely based on their recent transaction history provided in JSON below.
      Use ₹ (INR) formatting where amounts are shown. Be helpful, factual, and professional.
      
      User Question: "${message}"
      
      Transactions: ${JSON.stringify(transactions)}
    `;

    const responseText = await callGemini(prompt, apiKey);
    res.json({ reply: responseText });

  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: error.message || "Failed to get chat response" });
  }
});

// GET /api/insights/anomalies -> Detect spending > 2x average
router.get('/anomalies', (req, res) => {
  try {
    const expenses = req.db.prepare('SELECT * FROM transactions WHERE amount < 0').all();
    
    const catStats = {};
    expenses.forEach(tx => {
      const amt = Math.abs(tx.amount);
      if (!catStats[tx.category]) catStats[tx.category] = { sum: 0, count: 0 };
      catStats[tx.category].sum += amt;
      catStats[tx.category].count += 1;
    });

    const anomalies = [];
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    expenses.forEach(tx => {
      if (tx.date.startsWith(thisMonth)) {
        const amt = Math.abs(tx.amount);
        const avg = catStats[tx.category].sum / catStats[tx.category].count;
        if (amt > avg * 2 && amt > 500) {
          anomalies.push({
            ...tx,
            average: avg.toFixed(2),
            multiplier: (amt / avg).toFixed(1)
          });
        }
      }
    });

    anomalies.sort((a, b) => b.multiplier - a.multiplier);
    
    res.json(anomalies);
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    res.status(500).json({ error: "Failed to detect anomalies" });
  }
});

// GET /api/insights/recurring -> Detect recurring/subscription transactions
router.get('/recurring', (req, res) => {
  try {
    const allTx = req.db.prepare('SELECT * FROM transactions WHERE amount < 0 ORDER BY date ASC').all();
    
    // Group by description (normalized) and detect patterns
    const descGroups = {};
    allTx.forEach(tx => {
      const key = tx.description.toLowerCase().trim();
      if (!descGroups[key]) descGroups[key] = [];
      descGroups[key].push(tx);
    });

    const recurring = [];

    for (const [desc, txs] of Object.entries(descGroups)) {
      if (txs.length < 2) continue;

      // Check if amounts are similar (within 20% of each other)
      const amounts = txs.map(t => Math.abs(t.amount));
      const avgAmt = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const allSimilar = amounts.every(a => Math.abs(a - avgAmt) / avgAmt < 0.2);

      if (!allSimilar && amounts.length > 2) continue;

      // Calculate intervals between transactions
      const dates = txs.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)));
      }
      
      if (intervals.length === 0) continue;

      const avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);

      // Determine frequency
      let frequency = 'irregular';
      if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
      else if (avgInterval >= 12 && avgInterval <= 16) frequency = 'bi-weekly';
      else if (avgInterval >= 5 && avgInterval <= 9) frequency = 'weekly';
      else if (avgInterval >= 85 && avgInterval <= 95) frequency = 'quarterly';

      if (frequency === 'irregular' && txs.length < 3) continue;

      // Predict next occurrence
      const lastDate = new Date(Math.max(...dates));
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + avgInterval);

      recurring.push({
        description: txs[0].description,
        category: txs[0].category,
        avgAmount: Math.round(avgAmt),
        frequency,
        occurrences: txs.length,
        lastDate: lastDate.toISOString().split('T')[0],
        nextExpected: nextDate.toISOString().split('T')[0],
        intervalDays: avgInterval
      });
    }

    // Sort by frequency importance (monthly first)
    const freqOrder = { monthly: 0, 'bi-weekly': 1, weekly: 2, quarterly: 3, irregular: 4 };
    recurring.sort((a, b) => (freqOrder[a.frequency] || 5) - (freqOrder[b.frequency] || 5));

    res.json(recurring);
  } catch (error) {
    console.error("Error detecting recurring:", error);
    res.status(500).json({ error: "Failed to detect recurring transactions" });
  }
});

// GET /api/insights/comparison -> Category-wise this month vs last month
router.get('/comparison', (req, res) => {
  try {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let prevYear = now.getFullYear();
    let prevMonth = now.getMonth();
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const lastMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const allExpenses = req.db.prepare('SELECT * FROM transactions WHERE amount < 0').all();

    const thisMonthCats = {};
    const lastMonthCats = {};

    allExpenses.forEach(tx => {
      const amt = Math.abs(tx.amount);
      if (tx.date.startsWith(thisMonth)) {
        thisMonthCats[tx.category] = (thisMonthCats[tx.category] || 0) + amt;
      } else if (tx.date.startsWith(lastMonth)) {
        lastMonthCats[tx.category] = (lastMonthCats[tx.category] || 0) + amt;
      }
    });

    // Merge categories
    const allCats = new Set([...Object.keys(thisMonthCats), ...Object.keys(lastMonthCats)]);
    const comparison = [];

    for (const cat of allCats) {
      const curr = thisMonthCats[cat] || 0;
      const prev = lastMonthCats[cat] || 0;
      const change = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : (curr > 0 ? 100 : 0);

      comparison.push({
        category: cat,
        thisMonth: Math.round(curr),
        lastMonth: Math.round(prev),
        change,
        trend: curr > prev ? 'up' : curr < prev ? 'down' : 'same'
      });
    }

    comparison.sort((a, b) => b.thisMonth - a.thisMonth);
    res.json(comparison);
  } catch (error) {
    console.error("Error generating comparison:", error);
    res.status(500).json({ error: "Failed to generate comparison" });
  }
});

// Goals CRUD
// Ensure goals table exists
router.use((req, res, next) => {
  req.db.prepare(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL NOT NULL DEFAULT 0,
      deadline TEXT,
      created_at INTEGER NOT NULL
    )
  `).run();
  next();
});

// GET /api/insights/goals
router.get('/goals', (req, res) => {
  try {
    const goals = req.db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// POST /api/insights/goals
router.post('/goals', (req, res) => {
  try {
    const { name, targetAmount, deadline } = req.body;
    if (!name || !targetAmount) return res.status(400).json({ error: "Name and target amount required" });

    const id = crypto.randomUUID();
    req.db.prepare('INSERT INTO goals (id, name, targetAmount, currentAmount, deadline, created_at) VALUES (?, ?, ?, 0, ?, ?)')
      .run(id, name, targetAmount, deadline || null, Date.now());

    res.json({ id, name, targetAmount, currentAmount: 0, deadline });
  } catch (error) {
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// PUT /api/insights/goals/:id
router.put('/goals/:id', (req, res) => {
  try {
    const { currentAmount } = req.body;
    req.db.prepare('UPDATE goals SET currentAmount = ? WHERE id = ?').run(currentAmount, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// DELETE /api/insights/goals/:id
router.delete('/goals/:id', (req, res) => {
  try {
    req.db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

export default router;

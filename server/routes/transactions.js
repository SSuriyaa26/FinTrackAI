import express from 'express';

import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET all transactions
router.get('/', (req, res) => {
  try {
    const transactions = req.db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// POST new transaction
router.post('/', (req, res) => {
  try {
    const { amount, description, category, date, source } = req.body;
    
    if (amount === undefined || !description || !category || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const created_at = Date.now();

    const insert = req.db.prepare(`
      INSERT INTO transactions (id, amount, description, category, date, source, created_at)
      VALUES (@id, @amount, @description, @category, @date, @source, @created_at)
    `);

    insert.run({ id, amount, description, category, date, source: source || 'manual', created_at });
    
    // Fetch and return the created transaction
    const newTx = req.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json(newTx);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// DELETE transaction
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = req.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    res.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// POST bulk transactions (from screenshot import)
router.post('/bulk', (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "Invalid or empty transactions array" });
    }

    const insert = req.db.prepare(`
      INSERT INTO transactions (id, amount, description, category, date, source, created_at)
      VALUES (@id, @amount, @description, @category, @date, @source, @created_at)
    `);

    const insertMany = req.db.transaction((txs) => {
      const inserted = [];
      const now = Date.now();
      for (const tx of txs) {
        const id = uuidv4();
        insert.run({
          id,
          amount: tx.amount,
          description: tx.description,
          category: tx.category,
          date: tx.date,
          source: tx.source || 'screenshot',
          created_at: now
        });
        inserted.push({ ...tx, id, created_at: now, source: tx.source || 'screenshot' });
      }
      return inserted;
    });

    const result = insertMany(transactions);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in bulk import:", error);
    res.status(500).json({ error: "Failed to import transactions" });
  }
});

export default router;

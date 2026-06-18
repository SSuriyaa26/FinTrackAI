import express from 'express';


const router = express.Router();

// GET all merchant rules
router.get('/', (req, res) => {
  try {
    const rules = req.db.prepare('SELECT * FROM merchant_rules').all();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ error: "Failed to fetch merchant rules" });
  }
});

// POST or UPDATE a merchant rule (upsert)
router.post('/', (req, res) => {
  try {
    const { merchant, category } = req.body;
    
    if (!merchant || !category) {
      return res.status(400).json({ error: "Merchant and category are required" });
    }

    // lowercase merchant for standardizing
    const standardizedMerchant = merchant.toLowerCase().trim();

    const upsert = req.db.prepare(`
      INSERT INTO merchant_rules (merchant, category)
      VALUES (@merchant, @category)
      ON CONFLICT(merchant) DO UPDATE SET category = excluded.category
    `);

    upsert.run({ merchant: standardizedMerchant, category });
    res.status(200).json({ merchant: standardizedMerchant, category });
  } catch (error) {
    console.error("Error saving merchant rule:", error);
    res.status(500).json({ error: "Failed to save merchant rule" });
  }
});

// DELETE a merchant rule
router.delete('/:merchant', (req, res) => {
  try {
    const { merchant } = req.params;
    const result = req.db.prepare('DELETE FROM merchant_rules WHERE merchant = ?').run(merchant.toLowerCase().trim());
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Merchant rule not found" });
    }
    
    res.json({ success: true, message: "Rule deleted" });
  } catch (error) {
    console.error("Error deleting merchant rule:", error);
    res.status(500).json({ error: "Failed to delete merchant rule" });
  }
});

export default router;

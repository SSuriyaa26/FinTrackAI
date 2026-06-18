import express from 'express';


const router = express.Router();

// GET all settings as a JSON object
router.get('/', (req, res) => {
  try {
    const rows = req.db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// POST or UPDATE setting (upsert)
router.post('/', (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: "Key and value are required" });
    }

    const upsert = req.db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    upsert.run({ key, value: String(value) });
    res.status(200).json({ success: true, key, value });
  } catch (error) {
    console.error("Error saving setting:", error);
    res.status(500).json({ error: "Failed to save setting" });
  }
});

export default router;

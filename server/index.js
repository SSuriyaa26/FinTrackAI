import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware to inject the correct profile DB into every request
app.use((req, res, next) => {
  const profileName = req.header('X-Profile-Name') || 'person1';
  try {
    req.db = getDb(profileName);
    next();
  } catch (err) {
    console.error(`Error loading DB for profile ${profileName}:`, err);
    res.status(500).json({ error: "Failed to load profile data" });
  }
});

// Initialize default profile on startup
try { getDb('person1'); } catch(e) {}

// Routes Imports
// TODO: Create and import these files inside routes directory
import transactionsRouter from './routes/transactions.js';
import insightsRouter from './routes/insights.js';
import merchantRulesRouter from './routes/merchantRules.js';
import settingsRouter from './routes/settings.js';

app.use('/api/transactions', transactionsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/merchant-rules', merchantRulesRouter);
app.use('/api/settings', settingsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

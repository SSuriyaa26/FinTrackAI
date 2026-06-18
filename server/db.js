import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const connections = {};

export function getDb(profileName = 'person1') {
  const safeProfile = profileName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'person1';

  // Migrate older database file to new profile format
  const oldPath = 'fintrack.db';
  const newPath = `fintrack_${safeProfile}.db`;
  if (safeProfile === 'person1' && fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    fs.renameSync(oldPath, newPath);
  }

  if (connections[safeProfile]) return connections[safeProfile];

  const db = new Database(newPath);

  // Create tables using transactions
  const init = db.transaction(() => {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS merchant_rules (
        merchant TEXT PRIMARY KEY,
        category TEXT NOT NULL
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `).run();
  });

  init();
  seedData(db, safeProfile);
  connections[safeProfile] = db;
  return db;
}

function seedData(db, profileName) {
  // Check if DB is already seeded by counting transactions
  const count = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
  
  if (count.count > 0) return;

  console.log("Seeding Database with realistic Chennai mock data...");

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, amount, description, category, date, source, created_at)
    VALUES (@id, @amount, @description, @category, @date, @source, @created_at)
  `);

  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO merchant_rules (merchant, category)
    VALUES (@merchant, @category)
  `);

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES (@key, @value)
  `);

  const txData = [];
  const now = new Date();
  
  let salary = 75000;
  let rent = 18000;
  let foodMax = 500;
  let shopMax = 3000;
  let anomaly = 15000;

  if (profileName === 'person2') {
    salary = 150000;
    rent = 40000;
    foodMax = 1500;
    shopMax = 12000;
    anomaly = 55000;
  } else if (profileName === 'person3') {
    salary = 35000;
    rent = 10000;
    foodMax = 300;
    shopMax = 1500;
    anomaly = 7000;
  }
  
  // Generating realistic Chennai data for past 90 days.
  for (let i = 0; i < 3; i++) {
    const monthBaseDate = new Date();
    monthBaseDate.setMonth(now.getMonth() - i);
    monthBaseDate.setDate(1); // Salary day

    // Skip salary if today's date is less than the 1st
    if (monthBaseDate > now) continue;

    // Income
    txData.push({
      id: uuidv4(),
      amount: salary,
      description: "Salary Credit - Infosys",
      category: "Income",
      date: monthBaseDate.toISOString().split('T')[0],
      source: "manual",
      created_at: Date.now() - (i * 30 * 24 * 60 * 60 * 1000)
    });

    // Rent
    const rentDate = new Date(monthBaseDate);
    rentDate.setDate(5);
    if (rentDate <= now) {
      txData.push({
        id: uuidv4(),
        amount: -rent,
        description: "Rent Transfer - Landlord OMR",
        category: "Housing",
        date: rentDate.toISOString().split('T')[0],
        source: "manual",
        created_at: Date.now()
      });
    }

    // EB Bill
    const ebDate = new Date(monthBaseDate);
    ebDate.setDate(10);
    if (ebDate <= now) {
      txData.push({
        id: uuidv4(),
        amount: -1200,
        description: "TNEB Bill Payment",
        category: "Utilities",
        date: ebDate.toISOString().split('T')[0],
        source: "manual",
        created_at: Date.now()
      });
    }

    // Jio Recharge
    const jioDate = new Date(monthBaseDate);
    jioDate.setDate(15);
    if (jioDate <= now) {
      txData.push({
        id: uuidv4(),
        amount: -666,
        description: "Jio Prepaid Recharge",
        category: "Utilities",
        date: jioDate.toISOString().split('T')[0],
        source: "manual",
        created_at: Date.now()
      });
    }

    // Groceries & Food apps spread across the month
    for(let d = 1; d <= 28; d += Math.floor(Math.random() * 5) + 2) {
      const foodDate = new Date(monthBaseDate);
      foodDate.setDate(d);
      
      if (foodDate > now) continue;
      
      const isSwiggy = Math.random() > 0.5;
      txData.push({
        id: uuidv4(),
        amount: isSwiggy ? -(Math.floor(Math.random() * foodMax) + 150) : -(Math.floor(Math.random() * (foodMax / 2)) + 50),
        description: isSwiggy ? "Swiggy - A2B" : "Zomato - SS Hyderabad Biryani",
        category: "Food",
        date: foodDate.toISOString().split('T')[0],
        source: "manual",
        created_at: Date.now()
      });
    }

    // Transport (Ola/Uber/Metro)
    for(let d = 2; d <= 28; d += Math.floor(Math.random() * 3) + 1) {
      const transportDate = new Date(monthBaseDate);
      transportDate.setDate(d);
      if (transportDate > now) continue;
      const isOla = Math.random() > 0.4;
      txData.push({
        id: uuidv4(),
        amount: isOla ? -(Math.floor(Math.random() * 350) + 100) : -40, // Metro is 40
        description: isOla ? "Ola Rides - Office to Home" : "Chennai Metro Smartcard Recharge",
        category: "Transport",
        date: transportDate.toISOString().split('T')[0],
        source: "manual",
        created_at: Date.now()
      });
    }

    // Shopping
    const shopDate = new Date(monthBaseDate);
    shopDate.setDate(20);
    if (shopDate <= now) {
      txData.push({
        id: uuidv4(),
        amount: -(Math.floor(Math.random() * shopMax) + 1000),
        description: "Amazon India - Electronics",
        category: "Shopping",
        date: shopDate.toISOString().split('T')[0],
        source: "manual",
        created_at: Date.now()
      });
    }

    // Anomaly on the most recent month for alerts
    if (i === 0) {
      const anomalyDate = new Date(monthBaseDate);
      anomalyDate.setDate(22);
      if (anomalyDate <= now) {
        txData.push({
          id: uuidv4(),
          amount: -anomaly,
          description: "Apple Store - AirPods Pro",
          category: "Shopping",
          date: anomalyDate.toISOString().split('T')[0],
          source: "manual",
          created_at: Date.now()
        });
      }
    }
  }

  // Common Merchant Rules
  const rulesData = [
    { merchant: "swiggy", category: "Food" },
    { merchant: "zomato", category: "Food" },
    { merchant: "ola", category: "Transport" },
    { merchant: "uber", category: "Transport" },
    { merchant: "amazon", category: "Shopping" },
    { merchant: "tneb", category: "Utilities" },
    { merchant: "jio", category: "Utilities" },
    { merchant: "airtel", category: "Utilities" },
    { merchant: "metro", category: "Transport" }
  ];

  // Default Settings
  const settingsData = [
    { key: "monthlyBudget", value: "30000" },
    { key: "darkMode", value: "true" },
    { key: "geminiApiKey", value: "" }
  ];

  const seedTransaction = db.transaction(() => {
    txData.forEach(tx => insertTx.run(tx));
    rulesData.forEach(rule => insertRule.run(rule));
    settingsData.forEach(setting => insertSetting.run(setting));
  });

  seedTransaction();
  console.log(`Database seeded successfully for profile.`);
}

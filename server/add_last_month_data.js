import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const databases = [
  'fintrack_person1.db',
  'fintrack_person2.db',
  'fintrack_person3.db',
  'fintrack_default.db',
  'fintrack_business.db',
  'fintrack_spouse.db'
];

const today = new Date();
const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const lastMonthPrefix = lastMonthDate.toISOString().split('T')[0].substring(0, 7); // e.g. "2026-05"

console.log(`Last month prefix detected: ${lastMonthPrefix}`);

databases.forEach(dbFile => {
  if (!fs.existsSync(dbFile)) {
    console.log(`Skipping non-existent database: ${dbFile}`);
    return;
  }

  console.log(`Adding transactions for last month to ${dbFile}...`);
  const db = new Database(dbFile);

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, amount, description, category, date, source, created_at)
    VALUES (@id, @amount, @description, @category, @date, @source, @created_at)
  `);

  const mockTxs = [
    {
      id: uuidv4(),
      amount: -350.00,
      description: "Zomato - SS Hyderabad Biryani",
      category: "Food",
      date: `${lastMonthPrefix}-10`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -180.00,
      description: "Ola Auto Ride",
      category: "Transport",
      date: `${lastMonthPrefix}-12`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -950.00,
      description: "Amazon India - Books & Stationery",
      category: "Shopping",
      date: `${lastMonthPrefix}-14`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -649.00,
      description: "Netflix Subscription",
      category: "Entertainment",
      date: `${lastMonthPrefix}-15`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -700.00,
      description: "Nilgiris Grocery Supermarket",
      category: "Food",
      date: `${lastMonthPrefix}-16`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -500.00,
      description: "Swiggy - A2B Veg Restaurant",
      category: "Food",
      date: `${lastMonthPrefix}-20`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -220.00,
      description: "Uber Moto Ride",
      category: "Transport",
      date: `${lastMonthPrefix}-22`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      amount: -1050.00,
      description: "TNEB Electricity Bill",
      category: "Utilities",
      date: `${lastMonthPrefix}-10`,
      source: "manual",
      created_at: Date.now() - (30 * 24 * 60 * 60 * 1000)
    }
  ];

  const insertMany = db.transaction((txs) => {
    txs.forEach(tx => insertTx.run(tx));
  });

  try {
    insertMany(mockTxs);
    console.log(`Successfully inserted ${mockTxs.length} transactions into ${dbFile}.`);
  } catch (err) {
    console.error(`Error inserting into ${dbFile}:`, err);
  } finally {
    db.close();
  }
});

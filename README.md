# 💸 FinTrack AI — Smart Personal Finance Tracker

> **Hackathon Project** · Built for the March 2025 Hackathon  
> A full-stack AI-powered personal finance tracker tailored for the Indian market.

---

## 🚀 Overview

**FinTrack AI** is a personal finance management web application that helps individuals and families track their income, expenses, and savings goals in real time. It features AI-generated spending digests, anomaly detection, month-over-month comparison, a "What-If" budget simulator, and support for multiple household profiles — all in a sleek dark-mode interface.

---

## ✨ Features

### 📊 Dashboard
- **Live financial summary** — This month's income, expenses, and cumulative balance at a glance
- **Financial Health Score** — Calculated dynamically using savings rate, budget adherence, and category balance (50/30/20 rule)
- **Spending Pie Chart** — Visual breakdown of expenses by category
- **Monthly Bar Chart** — Side-by-side comparison across months
- **Trend Line Chart** — Cumulative spending/income trajectory
- **Recent Transactions** — Scrollable transaction feed with color-coded amounts
- **CSV Export** — One-click download of all transactions

### 🧠 Insights (AI-Powered)
- **AI Weekly Digest** — Gemini-powered natural-language summary of your spending patterns with actionable tips. Falls back to a smart mock digest when offline.
- **AI Chat Assistant** — Ask any finance question in plain English ("Am I overspending on food?"). Works in demo mode without an API key.
- **Anomaly Detection** — Flags transactions that are >2× the category average (and >₹500) with a multiplier score
- **Recurring Subscriptions** — Automatically detects recurring charges from transaction history
- **Month-over-Month Comparison** — Table showing spend by category vs last month, with trend arrows
- **Savings Goals** — Create, track, and delete named savings goals with deadlines and progress bars
- **50/30/20 Budget Simulator (What-If Analysis)** — Drag sliders to reduce Needs/Wants spending and see projected extra savings in real time
- **Forecasting** — Extrapolates end-of-month spend based on current daily burn rate with projected savings

### ➕ Add Transaction
- Manual entry form with category selection, date picker, and description
- Smart merchant auto-categorization using saved merchant rules

### 📸 Import Screenshot
- Paste or upload bank statement screenshots (image-to-text extraction for transaction import)

### 🏪 Merchant Rules
- Create and manage rules to auto-categorize transactions by merchant name

### ⚙️ Settings
- Profile selection (switch between household members)
- Monthly budget target configuration
- Gemini API key setup (optional — app works fully in demo mode without it)
- Currency and notification preferences

---

## 👥 Multi-Profile Support

FinTrack AI supports up to **6 independent financial profiles** in the same household, each with its own isolated SQLite database:

| Profile | Use Case |
|---|---|
| `person1` | Primary earner |
| `person2` | Secondary earner |
| `person3` | Teenager / student |
| `spouse` | Partner account |
| `business` | Freelance / side business |
| `default` | Shared household |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Framer Motion |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Routing** | React Router DOM |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite via `better-sqlite3` |
| **AI** | Google Gemini 2.5 Flash API |
| **Styling** | Custom CSS (dark mode, glassmorphism) |

---

## 📁 Project Structure

```
hackathon/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx          # Main dashboard with charts
│       │   ├── Insights.jsx           # AI insights, anomalies, simulator
│       │   ├── AddTransaction.jsx     # Manual transaction entry
│       │   ├── ImportScreenshot.jsx   # Image-based import
│       │   ├── MerchantRules.jsx      # Merchant rule manager
│       │   └── Settings.jsx           # App settings & profile switch
│       ├── components/
│       │   ├── Charts/                # Pie, Bar, Line chart components
│       │   ├── TransactionList.jsx    # Transaction feed
│       │   ├── HealthScore.jsx        # Animated health score ring
│       │   └── AlertBanner.jsx        # Dismissible alert UI
│       ├── context/
│       │   └── FinanceContext.jsx     # Global state + Axios instance
│       └── utils/
│           ├── insights.js            # 50/30/20 calculator, health score
│           └── csvExport.js           # CSV download helper
│
└── server/                    # Express backend
    ├── index.js               # Server entry point + route wiring
    ├── db.js                  # SQLite connection pool + seed data
    ├── routes/
    │   ├── transactions.js    # CRUD for transactions
    │   ├── insights.js        # AI digest, chat, anomalies, comparison
    │   ├── merchantRules.js   # Merchant rule CRUD
    │   └── settings.js        # Settings key-value store
    └── fintrack_*.db          # Per-profile SQLite databases (auto-created)
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** v18+ and **npm**
- (Optional) A [Google Gemini API Key](https://aistudio.google.com/app/apikey) for AI features

### Installation & Run

**1. Install dependencies for both server and client:**
```bash
# From the project root
cd server && npm install
cd ../client && npm install
```

**2. Start the backend (port 3001):**
```bash
cd server
npm run dev
```

**3. Start the frontend (port 5173):**
```bash
cd client
npm run dev
```

**4. Open in browser:**
```
http://localhost:5173
```

> The app works **fully in demo mode** without a Gemini API key. AI features will return realistic mock responses.

### Optional: Add Gemini API Key
1. Go to **Settings** in the app
2. Paste your Gemini API Key
3. Click **Save** — AI digest and chat will switch to live mode automatically

---

## 🔌 API Reference

All endpoints accept a `X-Profile-Name` header to target a specific profile database.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/transactions` | List all transactions |
| `POST` | `/api/transactions` | Add a new transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `POST` | `/api/transactions/bulk` | Bulk insert transactions |
| `GET` | `/api/insights/digest` | AI-generated weekly digest |
| `POST` | `/api/insights/chat` | AI chat assistant |
| `GET` | `/api/insights/anomalies` | Detect spending anomalies |
| `GET` | `/api/insights/recurring` | Detect recurring charges |
| `GET` | `/api/insights/comparison` | Month-over-month comparison |
| `GET` | `/api/insights/goals` | List savings goals |
| `POST` | `/api/insights/goals` | Create a savings goal |
| `DELETE` | `/api/insights/goals/:id` | Delete a savings goal |
| `GET` | `/api/merchant-rules` | List merchant auto-rules |
| `POST` | `/api/merchant-rules` | Add a merchant rule |
| `DELETE` | `/api/merchant-rules/:merchant` | Delete a merchant rule |
| `GET` | `/api/settings` | Get all settings |
| `POST` | `/api/settings` | Save a setting key-value |

---

## 🤖 AI Features — Demo Mode

FinTrack AI is designed to work **without** an API key for hackathon demos:

| Feature | With API Key | Without API Key |
|---|---|---|
| Weekly Digest | ✅ Live Gemini response | ✅ Realistic mock digest |
| Chat Assistant | ✅ Live Gemini response | ✅ Smart contextual mock |
| Anomaly Detection | ✅ Real data | ✅ Real data |
| Forecasting | ✅ Real data | ✅ Real data |
| What-If Simulator | ✅ Real data | ✅ Real data |

---

## 📸 Screenshots

The app features a premium dark-mode UI with glassmorphism effects, animated transitions, and a custom financial health score ring.

Key screens:
- **Dashboard** — Overview cards, spending pie, monthly bar chart, transaction feed
- **Insights** — AI digest, anomaly table, recurring subscriptions, comparison table, goal tracker, budget simulator
- **Add Transaction** — Clean form with smart merchant categorization

---

## 🏆 Hackathon Highlights

- **Zero setup friction** — Works fully offline in demo mode, no API key needed
- **Realistic Indian data** — Pre-seeded with authentic Chennai-based transactions (Swiggy, Ola, Jio, TNEB, etc.)
- **Multi-profile architecture** — Isolated SQLite DB per family member, switchable in one click
- **AI-grade UX** — Framer Motion animations, staggered card reveals, responsive layout
- **Production-ready backend** — Express middleware pipeline, error boundaries, graceful fallbacks

---

## 👨‍💻 Author

Built with ❤️ for the hackathon.  
*FinTrack AI — Making personal finance feel intelligent, not intimidating.*
# FinTrack AI — Intelligent Personal Finance Management System

> A production-grade, full-stack web application for personal and household financial analytics, powered by Large Language Models, rule-based anomaly detection, and real-time statistical forecasting.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [AI & Machine Learning Subsystems](#4-ai--machine-learning-subsystems)
5. [Core Technical Concepts](#5-core-technical-concepts)
6. [Feature Specification](#6-feature-specification)
7. [Technology Stack](#7-technology-stack)
8. [Data Architecture](#8-data-architecture)
9. [API Reference](#9-api-reference)
10. [Local Development Setup](#10-local-development-setup)
11. [Configuration](#11-configuration)
12. [Real World Impact](#12-real-world-impact)
13. [Deployment Guide](#13-deployment-guide)

---

## 1. Problem Statement

### The Gap in Personal Financial Awareness

Despite the rapid proliferation of digital payments in India — driven by UPI, mobile wallets, and net banking — a majority of households lack structured visibility into their own financial behaviour. Transactions are spread across multiple bank accounts, payment apps, and credit cards, each generating data in isolation. The net effect is that users experience **financial opacity**: they know money is leaving, but not where it goes, how fast, or whether it deviates from their own historical norms.

Existing solutions fail on at least one of the following dimensions:

| Problem | Existing Tool Limitation |
|---|---|
| **Data Fragmentation** | Banking apps show only one account's transactions — no unified view |
| **No Behavioural Intelligence** | Traditional trackers record spend but offer no pattern analysis or anomaly flagging |
| **Household Blindspot** | Finance tools are built for individuals, not multi-member households with shared and separate expenses |
| **AI as a Gimmick** | Most "AI-powered" finance apps surface generic advice, not reasoning grounded in the user's actual transaction history |
| **Friction at Entry** | Cloud-connected tools require OAuth integrations or account linking — high setup friction, high privacy risk |

### What FinTrack AI Solves

**FinTrack AI** addresses these gaps by rethinking personal finance as a **data intelligence problem**, not merely a ledger management problem.

**1. Unified Household Ledger with Profile Isolation**  
The platform supports multiple independent financial profiles within a single application instance. Each family member maintains a fully isolated SQLite database — no cross-contamination of data, no shared authentication bottleneck. A single household can track individual and shared finances simultaneously, switchable in one click.

**2. Behavioural Anomaly Detection Without a Data Science Team**  
Rather than passively displaying transactions, FinTrack AI continuously analyzes spend patterns to flag statistically significant deviations. A ₹850 grocery bill might look normal in isolation — but if the user's category average is ₹350, the system surfaces it immediately with a computed anomaly multiplier. This gives users the equivalent of a personal financial auditor embedded in their daily workflow.

**3. LLM-Powered Financial Reasoning Grounded in Real Data**  
The AI layer does not offer generic budgeting tips. It reasons over the user's actual transaction history — top categories, spend spikes, savings trajectory — and generates a concise, personalized narrative. The conversational assistant applies the same context augmentation, enabling users to ask natural-language questions ("Am I on track this month?") and receive answers that are arithmetically grounded rather than templated.

**4. Predictive Spend Visibility**  
By extrapolating current burn rate to the end of the month, the system shifts the user's mental model from *reactive* (reviewing past spend) to *proactive* (anticipating future spend before it occurs). This is particularly valuable for salaried employees managing a fixed monthly budget.

**5. Privacy-First, Zero-Cloud Data Model**  
All transaction data is stored locally in SQLite files on the user's own machine. No data is transmitted to any external server except for optional LLM inference calls to the Gemini API (which contain only anonymized aggregates, not raw transactions). This design respects data sovereignty and eliminates dependency on third-party financial data brokers.

### Target Users

- Salaried professionals tracking monthly budget adherence
- Households where multiple earners maintain separate and joint expenses
- Freelancers managing business and personal finances in parallel
- Individuals seeking actionable intelligence, not just transaction logging

---

## 2. Project Overview

**FinTrack AI** is a full-stack personal finance intelligence platform that combines structured financial data management with AI-driven behavioural analysis. The system processes transactional data to surface actionable insights using a layered approach: deterministic rule-based algorithms at the base, statistical models in the middle tier, and a Large Language Model (LLM) integration at the top for natural-language reasoning and narrative generation.

The platform is designed around a **multi-tenant, profile-isolated data model**, enabling multiple users within a single household to maintain independent financial ledgers while sharing the same application instance.

### Design Principles

- **Graceful Degradation** — All AI-powered features implement deterministic fallback logic, ensuring full functionality in offline or API-constrained environments.
- **Separation of Concerns** — A strict client-server split with a RESTful API boundary ensures the frontend is stateless with respect to persistence.
- **Real-time Reactivity** — Frontend state is managed via a centralized React Context that propagates data mutations instantly across all subscribed components.
- **Profile Isolation** — Each user profile maps to a dedicated SQLite database instance, preventing data cross-contamination and simplifying backup/restore operations.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                 │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  Dashboard  │   │   Insights   │   │  Settings /  │  │
│  │  (Charts,   │   │  (AI Digest, │   │  Rules /     │  │
│  │   KPIs)     │   │  Simulator)  │   │  Import)     │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬───────┘  │
│         └─────────────────┴──────────────────┘          │
│                      FinanceContext                      │
│              (Global State + Axios Instance)             │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP / REST  (X-Profile-Name header)
┌───────────────────────────▼──────────────────────────────┐
│                   SERVER (Node.js + Express)              │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Transactions │  │    Insights   │  │   Settings / │  │
│  │    Router    │  │    Router     │  │  MerchantRules│ │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘  │
│         └─────────────────┴──────────────────┘          │
│                    DB Middleware Layer                    │
│              (Profile → SQLite Connection Pool)          │
└───────────────────────────┬──────────────────────────────┘
                            │
         ┌──────────────────┴─────────────────┐
         │                                    │
┌────────▼────────┐                 ┌─────────▼────────┐
│  SQLite (per    │                 │  Gemini 2.5 Flash │
│  profile .db)   │                 │  API (LLM Layer)  │
└─────────────────┘                 └──────────────────┘
```

### Request Lifecycle

Every HTTP request passes through a **profile-resolution middleware** that reads the `X-Profile-Name` header, resolves the corresponding SQLite file path, retrieves a cached database connection from the connection pool, and attaches it to `req.db`. Downstream route handlers operate exclusively on this injected connection, making them inherently stateless and profile-agnostic.

---

## 3. AI & Machine Learning Subsystems

### 3.1 Large Language Model Integration (Generative AI)

The system integrates **Google Gemini 2.5 Flash** — a multimodal, instruction-tuned LLM — via direct REST API calls using structured prompt engineering.

**Weekly Digest Generation**
- Retrieves the last 30 days of transaction records from the user's ledger.
- Constructs a **zero-shot prompt** containing the serialized transaction list in JSON, instructing the model to perform category aggregation, spike identification, and financial tip generation within a constrained 3-sentence output format.
- The model performs **in-context reasoning** over tabular financial data without any fine-tuning, demonstrating the generalization capability of modern foundation models.

**Conversational Finance Assistant (RAG-lite)**
- Implements a stateless chat interface where each user query is augmented with a financial context summary (total income, total expenses, top categories) before being sent to the LLM.
- This pattern is a simplified form of **Retrieval-Augmented Generation (RAG)**: instead of retrieving from a vector store, structured aggregations from the SQL database are injected as context into the prompt.
- The assistant can answer free-form queries such as budget adherence checks, category comparisons, and savings recommendations.

**Resilience Pattern**
- All LLM calls are wrapped in try-catch error boundaries. On any failure (quota exhaustion, network timeout, API key absence), the system returns a pre-authored **deterministic mock response** that is contextually appropriate, ensuring zero disruption to the user experience.

### 3.2 Statistical Anomaly Detection

The anomaly detection module implements a **z-score-style threshold classifier** over spending data:

```
anomaly_score(tx) = amount(tx) / category_mean_amount
flag if: anomaly_score > 2.0 AND amount > ₹500
```

**Algorithm Steps:**
1. Aggregate all historical expense transactions grouped by `category`.
2. Compute the **arithmetic mean** spend per category over the entire transaction history.
3. For each current-month transaction, calculate the ratio of the transaction amount to its category mean (the **anomaly multiplier**).
4. Flag transactions where this multiplier exceeds 2.0 — meaning the spend is more than **2 standard deviations above the expected** for that category.
5. Results are ranked by descending multiplier, presenting the highest-risk outliers first.

This is a rule-based anomaly detection approach equivalent in concept to **Isolation Forest** or **LOF** for univariate, category-stratified time-series data, but implemented deterministically for real-time inference without a training phase.

### 3.3 Recurring Charge Detection (Pattern Recognition)

The recurring subscription detector applies **string normalization and frequency analysis** to identify periodic charges:

1. All expense transaction descriptions are normalized (lowercased, trimmed).
2. Transactions are grouped by normalized description key.
3. For each group with `count ≥ 2`, the system computes the **inter-transaction time deltas** (days between consecutive charges).
4. Groups are classified as `monthly` (delta ≈ 28–31 days), `weekly` (delta ≈ 7 days), or `irregular` based on the median delta.
5. Only groups with consistent temporal patterns are surfaced as confirmed recurring subscriptions.

This is a lightweight implementation of **sequence pattern mining** applied to financial time-series data.

### 3.4 Predictive Spend Forecasting

The month-end forecast is computed via **linear extrapolation** on the current month's cumulative spend:

```
daily_burn_rate = total_spend_to_date / days_elapsed
projected_month_end_spend = daily_burn_rate × total_days_in_month
projected_savings = monthly_budget - projected_month_end_spend
```

This is a **first-order linear trend model** (equivalent to simple linear regression with a zero intercept), applied as a heuristic for short-horizon financial forecasting. While more sophisticated models (ARIMA, LSTM, Prophet) exist for time-series forecasting, the linear model is appropriate here given the short prediction horizon (days within a month) and the low variance of fixed recurring expenses.

### 3.5 What-If Budget Simulation

The budget simulator implements **counterfactual analysis** — a core technique in causal inference and decision support systems:

- The 50/30/20 framework partitions monthly spending into Needs (≤50%), Wants (≤30%), and Savings (≥20%) of net income.
- The user applies percentage reduction parameters (`reduceNeeds`, `reduceWants`) via interactive sliders.
- The system instantly recomputes the projected extra savings under the hypothetical spending regime.
- This enables **sensitivity analysis**: the user can observe how marginal changes in spending behaviour propagate to savings outcomes, supporting evidence-based financial decision-making.

### 3.6 Financial Health Score (Composite Metric)

The health score is a **weighted composite index** computed from three sub-metrics:

| Sub-metric | Weight | Computation |
|---|---|---|
| Savings Rate | 40% | `(income - expense) / income × 100` |
| Budget Adherence | 40% | `1 - (expense / monthly_budget)`, clamped to [0, 1] |
| 50/30/20 Compliance | 20% | Percentage of rules satisfied |

The final score is normalized to [0, 100] and mapped to a qualitative grade (Excellent / Good / Fair / Needs Work). This is analogous to composite scoring in **multi-criteria decision analysis (MCDA)** and credit risk scoring models.

---

## 4. Core Technical Concepts

### 4.1 Multi-Tenant Data Isolation via Connection Pooling

The backend implements a **profile-keyed in-memory connection pool** (`connections` map in `db.js`). On first access, a new `better-sqlite3` database handle is created, the schema is initialized via `CREATE TABLE IF NOT EXISTS`, and seed data is populated. Subsequent requests reuse the cached handle, avoiding repeated file open syscalls.

This pattern mirrors **connection pooling** in production database systems (e.g., PgBouncer for PostgreSQL) — trading memory for reduced I/O latency.

### 4.2 Context API as a Reactive State Container

The frontend uses React's **Context API + useReducer / useState** pattern as a lightweight alternative to Redux. `FinanceContext` acts as the single source of truth for:
- The full transaction ledger (fetched on profile switch)
- User settings (budget, currency, API key)
- The Axios instance (pre-configured with the `X-Profile-Name` header)

All child components subscribe to this context, ensuring that a single data mutation (e.g., adding a transaction) propagates reactively to the Dashboard charts, the Insights anomaly detector, and the health score — with no prop-drilling.

### 4.3 RESTful API Design with Middleware Injection

The Express server follows the **Middleware Chain** architectural pattern:
1. `cors()` — Cross-Origin Resource Sharing headers
2. `express.json({ limit: '10mb' })` — Request body parsing
3. **Profile DB Middleware** — Resolves and injects `req.db` based on header
4. **Route Handlers** — Business logic, operating on `req.db`

This is a form of **dependency injection** at the HTTP layer — route handlers declare a dependency on `req.db` without being responsible for its construction or lifecycle management.

### 4.4 Deterministic Seeding and Reproducible State

The `seedData` function in `db.js` uses an idempotency check (`COUNT(*) > 0`) to ensure seed transactions are inserted exactly once. This is the **idempotency pattern** commonly applied in database migrations and distributed systems to make operations safe to retry.

---

## 5. Feature Specification

### Dashboard
| Feature | Description |
|---|---|
| KPI Cards | This-month income, expenses, and total portfolio balance |
| Financial Health Score | Real-time composite score with animated ring visualization |
| Spending Pie Chart | Category distribution of expenses (Recharts `PieChart`) |
| Monthly Bar Chart | Month-over-month income vs. expense comparison |
| Trend Line Chart | Cumulative balance trajectory over time |
| Transaction Feed | Paginated, color-coded recent transaction list |
| CSV Export | Client-side CSV serialization of the full ledger |

### Insights Engine
| Feature | Description |
|---|---|
| AI Digest | LLM-generated narrative analysis of last 30-day spend |
| AI Chat Assistant | Context-augmented conversational financial advisor |
| Anomaly Detection | Statistical outlier flagging with multiplier score |
| Recurring Detection | Frequency-based subscription identification |
| MoM Comparison | Category-level delta table with trend classification |
| Savings Goals | Goal CRUD with deadline tracking and progress metrics |
| Forecasting | Linear extrapolation of end-of-month spend |
| What-If Simulator | Counterfactual 50/30/20 budget sensitivity analysis |

### Data Management
| Feature | Description |
|---|---|
| Manual Entry | Form-based transaction creation with category selection |
| Screenshot Import | OCR-based bank statement parsing from image uploads |
| Merchant Rules | Regex/keyword-based auto-categorization rules |
| Multi-Profile | Per-profile isolated SQLite databases |

---

## 6. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 18 (Vite) | Component model, concurrent rendering, fast HMR |
| **State Management** | React Context API | Sufficient for single-source global state without Redux overhead |
| **Animation** | Framer Motion | Declarative physics-based animations, layout transitions |
| **Data Visualization** | Recharts | SVG-based, React-native charting with composable APIs |
| **HTTP Client** | Axios | Interceptor support for header injection, error boundary integration |
| **Routing** | React Router DOM v6 | Declarative client-side routing |
| **Backend Runtime** | Node.js 18+ (ESM) | Non-blocking I/O, native `fetch` API for LLM calls |
| **Web Framework** | Express.js | Minimal, middleware-composable HTTP server |
| **Database** | SQLite via `better-sqlite3` | Zero-config, synchronous API, per-profile file isolation |
| **LLM** | Google Gemini 2.5 Flash | Low-latency inference, strong instruction following, multimodal |
| **Process Manager** | Nodemon (dev) | Auto-restart on file change for rapid iteration |

---

## 7. Data Architecture

### Database Schema

Each profile database (`fintrack_<profile>.db`) contains three tables:

```sql
-- Financial Ledger
CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,  -- UUID v4
  amount      REAL NOT NULL,     -- Positive = income, negative = expense
  description TEXT NOT NULL,     -- Merchant or memo
  category    TEXT NOT NULL,     -- Enumerated: Food, Transport, Housing, etc.
  date        TEXT NOT NULL,     -- ISO 8601 date (YYYY-MM-DD)
  source      TEXT NOT NULL,     -- 'manual' | 'import' | 'screenshot'
  created_at  INTEGER NOT NULL   -- Unix timestamp (ms)
);

-- Merchant Auto-Categorization Rules
CREATE TABLE merchant_rules (
  merchant  TEXT PRIMARY KEY,   -- Normalized merchant name substring
  category  TEXT NOT NULL       -- Target category for matching transactions
);

-- Application Settings (Key-Value Store)
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,       -- e.g., 'geminiApiKey', 'monthlyBudget'
  value TEXT NOT NULL
);
```

### Profile Data Model

```
fintrack_person1.db   → Primary user ledger
fintrack_person2.db   → Secondary user ledger
fintrack_person3.db   → Tertiary user ledger
fintrack_spouse.db    → Partner ledger
fintrack_business.db  → Business/freelance ledger
fintrack_default.db   → Shared/fallback ledger
```

Each database is fully self-contained. Profile switching is achieved by changing the `X-Profile-Name` request header, which the server's DB middleware resolves to the corresponding file.

### Signed Amount Convention

The system uses a **signed amount convention** throughout the data model:

- `amount > 0` → Income / credit
- `amount < 0` → Expense / debit

This eliminates the need for a separate `type` field and simplifies aggregation queries (`SUM(amount)` directly yields net balance).

---

## 8. API Reference

All endpoints are prefixed with the base URL `http://localhost:3001`. Every request must include the `X-Profile-Name` header to specify the target profile database (defaults to `person1` if omitted).

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | Retrieve all transactions, ordered by date descending |
| `POST` | `/api/transactions` | Insert a single transaction (generates UUID server-side) |
| `DELETE` | `/api/transactions/:id` | Delete a transaction by UUID |
| `POST` | `/api/transactions/bulk` | Bulk insert an array of transactions |

### Insights & Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/insights/digest` | Generate LLM narrative digest of last 30-day spend |
| `POST` | `/api/insights/chat` | Conversational query against financial context |
| `GET` | `/api/insights/anomalies` | Return transactions with anomaly multiplier > 2× |
| `GET` | `/api/insights/recurring` | Detect recurring charge patterns |
| `GET` | `/api/insights/comparison` | Month-over-month category spend delta |
| `GET` | `/api/insights/goals` | List all savings goals |
| `POST` | `/api/insights/goals` | Create a savings goal |
| `DELETE` | `/api/insights/goals/:id` | Delete a savings goal by ID |

### Merchant Rules

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/merchant-rules` | List all auto-categorization rules |
| `POST` | `/api/merchant-rules` | Create a merchant rule |
| `DELETE` | `/api/merchant-rules/:merchant` | Delete a rule by merchant key |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/settings` | Retrieve all settings as key-value pairs |
| `POST` | `/api/settings` | Upsert a setting (`key`, `value`) |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns server uptime status and UTC timestamp |

---

## 9. Local Development Setup

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- Google Gemini API Key *(optional — system operates in fallback mode without it)*

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fintrack-ai

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running in Development Mode

Open two terminal sessions:

**Terminal 1 — Backend (port 3001)**
```bash
cd server
npm run dev        # Starts Express with Nodemon auto-reload
```

**Terminal 2 — Frontend (port 5173)**
```bash
cd client
npm run dev        # Starts Vite dev server with HMR
```

Access the application at `http://localhost:5173`.

The backend API is available at `http://localhost:3001`. On first run, the database layer will auto-initialize schema and seed realistic transaction data for the default profile.

---

## 10. Configuration

### Environment Variables (Server)

Create a `.env` file in the `server/` directory:

```env
PORT=3001                          # HTTP server port (default: 3001)
GEMINI_API_KEY=<your-api-key>      # Optional: overrides DB-stored key
```

### In-App Settings

The Gemini API key can also be configured through the application's **Settings** interface, where it is persisted to the profile's `settings` table. This in-app key takes precedence for the active profile. When no key is configured, all LLM-dependent endpoints automatically serve deterministic, contextually appropriate fallback responses — ensuring the system remains fully functional in air-gapped or demo environments.

### LLM Fallback Behaviour

| Condition | Behaviour |
|---|---|
| API key present, Gemini available | Live LLM inference |
| API key present, Gemini rate-limited | Deterministic mock response (no error) |
| API key absent | Deterministic mock response (no error) |

All analytical features (anomaly detection, forecasting, comparison, recurring detection) operate entirely on local SQLite data and are unaffected by LLM availability.

---

## Project Structure

```
fintrack-ai/
├── client/                         # React 18 SPA (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx       # KPI cards, charts, transaction feed
│       │   ├── Insights.jsx        # AI digest, anomalies, simulator, goals
│       │   ├── AddTransaction.jsx  # Manual ledger entry
│       │   ├── ImportScreenshot.jsx# OCR-based statement import
│       │   ├── MerchantRules.jsx   # Auto-categorization rule management
│       │   └── Settings.jsx        # Profile, budget, API key configuration
│       ├── components/
│       │   ├── Charts/             # Recharts wrappers (Pie, Bar, Line)
│       │   ├── TransactionList.jsx # Virtualized transaction feed
│       │   ├── HealthScore.jsx     # Animated composite score ring
│       │   └── AlertBanner.jsx     # Dismissible notification component
│       ├── context/
│       │   └── FinanceContext.jsx  # Global state, Axios instance, profile management
│       └── utils/
│           ├── insights.js         # 50/30/20 calculator, health score algorithm
│           └── csvExport.js        # Client-side CSV serialization
│
└── server/                         # Express.js REST API
    ├── index.js                    # Server bootstrap, middleware chain, route registration
    ├── db.js                       # Connection pool, schema init, data seeding
    ├── routes/
    │   ├── transactions.js         # Ledger CRUD + bulk import
    │   ├── insights.js             # AI/analytics endpoints
    │   ├── merchantRules.js        # Categorization rule CRUD
    │   └── settings.js             # Key-value settings store
    └── fintrack_*.db               # Auto-generated per-profile SQLite files
```

---

## 12. Real World Impact

### The Problem Scale

Over **900 million** Indians now transact digitally (NPCI, 2024). UPI alone processes more than 13 billion transactions per month. Yet financial literacy tools have not kept pace — the majority of users have no structured view of where their money actually goes. An estimated **78% of Indian salaried employees** do not track their monthly expenses beyond checking their bank balance (SEBI Investor Survey, 2023). The gap between transacting and understanding is enormous.

FinTrack AI addresses this at the intersection of three trends: the ubiquity of digital payments, the democratisation of LLM access, and the growing demand for personal data sovereignty.

### Direct Impact Areas

#### 1. Financial Inclusion Through Contextual Intelligence
Traditional wealth management tools are designed for the top 5% — those with investment portfolios, financial advisors, and surplus capital. FinTrack AI is built for the salaried middle class: people earning ₹30,000–₹1,50,000 a month who need to know whether they are living within their means, not whether their portfolio is outperforming the index.

By surfacing anomalies ("you spent 2.3× your usual grocery average this week"), recurring charges ("you've been billed ₹649 every month by this service"), and end-of-month projections — FinTrack AI gives this demographic the same quality of financial awareness that was previously only available through expensive advisors.

#### 2. Behaviour Change via Counterfactual Reasoning
The What-If Budget Simulator is not merely a calculator — it is a **behaviour change interface**. Research in behavioural economics (Thaler & Sunstein, *Nudge*) consistently shows that people make better financial decisions when given immediate, concrete feedback on the consequence of their choices. Seeing "reducing food delivery by 20% adds ₹1,400 to your monthly savings" converts an abstract goal into a tangible action.

At scale, tools like this have measurable impact on household savings rates — a 5% improvement in savings rate for a household earning ₹60,000/month equates to ₹36,000 in additional annual savings.

#### 3. Privacy-Preserving Alternative to Account Aggregators
Existing PFM (Personal Finance Management) solutions in India — such as those built on the Account Aggregator framework — require users to consent to their bank data being accessed by third parties. This introduces systemic privacy and security risk, and has driven low adoption among privacy-conscious users.

FinTrack AI's **zero-cloud data model** (local SQLite, data never leaves the device) offers a materially different risk profile. This design choice directly addresses the primary adoption barrier for digital finance tools among privacy-conscious users, making it viable for users who would categorically reject a cloud-linked alternative.

#### 4. Multi-Profile Household Financial Coordination
In multi-income households, financial opacity compounds: neither partner has visibility into the combined financial picture. FinTrack AI's multi-profile architecture enables parallel individual tracking with a framework for coordination — each member can maintain their own ledger while the application can be extended to surface household-level aggregation. This directly addresses a coordination failure that leads to over-spending and under-saving in dual-income households.

#### 5. Demonstrating Responsible LLM Application in Finance
Most LLM applications in finance either hallucinate facts (dangerous in a financial context) or are too generic to be useful. FinTrack AI's approach — **grounding every LLM response in the user's own transaction history** and implementing deterministic fallbacks when the model is unavailable — demonstrates a pattern for responsible AI deployment in high-stakes domains. The system never makes a financial claim that is not traceable back to real transactional data.

### Scalability Trajectory

| Phase | Scope | Impact Metric |
|---|---|---|
| **Current** | Single-device, multi-profile household | 1–6 users per instance |
| **Near-term** | Cloud-hosted backend with user auth | Thousands of households |
| **Medium-term** | UPI statement auto-import (PDF/SMS parsing) | Elimination of manual entry friction |
| **Long-term** | Account Aggregator API integration | Real-time bank feed without screen-scraping |

At national scale, a tool that improves household savings rates by even 3–5% would represent billions of rupees redirected from consumption to savings annually — with compounding effects on financial security, credit health, and reduced dependency on high-interest informal credit.

---

## 13. Deployment Guide

FinTrack AI has a split deployment architecture:
- **Frontend (React/Vite)** → [Vercel](https://vercel.com) — free tier, zero configuration
- **Backend (Express/SQLite)** → [Railway](https://railway.app) — free tier, persistent filesystem for SQLite

> **Why not deploy both on Vercel?** Vercel runs backend code as ephemeral serverless functions — the filesystem is reset after each invocation, which means SQLite databases would be wiped between requests. Railway provisions a persistent VM with a real filesystem, making it the correct choice for SQLite-backed APIs.

---

### Step 1 — Deploy the Backend on Railway

1. Create a free account at [railway.app](https://railway.app)
2. Click **New Project → Deploy from GitHub repo**
3. Select your repository and set the **Root Directory** to `server`
4. Railway auto-detects Node.js and runs `npm install && node index.js`
5. Add the following environment variables in the Railway dashboard:

   | Variable | Value |
   |---|---|
   | `PORT` | `3001` |
   | `GEMINI_API_KEY` | Your key (optional) |

6. Once deployed, copy your Railway public URL — it will look like:
   ```
   https://fintrack-api-production.up.railway.app
   ```

---

### Step 2 — Deploy the Frontend on Vercel

1. Create a free account at [vercel.com](https://vercel.com)
2. Click **Add New Project → Import Git Repository**
3. Select your repository and set the **Root Directory** to `client`
4. Vercel auto-detects Vite — the build settings are pre-configured via `client/vercel.json`:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add the following environment variable in the Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-railway-url.up.railway.app/api` |

6. Click **Deploy** — Vercel builds and serves the app globally via CDN.

---

### Step 3 — Verify Deployment

After both services are live, open your Vercel URL and confirm:
- [ ] Dashboard loads with seeded transaction data
- [ ] Insights page loads — anomalies, comparison, and recurring tables populated
- [ ] AI Digest button returns a response (mock or live depending on API key)
- [ ] Switching profiles (Settings → Profile) works correctly

---

### Environment Variable Reference

**Backend (`server/.env` or Railway dashboard)**

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: `3001`) |
| `GEMINI_API_KEY` | No | Enables live AI features; falls back to mock without it |

**Frontend (`client/.env.local` or Vercel dashboard)**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes (production)** | Full URL of deployed backend API, including `/api` suffix |

> In local development, `VITE_API_URL` is not needed — the Vite dev proxy transparently forwards `/api` requests to `localhost:3001`.
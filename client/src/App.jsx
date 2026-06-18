import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext.jsx';
import Navbar from './components/Navbar.jsx';
import Toast from './components/Toast.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import ImportScreenshot from './pages/ImportScreenshot.jsx';
import Insights from './pages/Insights.jsx';
import MerchantRules from './pages/MerchantRules.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen relative flex flex-col gradient-bg">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/import" element={<ImportScreenshot />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/rules" element={<MerchantRules />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Toast />
      </div>
    </Router>
  );
}

export default App;


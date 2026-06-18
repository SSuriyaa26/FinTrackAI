import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState(localStorage.getItem('fintrack_profile') || 'person1');
  const [transactions, setTransactions] = useState([]);
  const [rules, setRules] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // In production (Vercel), VITE_API_URL points to the deployed backend (e.g. Railway).
  // In development, falls back to the local Express server on port 3001.
  const api = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    headers: {
      'X-Profile-Name': currentProfile
    }
  }), [currentProfile]);

  const switchProfile = (name) => {
    localStorage.setItem('fintrack_profile', name);
    setCurrentProfile(name);
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, rulesRes, settingsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/merchant-rules'),
        api.get('/settings')
      ]);
      setTransactions(txRes.data);
      setRules(rulesRes.data);
      setSettings(settingsRes.data);
      
      // Apply dark mode setting
      if (settingsRes.data.darkMode === 'true') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTransactions([]);
    fetchData();
  }, [api]);

  const addTransaction = async (txData) => {
    try {
      const res = await api.post('/transactions', txData);
      setTransactions(prev => [res.data, ...prev]);
      showToast("Transaction added successfully", "success");
      return res.data;
    } catch (error) {
      console.error(error);
      showToast("Failed to add transaction", "error");
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast("Transaction deleted", "info");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete transaction", "error");
      throw error;
    }
  };
  
  const bulkAddTransactions = async (txList) => {
    try {
      const res = await api.post('/transactions/bulk', { transactions: txList });
      // Refresh all to keep sort order correct easily
      await fetchData();
      showToast(`Imported ${res.data.length} transactions`, "success");
      return res.data;
    } catch (error) {
      console.error(error);
      showToast("Failed to import transactions", "error");
      throw error;
    }
  }

  const saveSetting = async (key, value) => {
    try {
      await api.post('/settings', { key, value });
      setSettings(prev => ({ ...prev, [key]: value }));
      if (key === 'darkMode') {
        if (value === 'true') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
      showToast("Settings saved", "success");
    } catch (error) {
      showToast("Error saving setting", "error");
    }
  };

  const saveRule = async (merchant, category) => {
    try {
      await api.post('/merchant-rules', { merchant, category });
      setRules(prev => {
        const filtered = prev.filter(r => r.merchant !== merchant.toLowerCase());
        return [...filtered, { merchant: merchant.toLowerCase(), category }];
      });
      showToast("Rule saved", "success");
    } catch (error) {
      showToast("Error saving rule", "error");
    }
  };
  
  const deleteRule = async (merchant) => {
    try {
      await api.delete(`/merchant-rules/${merchant}`);
      setRules(prev => prev.filter(r => r.merchant !== merchant));
      showToast("Rule deleted", "info");
    } catch (error) {
      showToast("Error deleting rule", "error");
    }
  };


  return (
    <FinanceContext.Provider value={{
      currentProfile,
      switchProfile,
      transactions,
      rules,
      settings,
      loading,
      addTransaction,
      deleteTransaction,
      bulkAddTransactions,
      saveSetting,
      saveRule,
      deleteRule,
      toast,
      showToast,
      api
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

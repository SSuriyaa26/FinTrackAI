import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { Settings as SettingsIcon, Key, Moon, IndianRupee, Save } from 'lucide-react';

const Settings = () => {
  const { settings, saveSetting, showToast } = useFinance();
  
  const [formData, setFormData] = useState({
    geminiApiKey: '',
    monthlyBudget: '30000',
    darkMode: false
  });

  useEffect(() => {
    // Populate form securely
    if (Object.keys(settings).length > 0) {
      setFormData({
        geminiApiKey: settings.geminiApiKey || '',
        monthlyBudget: settings.monthlyBudget || '30000',
        darkMode: settings.darkMode === 'true'
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await saveSetting('geminiApiKey', formData.geminiApiKey);
      await saveSetting('monthlyBudget', formData.monthlyBudget);
      await saveSetting('darkMode', formData.darkMode ? 'true' : 'false');
      showToast("Settings saved successfully", "success");
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto mt-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="glass-card p-6 md:p-8">
        
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
            <p className="text-sm text-muted-foreground">Manage your app settings and API integrations.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* API Key */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> API Integrations
            </h3>
            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <label className="block text-sm font-medium text-foreground mb-1.5">Google Gemini API Key</label>
              <input
                type="password"
                name="geminiApiKey"
                value={formData.geminiApiKey}
                onChange={handleChange}
                className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Required for AI Digest and Screenshot Parsing. Get one from Google AI Studio. 
                <span className="font-semibold text-amber-600 dark:text-amber-400 ml-1">Stored locally in your SQLite DB only.</span>
              </p>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-500" /> Financial Goals
            </h3>
            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <label className="block text-sm font-medium text-foreground mb-1.5">Monthly Budget Target (₹)</label>
              <input
                type="number"
                name="monthlyBudget"
                min="0"
                step="500"
                value={formData.monthlyBudget}
                onChange={handleChange}
                className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-medium"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Used to calculate your Financial Health Score and 50/30/20 breakdown.
              </p>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-500" /> Appearance
            </h3>
            <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center justify-between">
              <div>
                <label className="font-medium text-foreground">Dark Mode</label>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle app-wide dark theme</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="darkMode"
                  checked={formData.darkMode}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-md text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
            >
              <Save className="w-5 h-5" /> Save Preferences
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { CATEGORIES } from '../utils/categorizer';
import { Tag, Trash2, Plus, Download, Upload } from 'lucide-react';

const MerchantRules = () => {
  const { rules, saveRule, deleteRule, showToast } = useFinance();
  
  const [newMerchant, setNewMerchant] = useState('');
  const [newCategory, setNewCategory] = useState('Food');

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newMerchant.trim()) return;
    await saveRule(newMerchant.trim(), newCategory);
    setNewMerchant('');
  };

  const exportRules = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "merchant_rules.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importRules = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedRules = JSON.parse(event.target.result);
        if (!Array.isArray(importedRules)) throw new Error("Invalid format");
        
        // Save each individually (or could build a bulk endpoint)
        for (const rule of importedRules) {
          if (rule.merchant && rule.category) {
            await saveRule(rule.merchant, rule.category);
          }
        }
        showToast("Rules imported successfully", "success");
      } catch (err) {
        showToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  // Group rules by Category
  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  return (
    <motion.div 
      className="max-w-4xl mx-auto mt-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" /> Merchant Rules
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Automatically categorize transactions based on keywords.</p>
        </div>
        
        <div className="flex gap-2">
          <label className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium text-sm transition-colors border shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" /> Import JSON
            <input type="file" accept=".json" className="hidden" onChange={importRules} />
          </label>
          <button 
            onClick={exportRules}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium text-sm transition-colors border shadow-sm"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Rule Form */}
        <div className="md:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Add New Rule</h2>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Merchant Keyword</label>
                <input
                  type="text"
                  required
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="block w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  placeholder="e.g. starbucks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Should be categorized as</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="block w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow cursor-pointer"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-all mt-2 gap-2"
              >
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </form>
          </div>
        </div>

        {/* Existing Rules List */}
        <div className="md:col-span-2 space-y-6">
          {Object.keys(groupedRules).length === 0 ? (
             <div className="glass-card p-12 text-center text-muted-foreground">
               No custom rules defined yet.
             </div>
          ) : (
            CATEGORIES.map(category => {
              if (!groupedRules[category] || groupedRules[category].length === 0) return null;
              
              return (
                <div key={category} className="glass-card overflow-hidden">
                  <div className="bg-muted/50 px-6 py-3 border-b border-border font-semibold flex items-center justify-between">
                    <span>{category}</span>
                    <span className="text-xs absolute right-6 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {groupedRules[category].length} rules
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {groupedRules[category].map(rule => (
                      <li key={rule.merchant} className="px-6 py-3 flex justify-between items-center hover:bg-muted/30 transition-colors">
                        <span className="font-mono text-sm">{rule.merchant}</span>
                        <button 
                          onClick={() => deleteRule(rule.merchant)}
                          className="text-muted-foreground hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MerchantRules;

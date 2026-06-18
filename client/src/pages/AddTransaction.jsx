import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { CATEGORIES, predictCategory } from '../utils/categorizer';
import { PlusCircle, Sparkles, Loader2, IndianRupee } from 'lucide-react';

const AddTransaction = () => {
  const { addTransaction, deleteTransaction, rules, showToast } = useFinance();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const debounceRef = useRef(null);

  // Auto-suggest category based on description
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (formData.description.length > 2) {
      debounceRef.current = setTimeout(() => {
        const prediction = predictCategory(formData.description, rules);
        if (prediction && prediction !== 'Other' && prediction !== formData.category) {
          setSuggestedCategory(prediction);
        } else {
          setSuggestedCategory(null);
        }
      }, 500);
    } else {
      setSuggestedCategory(null);
    }

    return () => clearTimeout(debounceRef.current);
  }, [formData.description, rules, formData.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applySuggestion = (e) => {
    e.preventDefault();
    setFormData(prev => ({ ...prev, category: suggestedCategory }));
    setSuggestedCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    setLoading(true);
    try {
      // Format amount
      const amountVal = Math.abs(parseFloat(formData.amount));
      const finalAmount = formData.type === 'expense' ? -amountVal : amountVal;

      const txData = {
        amount: finalAmount,
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
        source: 'manual'
      };

      const newTx = await addTransaction(txData);
      
      showToast(
        <span className="flex items-center gap-2">
          Added {formData.description}. 
          <button 
            onClick={() => {
              deleteTransaction(newTx.id); 
              showToast("Transaction undone");
            }} 
            className="underline text-blue-500 font-bold ml-2 cursor-pointer"
          >
            Undo
          </button>
        </span>, 
        "success"
      );

      navigate('/');
    } catch (error) {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="max-w-xl mx-auto mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Transaction</h1>
            <p className="text-sm text-muted-foreground">Keep your records up to date.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Toggle */}
          <div className="flex p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                formData.type === 'expense'
                  ? 'bg-red-500 text-white shadow'
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                formData.type === 'income'
                  ? 'bg-green-500 text-white shadow'
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              Income
            </button>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-medium text-lg placeholder:text-muted/50"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description & Auto-Suggest */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description (Merchant/Note)</label>
              <input
                type="text"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow placeholder:text-muted/50"
                placeholder="e.g. Zomato Lunch, Rent, Salary..."
              />
              
              {suggestedCategory && (
                <div className="mt-2 p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Looks like <strong>{suggestedCategory}</strong></span>
                  </div>
                  <button
                    onClick={applySuggestion}
                    className="text-xs font-semibold bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 px-3 py-1 rounded-full hover:bg-sky-300 dark:hover:bg-sky-700 transition"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddTransaction;

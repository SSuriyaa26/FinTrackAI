import React from 'react';
import { CATEGORIES } from '../utils/categorizer';
import { IndianRupee, Trash2 } from 'lucide-react';

const ConfirmImportTable = ({ parsedItems, setParsedItems, onConfirm }) => {
  const handleItemChange = (index, field, value) => {
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  const handleRemove = (index) => {
    const updated = parsedItems.filter((_, i) => i !== index);
    setParsedItems(updated);
  };

  if (parsedItems.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Review Parsed Transactions</h3>
      <div className="overflow-x-auto glass-card border border-primary/30 shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary/5 text-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-center">Save Rule?</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {parsedItems.map((item, index) => (
              <tr key={index} className="border-b last:border-0 border-border">
                <td className="px-4 py-2">
                  <input 
                    type="date" 
                    value={item.date} 
                    onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                    className="bg-transparent border border-border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" 
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="bg-transparent border border-border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" 
                  />
                </td>
                <td className="px-4 py-2">
                  <select 
                    value={item.category} 
                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                    className="bg-background border border-border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 relative">
                  <div className="relative">
                    <IndianRupee className="w-3 h-3 absolute left-2 top-2 text-muted-foreground" />
                    <input 
                      type="number" 
                      value={item.amount} 
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      className="bg-transparent border border-border rounded pl-6 pr-2 py-1 w-24 text-right focus:ring-1 focus:ring-primary outline-none" 
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <label className="flex items-center justify-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.saveRule} 
                      onChange={(e) => handleItemChange(index, 'saveRule', e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </label>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => handleRemove(index)} className="text-muted-foreground hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button 
          onClick={onConfirm}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium shadow-md transition-all"
        >
          Confirm & Import {parsedItems.length} items
        </button>
      </div>
    </div>
  );
};

export default ConfirmImportTable;

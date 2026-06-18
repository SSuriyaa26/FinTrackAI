import React from 'react';
import { ArrowUpRight, ArrowDownRight, Tag, Calendar, MoreHorizontal, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const TransactionList = ({ transactions, limit = 10, showDelete = false }) => {
  const { deleteTransaction } = useFinance();
  const displayTxs = limit ? transactions.slice(0, limit) : transactions;

  if (displayTxs.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl mt-4">
        No transactions found. Adding one or import a receipt!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-6 py-3 rounded-tl-lg font-medium">Details</th>
            <th scope="col" className="px-6 py-3 font-medium">Category</th>
            <th scope="col" className="px-6 py-3 font-medium text-right">Amount (₹)</th>
            {showDelete && <th scope="col" className="px-6 py-3 rounded-tr-lg font-medium w-10"></th>}
          </tr>
        </thead>
        <tbody>
          {displayTxs.map((tx) => {
            const isExpense = tx.amount < 0;
            return (
              <tr key={tx.id} className="border-b last:border-none border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full flex-shrink-0 ${isExpense ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {isExpense ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{tx.description}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(tx.date).toLocaleDateString()} • {tx.source === 'screenshot' ? 'Screenshot' : 'Manual'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground w-fit text-xs font-medium border">
                    <Tag className="w-3 h-3" />
                    {tx.category}
                  </div>
                </td>
                <td className={`px-6 py-4 text-right font-semibold ${isExpense ? 'text-foreground' : 'text-green-600 dark:text-green-400'}`}>
                  {isExpense ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </td>
                {showDelete && (
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteTransaction(tx.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;

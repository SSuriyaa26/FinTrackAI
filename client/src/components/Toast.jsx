import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

const Toast = () => {
  const { toast, showToast } = useFinance();

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgClass = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900';
      case 'error': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900';
      default: return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900';
    }
  };

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${getBgClass()} backdrop-blur-md`}>
            {getIcon()}
            <p className="font-medium text-sm text-foreground">{toast.message}</p>
            <button 
              onClick={() => showToast('', 'info')}
              className="ml-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

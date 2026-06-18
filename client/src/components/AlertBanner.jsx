import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AlertBanner = ({ title, message, type = 'warning' }) => {
  // Can be expanded to error or info types
  const bgColors = {
    warning: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    error: 'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200',
    info: 'bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${bgColors[type]} mb-4 transition-all hover:shadow-md`}>
      <div className="shrink-0 mt-0.5">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm mt-1 opacity-90">{message}</p>
      </div>
    </div>
  );
};

export default AlertBanner;

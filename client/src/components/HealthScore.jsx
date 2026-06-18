import React from 'react';
import { motion } from 'framer-motion';

const HealthScore = ({ score }) => {
  // Determine color based on score
  let strokeColor = 'text-green-500';
  let bgColor = 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300';
  let label = 'Excellent';
  let desc = 'You are clearly on top of your finances.';

  if (score < 40) {
    strokeColor = 'text-red-500';
    bgColor = 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300';
    label = 'Attention Needed';
    desc = 'Overspending observed recently.';
  } else if (score < 75) {
    strokeColor = 'text-amber-500';
    bgColor = 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
    label = 'Good';
    desc = 'Doing quite well, try to save a little extra.';
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center h-32 w-32">
        {/* Background circle */}
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/40"
          />
          {/* Progress circle */}
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            className={strokeColor}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold tracking-tighter">{score}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">/ 100</span>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${bgColor} mb-2`}>
          {label}
        </span>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
};

export default HealthScore;

import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`glass-card rounded-2xl overflow-hidden animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, description, action, className = '' }) => (
  <div className={`px-4 py-4 sm:px-6 sm:py-5 border-b border-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 backdrop-blur-xl ${className}`}>
    <div className="min-w-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight truncate">{title}</h3>
      {description && <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">{description}</p>}
    </div>
    {action && <div className="flex-shrink-0 flex items-center">{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);

export default Card;

import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`glass-card rounded-2xl overflow-hidden animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, description, action, className = '' }) => (
  <div className={`px-6 py-5 border-b border-white/50 flex justify-between items-center bg-white/40 backdrop-blur-xl ${className}`}>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export default Card;

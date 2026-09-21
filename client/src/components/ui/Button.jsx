import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none overflow-hidden group";
  
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 focus:ring-gray-900",
    secondary: "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200 shadow-sm hover:shadow hover:-translate-y-0.5 focus:ring-gray-200",
    danger: "bg-gradient-to-tr from-red-600 to-rose-500 text-white hover:from-red-700 hover:to-rose-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] hover:-translate-y-0.5 focus:ring-red-500",
    outline: "border-2 border-gray-200/60 bg-white/30 backdrop-blur-md text-gray-700 hover:border-gray-300 hover:bg-white/60 hover:shadow-sm hover:-translate-y-0.5",
    student: "bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] hover:-translate-y-0.5 focus:ring-teal-500",
    committee: "bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-400 text-white shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5 focus:ring-amber-500",
    vendor: "bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 focus:ring-rose-500"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center">{children}</span>
      {/* Interactive flash effect on hover */}
      <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out rounded-xl mix-blend-overlay"></div>
    </button>
  );
};

export default Button;

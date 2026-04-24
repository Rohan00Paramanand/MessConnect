import React from 'react';

const Input = ({ label, id, error, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/40 focus:border-gray-900/40 focus:bg-white shadow-sm hover:border-gray-400 transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-500 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;

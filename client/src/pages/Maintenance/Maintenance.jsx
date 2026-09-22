import React, { useState, useEffect } from 'react';
import { RefreshCw, Wrench, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import Footer from '../../components/layout/Footer';

const Maintenance = ({ onRestore }) => {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      // Ping the health endpoint
      const { data } = await api.get('/health', { timeout: 4000 });
      if (data?.status === 'ok') {
        if (onRestore) {
          onRestore();
        } else {
          window.location.reload();
        }
        return;
      }
    } catch {
      // Server still offline or restarting, keep waiting
    } finally {
      setTimeout(() => {
        setChecking(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4 auth-gradient select-none">
      <div className="max-w-md w-full bg-white/85 backdrop-blur-2xl border border-white/80 rounded-3xl p-8 sm:p-10 text-center shadow-2xl shadow-gray-400/20 relative z-10 animate-fade-in my-auto">
        {/* Logo and Aura */}
        <div className="relative inline-block mb-6">
          <div className="absolute -inset-2 bg-teal-500/20 rounded-3xl blur-md animate-pulse"></div>
          <img
            src="/pcet.png"
            alt="PCET Logo"
            className="relative w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white mx-auto"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Status Pill */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            System Updating
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
          Site Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
          We are currently deploying updates and recompiling system components for PCET MessConnect. Please hold on — we'll be back online in a moment.
        </p>

        {/* Manual Check Button */}
        <button
          onClick={handleCheck}
          disabled={checking}
          className="w-full py-3.5 px-5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
          <span>{checking ? 'Checking Connection...' : 'Check Connection Now'}</span>
        </button>

        {/* Footer */}
        <p className="text-[11px] font-semibold text-gray-400 mt-5">
          PCET MessConnect • Pimpri Chinchwad Education Trust
        </p>
      </div>

      <Footer className="relative z-10" />
    </div>
  );
};

export default Maintenance;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Utensils, CheckCircle2, ShieldCheck, Sparkles, CreditCard, Smartphone } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MEAL_PLANS = [
  { id: 'trial', count: 10, price: 500, perMeal: 50, tag: 'Starter' },
  { id: 'monthly', count: 30, price: 1350, perMeal: 45, popular: true, tag: 'Most Popular' },
  { id: 'semester', count: 60, price: 2400, perMeal: 40, tag: 'Best Value' },
];

const MealPurchaseModal = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState(MEAL_PLANS[1]);
  const [customMeals, setCustomMeals] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const mealCount = isCustom ? (parseInt(customMeals, 10) || 0) : selectedPlan.count;
  const totalPrice = isCustom ? mealCount * 50 : selectedPlan.price;

  const handleConfirmPurchase = async () => {
    if (mealCount <= 0) {
      toast.error('Please select or enter a valid number of meals.');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/meals/purchase', {
        mealCount,
        planTitle: isCustom ? `Custom (${mealCount} Meals)` : `${selectedPlan.count} Meals Package`,
        dummyAmount: totalPrice
      });

      toast.success(response.data.message || `Successfully purchased ${mealCount} meals!`);
      if (onPurchaseSuccess) {
        onPurchaseSuccess(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete meal recharge');
    } finally {
      setProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Purchase Meal Pass</h2>
              <p className="text-xs text-teal-100 font-medium">Recharge meals for biometric mess entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800">
          {/* Plan Selector */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">
              Select Meal Package
            </label>
            <div className="grid grid-cols-3 gap-3">
              {MEAL_PLANS.map((plan) => {
                const isSelected = !isCustom && selectedPlan.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedPlan(plan);
                    }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 shadow-md ring-2 ring-teal-600/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold rounded-full shadow-sm">
                        Popular
                      </span>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-500">{plan.tag}</p>
                      <p className="text-2xl font-black text-gray-900 mt-1">{plan.count}</p>
                      <p className="text-[11px] text-gray-500">Meals</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-base font-extrabold text-teal-700">₹{plan.price}</p>
                      <p className="text-[10px] text-gray-500">₹{plan.perMeal}/meal</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom option toggle */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                  isCustom ? 'text-teal-700' : 'text-gray-500'
                }`}
              >
                <span>{isCustom ? '← Choose standard package' : '+ Need custom number of meals?'}</span>
              </button>

              {isCustom && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    placeholder="Enter meal count (e.g. 15)"
                    value={customMeals}
                    onChange={(e) => setCustomMeals(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="text-right whitespace-nowrap">
                    <p className="text-xs font-bold text-gray-500">Total</p>
                    <p className="text-base font-black text-teal-700">₹{totalPrice}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dummy Payment Mode Notice */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-start gap-3 text-amber-900">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-amber-950">Development Sandbox Mode</p>
              <p className="text-amber-800 mt-0.5">
                Real payment gateway is currently simulated. Clicking confirm will instantly credit meals to your biometric account for testing.
              </p>
            </div>
          </div>

          {/* Simulated Payment Method Selection */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Simulated Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-teal-600 bg-teal-50/40 text-teal-900 font-bold shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 font-medium'
                }`}
              >
                <Smartphone className="w-5 h-5 text-teal-600" />
                <span className="text-xs">UPI / QR (Dummy)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-teal-600 bg-teal-50/40 text-teal-900 font-bold shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 font-medium'
                }`}
              >
                <CreditCard className="w-5 h-5 text-teal-600" />
                <span className="text-xs">Card / NetBanking</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Payable Amount</p>
            <p className="text-2xl font-black text-gray-900">₹{totalPrice}</p>
          </div>
          <button
            onClick={handleConfirmPurchase}
            disabled={processing || mealCount <= 0}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Crediting Meals...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Purchase</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MealPurchaseModal;

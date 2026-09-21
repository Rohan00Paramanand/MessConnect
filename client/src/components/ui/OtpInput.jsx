import React, { useRef, useEffect } from 'react';

/**
 * Modern 6-box OTP input with dashed/underlined slot design.
 * Features:
 * - Automatic focus progression on typing
 * - Backspace handling to previous box
 * - Left/Right arrow key navigation
 * - Clipboard paste handling for full 6-digit OTP
 * - Mobile numeric keypad support (inputMode="numeric", autoComplete="one-time-code")
 */
const OtpInput = ({ value = '', onChange, length = 6, disabled = false, error = false }) => {
  const inputRefs = useRef([]);

  // Ensure refs array matches specified length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    // Auto-focus the first slot when component mounts
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [length, disabled]);

  // Turn value string into an array of length slots
  const digits = Array.from({ length }, (_, index) => value[index] || '');

  const handleChange = (index, event) => {
    const rawChar = event.target.value;
    // Take only the last entered character and ensure it is a digit
    const enteredDigit = rawChar.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = enteredDigit;
    const combinedValue = newDigits.join('');
    onChange(combinedValue);

    // If a digit was entered, move focus to the next input
    if (enteredDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, jump back and clear previous box
        event.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);

    // Focus the box following the pasted characters, or the last box
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black rounded-xl border-2 transition-all duration-200 outline-none
              ${
                error
                  ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : isFilled
                  ? 'border-teal-600 bg-white text-gray-900 shadow-sm'
                  : 'border-dashed border-gray-300 bg-white/70 hover:border-gray-400 focus:border-teal-500 focus:border-solid focus:bg-white focus:ring-2 focus:ring-teal-500/20 text-gray-800'
              }
              disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400
            `}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;

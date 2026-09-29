import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({
  options = [],
  value,
  onChange,
  label,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  variant = 'default', // 'default' | 'header' | 'compact'
  className = '',
  dropdownClassName = '',
  name,
  id,
  required = false,
  icon: LeadingIcon,
  ariaLabel,
  truncateText = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    right: 0,
    width: 0,
    openUpward: false,
  });

  const selectRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options into uniform shape
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return {
        value: String(opt),
        label: String(opt).charAt(0).toUpperCase() + String(opt).slice(1),
        disabled: false,
        isHeader: false,
      };
    }
    return {
      value: opt.value ?? '',
      label: opt.label ?? String(opt.value ?? ''),
      disabled: Boolean(opt.disabled),
      isHeader: Boolean(opt.isHeader),
      icon: opt.icon,
      badge: opt.badge,
    };
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => !opt.isHeader && String(opt.value) === String(value)
  );

  const updateCoords = useCallback(() => {
    if (!selectRef.current) return;
    const rect = selectRef.current.getBoundingClientRect();
    const dropdownHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const viewportWidth = window.innerWidth;
    const margin = 12;
    const maxWidth = Math.max(160, viewportWidth - margin * 2);

    let menuWidth = isHeader ? Math.max(200, rect.width) : rect.width;
    menuWidth = Math.min(menuWidth, maxWidth);

    // If menuWidth is narrower than 220px on desktop/tablet, expand it slightly for readability
    if (menuWidth < 220 && maxWidth >= 220) {
      menuWidth = Math.min(260, maxWidth);
    }

    let leftPos = rect.left;
    if (isHeader) {
      leftPos = rect.right - menuWidth;
    }

    // Clamp within viewport
    if (leftPos + menuWidth > viewportWidth - margin) {
      leftPos = viewportWidth - menuWidth - margin;
    }
    if (leftPos < margin) {
      leftPos = margin;
    }

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: Math.round(leftPos),
      right: Math.max(margin, viewportWidth - rect.right),
      width: Math.round(menuWidth),
      openUpward,
    });
  }, [variant]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen((prev) => !prev);
  };

  // Keep dropdown aligned to button across viewport scrolls and resizes
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, updateCoords]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (opt.disabled || opt.isHeader || disabled) return;
    setIsOpen(false);

    if (onChange) {
      const syntheticEvent = {
        target: { name: name || id || '', value: opt.value },
        currentTarget: { name: name || id || '', value: opt.value },
        value: opt.value,
      };
      onChange(syntheticEvent);
    }
  };

  // Variant styling
  const isHeader = variant === 'header';
  const isCompact = variant === 'compact';

  let triggerClass = '';
  if (isHeader) {
    triggerClass = `inline-flex items-center justify-between gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm select-none focus:outline-none focus:ring-2 focus:ring-white/40 ${
      isOpen ? 'bg-white/30 border-white/50 ring-2 ring-white/30' : ''
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
  } else if (isCompact) {
    triggerClass = `w-full min-h-[38px] px-3 py-2 text-xs sm:text-sm bg-white/80 backdrop-blur-sm border rounded-xl flex items-center justify-between text-left transition-all duration-200 shadow-sm cursor-pointer select-none focus:outline-none ${
      isOpen
        ? 'border-amber-400 ring-2 ring-amber-400/20 bg-white'
        : 'border-gray-200 hover:border-gray-300 hover:bg-white'
    } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-800'} ${
      error ? 'border-red-400 ring-2 ring-red-400/20' : ''
    }`;
  } else {
    // Default form variant
    triggerClass = `w-full min-h-[46px] px-4 py-3 text-sm sm:text-base bg-white/70 backdrop-blur-sm border rounded-xl flex items-center justify-between text-left transition-all duration-200 shadow-sm cursor-pointer select-none focus:outline-none ${
      isOpen
        ? 'border-gray-900 ring-2 ring-gray-900/10 bg-white shadow-md'
        : 'border-gray-200 hover:border-gray-300 hover:bg-white'
    } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-75' : 'text-gray-900'} ${
      error ? 'border-red-500 ring-2 ring-red-500/20' : ''
    }`;
  }

  return (
    <div className={`relative ${isHeader ? 'inline-block' : 'w-full'} ${className}`} ref={selectRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-bold text-gray-700 mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden input to facilitate standard form data collection if needed */}
      <input type="hidden" name={name || id} value={value ?? ''} />

      {/* Custom Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleOpen}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || placeholder}
      >
        <div className={`flex items-center gap-2 pr-2 ${truncateText ? 'truncate' : 'min-w-0 flex-1'}`}>
          {LeadingIcon && <LeadingIcon size={16} className={isHeader ? 'text-white/80' : 'text-gray-400 flex-shrink-0'} />}
          <span className={`${truncateText ? 'truncate' : 'break-words text-left leading-snug'} ${!selectedOption && !isHeader ? 'text-gray-400 font-normal' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={isHeader ? 14 : 16}
          className={`flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isHeader ? 'text-white/80' : 'text-gray-400'}`}
        />
      </button>

      {/* Custom Dropdown Popover using Portal to escape overflow-hidden containers */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.openUpward ? 'auto' : `${coords.top}px`,
              bottom: coords.openUpward ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxWidth: 'calc(100vw - 24px)',
              zIndex: 99999,
            }}
            className={`bg-white/95 backdrop-blur-2xl border border-gray-100/90 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] p-1.5 max-h-64 overflow-y-auto animate-dropdown ${dropdownClassName}`}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-gray-400 text-center font-medium">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt, index) => {
                if (opt.isHeader) {
                  return (
                    <div
                      key={`header-${index}`}
                      className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/70 rounded-lg my-1 select-none flex items-center gap-1.5"
                    >
                      <span>{opt.label}</span>
                    </div>
                  );
                }

                const isSelected = String(opt.value) === String(value);

                return (
                  <button
                    type="button"
                    key={opt.value || `opt-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-all duration-150 select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-transparent text-gray-400'
                        : isSelected
                        ? isHeader
                          ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                          : 'bg-teal-50 text-teal-800 font-bold shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100/80 font-medium active:scale-[0.99]'
                    }`}
                  >
                    <div className={`flex items-center gap-2 min-w-0 flex-1 ${truncateText ? 'truncate' : ''}`}>
                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                      <span className={truncateText ? 'truncate' : 'break-words text-left leading-snug'}>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <Check
                        size={15}
                        className={`flex-shrink-0 stroke-[2.5] ${
                          isHeader ? 'text-indigo-600' : 'text-teal-600'
                        }`}
                      />
                    )}
                    {opt.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}

      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default Select;

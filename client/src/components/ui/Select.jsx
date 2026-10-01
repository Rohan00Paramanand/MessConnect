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
  triggerClassName = '',
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
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 260,
    openUpward: false,
  });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  const isHeader = variant === 'header';
  const isCompact = variant === 'compact';

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
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const margin = 12;

    // If trigger has scrolled completely off-screen, close menu
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;

    // Prefer opening downward unless space below is too cramped (< 130px) and above has more room
    const openUpward = spaceBelow < 130 && spaceAbove > spaceBelow;

    // Compute maximum allowable height for the dropdown menu
    const maxAvailableHeight = openUpward
      ? Math.min(260, Math.max(100, spaceAbove - 4))
      : Math.min(260, Math.max(100, spaceBelow - 4));

    // Horizontal sizing & positioning
    const maxWidth = Math.max(160, viewportWidth - margin * 2);
    let menuWidth = isHeader ? Math.max(200, rect.width) : rect.width;

    // Expand narrow triggers slightly so option labels are readable
    if (menuWidth < 200 && maxWidth >= 200) {
      menuWidth = Math.min(250, maxWidth);
    }
    menuWidth = Math.min(menuWidth, maxWidth);

    let leftPos = isHeader ? (rect.right - menuWidth) : rect.left;

    // Clamp horizontally to stay inside the viewport
    if (leftPos + menuWidth > viewportWidth - margin) {
      leftPos = viewportWidth - menuWidth - margin;
    }
    if (leftPos < margin) {
      leftPos = margin;
    }

    setCoords({
      // Directly next to trigger button: 4px below when downward, 4px above when upward
      top: Math.round(rect.bottom + 4),
      bottom: Math.round(viewportHeight - rect.top + 4),
      left: Math.round(leftPos),
      width: Math.round(menuWidth),
      maxHeight: Math.round(maxAvailableHeight),
      openUpward,
    });
  }, [isHeader]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen((prev) => !prev);
  };

  // Keep dropdown precisely aligned to trigger button across viewport scrolls and resizes
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
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
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

  // Trigger button styling
  let triggerClass = '';
  if (isHeader) {
    triggerClass = `inline-flex items-center justify-between gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm select-none focus:outline-none focus:ring-2 focus:ring-white/40 ${
      isOpen ? 'bg-white/30 border-white/50 ring-2 ring-white/30' : ''
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${triggerClassName}`;
  } else if (isCompact) {
    triggerClass = `w-full min-h-[38px] px-3 py-2 text-xs sm:text-sm bg-white/85 hover:bg-white backdrop-blur-sm border rounded-xl flex items-center justify-between text-left transition-all duration-200 shadow-xs cursor-pointer select-none focus:outline-none ${
      isOpen
        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
        : 'border-gray-200 hover:border-gray-300'
    } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-800'} ${
      error ? 'border-red-400 ring-2 ring-red-400/20' : ''
    } ${triggerClassName}`;
  } else {
    // Default form variant
    triggerClass = `w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm bg-white/85 hover:bg-white backdrop-blur-sm border rounded-xl flex items-center justify-between text-left transition-all duration-200 shadow-xs cursor-pointer select-none focus:outline-none ${
      isOpen
        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white shadow-sm'
        : 'border-gray-200/90 hover:border-gray-300'
    } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-75' : 'text-gray-900'} ${
      error ? 'border-red-500 ring-2 ring-red-500/20' : ''
    } ${triggerClassName}`;
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${isHeader ? 'inline-block' : 'w-full'} ${className}`}
    >
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
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
        ref={triggerRef}
        disabled={disabled}
        onClick={toggleOpen}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || placeholder}
      >
        <div className={`flex items-center gap-2 pr-2 ${truncateText ? 'truncate' : 'min-w-0 flex-1'}`}>
          {LeadingIcon && (
            <LeadingIcon
              size={15}
              className={isHeader ? 'text-white/80' : 'text-gray-500 flex-shrink-0'}
            />
          )}
          <span
            className={`${truncateText ? 'truncate' : 'break-words text-left leading-snug'} ${
              !selectedOption && !isHeader ? 'text-gray-400 font-normal' : 'font-semibold'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={isHeader ? 14 : 15}
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
              bottom: coords.openUpward ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              maxWidth: 'calc(100vw - 24px)',
              zIndex: 99999,
            }}
            className={`bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.06)] p-1.5 overflow-y-auto ${
              coords.openUpward ? 'animate-dropdown-up' : 'animate-dropdown-down'
            } ${dropdownClassName}`}
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
                      className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 bg-gray-50/80 rounded-lg my-1 select-none flex items-center gap-1.5"
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
                    className={`w-full px-3 py-2.5 min-h-[40px] rounded-xl text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-all duration-150 select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-transparent text-gray-400'
                        : isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/70 shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 font-medium active:scale-[0.99]'
                    }`}
                  >
                    <div className={`flex items-center gap-2 min-w-0 flex-1 ${truncateText ? 'truncate' : ''}`}>
                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                      <span className={truncateText ? 'truncate' : 'break-words text-left leading-snug'}>
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check
                        size={15}
                        className="flex-shrink-0 stroke-[2.5] text-indigo-600"
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

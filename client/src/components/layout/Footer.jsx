import React from 'react';

/**
 * Footer Component
 * Renders the horizontal credit footer: "Developed by Dr Rajkamal Sangole & team"
 * with strong visual emphasis on "Dr Rajkamal Sangole" and subtle text drop-shadow.
 *
 * Positioned in normal document flow (non-floating) so it sits at the bottom of
 * the page naturally or becomes visible when scrolling down to the bottom.
 */
const Footer = ({ className = '', isDark = false }) => {
  return (
    <footer
      className={`w-full py-4 px-4 select-none text-center ${className}`}
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      aria-label="Application Credits: Developed by Dr Rajkamal Sangole & team"
    >
      <p className="text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 flex-wrap">
        <span className={isDark ? 'text-gray-400 font-normal' : 'text-gray-400 font-normal'}>
          Developed by
        </span>
        <span
          className={`font-black text-sm sm:text-base tracking-tight transition-colors ${
            isDark
              ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.60)]'
              : 'text-gray-900 drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)]'
          }`}
        >
          Dr Rajkamal Sangole
        </span>
        <span className={isDark ? 'text-gray-400 font-normal' : 'text-gray-400 font-normal'}>
          &amp; team
        </span>
      </p>
    </footer>
  );
};

export default Footer;

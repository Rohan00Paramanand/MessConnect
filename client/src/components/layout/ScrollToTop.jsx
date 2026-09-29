import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Ensures that on any route navigation, the user is immediately scrolled
 * to the top of the page, resetting both the window and any layout scroll containers.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Reset standard window and document scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 2. Reset custom layout scroll container if present
    const mainScroll = document.getElementById('main-content-scroll');
    if (mainScroll) {
      mainScroll.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

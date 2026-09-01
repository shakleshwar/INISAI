import { useState, useEffect } from 'react';

export function useKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;
    
    const handleResize = () => {
      if (window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.screen.height * 0.8;
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        setIsKeyboardOpen(isShrunk && isInputFocused);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.addEventListener('focusin', handleResize);
    window.addEventListener('focusout', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('focusin', handleResize);
      window.removeEventListener('focusout', handleResize);
    };
  }, []);

  return isKeyboardOpen;
}

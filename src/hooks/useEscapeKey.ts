import { useEffect } from 'react';

// Calls onClose when the Escape key is pressed while the modal/panel is open.
// Usage: useEscapeKey(isOpen, onClose)
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
}

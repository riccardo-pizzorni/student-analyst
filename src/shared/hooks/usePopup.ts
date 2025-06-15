import { useState, useRef, useEffect, useCallback } from 'react';

export interface PopupOptions {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  initialOpen?: boolean;
}

export function usePopup(options: PopupOptions = {}) {
  const {
    closeOnEscape = true,
    closeOnOutsideClick = true,
    initialOpen = false,
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        close();
        return;
      }

      // Tab navigation within popup
      if (event.key === 'Tab' && popupRef.current) {
        const focusableElements = popupRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, close]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnOutsideClick, close]);

  // Focus management
  useEffect(() => {
    if (isOpen && popupRef.current) {
      // Focus first focusable element in popup
      const focusableElement = popupRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (focusableElement) {
        focusableElement.focus();
      } else {
        // If no focusable element, focus the popup itself
        popupRef.current.focus();
      }
    }
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
    popupRef,
    triggerRef,
  };
} 
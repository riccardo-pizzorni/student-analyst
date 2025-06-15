import { useState, useRef, useEffect, useCallback } from 'react';

export interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export interface UseTooltipProps {
  content: string;
  delay?: number;
  disabled?: boolean;
  maxLines?: number;
}

export interface UseTooltipReturn {
  isVisible: boolean;
  position: TooltipPosition | null;
  triggerRef: React.RefObject<HTMLElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

export function useTooltip({
  content,
  delay = 500,
  disabled = false,
  maxLines = 3
}: UseTooltipProps): UseTooltipReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchDevice = useRef(false);

  // Detect touch device
  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Calculate intelligent positioning
  const calculatePosition = useCallback((): TooltipPosition => {
    if (!triggerRef.current || !tooltipRef.current) {
      return { top: 0, left: 0, placement: 'top' };
    }

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };

    const spacing = 8; // Gap between trigger and tooltip
    const positions = [
      {
        placement: 'top' as const,
        top: trigger.top + viewport.scrollY - tooltip.height - spacing,
        left: trigger.left + viewport.scrollX + (trigger.width - tooltip.width) / 2
      },
      {
        placement: 'bottom' as const,
        top: trigger.bottom + viewport.scrollY + spacing,
        left: trigger.left + viewport.scrollX + (trigger.width - tooltip.width) / 2
      },
      {
        placement: 'left' as const,
        top: trigger.top + viewport.scrollY + (trigger.height - tooltip.height) / 2,
        left: trigger.left + viewport.scrollX - tooltip.width - spacing
      },
      {
        placement: 'right' as const,
        top: trigger.top + viewport.scrollY + (trigger.height - tooltip.height) / 2,
        left: trigger.right + viewport.scrollX + spacing
      }
    ];

    // Check which positions fit in viewport
    const validPositions = positions.filter(pos => {
      const fitsHorizontally = pos.left >= 0 && pos.left + tooltip.width <= viewport.width;
      const fitsVertically = pos.top >= viewport.scrollY && pos.top + tooltip.height <= viewport.scrollY + viewport.height;
      return fitsHorizontally && fitsVertically;
    });

    // Prefer top, then bottom, then sides
    const preferredOrder: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
    
    for (const preferred of preferredOrder) {
      const position = validPositions.find(pos => pos.placement === preferred);
      if (position) return position;
    }

    // If no position fits perfectly, use top and clamp to viewport
    const fallback = positions[0];
    return {
      ...fallback,
      left: Math.max(0, Math.min(fallback.left, viewport.width - tooltip.width)),
      top: Math.max(viewport.scrollY, Math.min(fallback.top, viewport.scrollY + viewport.height - tooltip.height))
    };
  }, []);

  // Show tooltip
  const show = useCallback(() => {
    if (disabled || !content.trim()) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // For touch devices, show immediately
    if (isTouchDevice.current) {
      setIsVisible(true);
      return;
    }

    // For mouse devices, use delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, content, delay]);

  // Hide tooltip
  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Toggle tooltip (for touch devices)
  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  // Update position when visible
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    }
  }, [isVisible, calculatePosition]);

  // Handle click outside for touch devices
  useEffect(() => {
    if (!isTouchDevice.current || !isVisible) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current &&
        tooltipRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        hide();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, hide]);

  // Handle scroll and resize
  useEffect(() => {
    if (!isVisible) return;

    const handleScrollOrResize = () => {
      if (isVisible) {
        const newPosition = calculatePosition();
        setPosition(newPosition);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, calculatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    position,
    triggerRef,
    tooltipRef,
    show,
    hide,
    toggle
  };
} 
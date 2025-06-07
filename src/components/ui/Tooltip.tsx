import React from 'react';
import { createPortal } from 'react-dom';
import { useTooltip, UseTooltipProps } from '@/hooks/useTooltip';
import { cn } from '@/lib/utils';

export interface TooltipProps extends UseTooltipProps {
  children: React.ReactElement;
  className?: string;
  maxLines?: number;
}

export function Tooltip({
  children,
  content,
  delay = 500,
  disabled = false,
  maxLines = 3,
  className
}: TooltipProps) {
  const {
    isVisible,
    position,
    triggerRef,
    tooltipRef,
    show,
    hide,
    toggle
  } = useTooltip({ content, delay, disabled, maxLines });

  // Clone children to add event handlers
  const originalProps = children.props as any;
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      if (originalProps?.onMouseEnter) {
        originalProps.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      if (originalProps?.onMouseLeave) {
        originalProps.onMouseLeave(e);
      }
    },
    onTouchStart: (e: React.TouchEvent) => {
      toggle();
      if (originalProps?.onTouchStart) {
        originalProps.onTouchStart(e);
      }
    },
    onClick: (e: React.MouseEvent) => {
      // For touch devices, prevent default click if tooltip is showing
      if ('ontouchstart' in window && isVisible) {
        e.preventDefault();
      }
      if (originalProps?.onClick) {
        originalProps.onClick(e);
      }
    }
  } as any);

  // Truncate content if it exceeds maxLines
  const truncatedContent = React.useMemo(() => {
    if (!content) return '';
    
    const lines = content.split('\n');
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + '...';
    }
    
    // Also check for very long single lines (approximate)
    if (content.length > maxLines * 50) {
      return content.substring(0, maxLines * 50) + '...';
    }
    
    return content;
  }, [content, maxLines]);

  const tooltipElement = isVisible && position && (
    <div
      ref={tooltipRef}
      className={cn(
        // Base styles
        'fixed z-50 max-w-xs px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg',
        // Animation
        'animate-in fade-in-0 zoom-in-95 duration-200',
        // Positioning arrow classes based on placement
        {
          'after:content-[""] after:absolute after:w-2 after:h-2 after:bg-gray-900 after:rotate-45': true,
          'after:top-full after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2': position.placement === 'top',
          'after:bottom-full after:left-1/2 after:-translate-x-1/2 after:translate-y-1/2': position.placement === 'bottom',
          'after:left-full after:top-1/2 after:-translate-y-1/2 after:-translate-x-1/2': position.placement === 'left',
          'after:right-full after:top-1/2 after:-translate-y-1/2 after:translate-x-1/2': position.placement === 'right'
        },
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        // Ensure tooltip doesn't exceed maxLines height
        maxHeight: `${maxLines * 1.5}rem`,
        overflow: 'hidden'
      }}
      role="tooltip"
      aria-hidden="false"
    >
      {truncatedContent.split('\n').map((line, index) => (
        <div key={index} className="leading-relaxed">
          {line}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {trigger}
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  );
}

// Utility component for simple text tooltips
export interface TooltipTextProps {
  text: string;
  children: React.ReactElement;
  delay?: number;
  maxLines?: number;
  className?: string;
}

export function TooltipText({
  text,
  children,
  delay = 500,
  maxLines = 3,
  className
}: TooltipTextProps) {
  return (
    <Tooltip
      content={text}
      delay={delay}
      maxLines={maxLines}
      className={className}
    >
      {children}
    </Tooltip>
  );
}

// Wrapper component for easy integration
export interface WithTooltipProps {
  tooltip: string;
  delay?: number;
  maxLines?: number;
  tooltipClassName?: string;
  children: React.ReactElement;
}

export function WithTooltip({
  tooltip,
  delay = 500,
  maxLines = 3,
  tooltipClassName,
  children
}: WithTooltipProps) {
  return (
    <Tooltip
      content={tooltip}
      delay={delay}
      maxLines={maxLines}
      className={tooltipClassName}
    >
      {children}
    </Tooltip>
  );
} 
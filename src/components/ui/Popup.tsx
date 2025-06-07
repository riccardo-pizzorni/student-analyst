import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { usePopup, PopupOptions } from '@/hooks/usePopup';
import { cn } from '@/lib/utils';

export interface PopupProps extends PopupOptions {
  trigger: ReactNode;
  children?: ReactNode;
  title?: string;
  content?: string;
  latex?: string;
  className?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  maxWidth?: string;
  showCloseButton?: boolean;
}

// Componente per il rendering LaTeX
function LatexRenderer({ latex, className }: { latex: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        // Dividi il contenuto in blocchi per gestire mix di testo e LaTeX
        const blocks = latex.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
        
        containerRef.current.innerHTML = '';
        
        blocks.forEach((block) => {
          if (!block.trim()) return;
          
          const element = document.createElement('div');
          
          if (block.startsWith('$$') && block.endsWith('$$')) {
            // Display math (block)
            const mathContent = block.slice(2, -2);
            katex.render(mathContent, element, {
              displayMode: true,
              throwOnError: false,
              strict: false,
            });
          } else if (block.startsWith('$') && block.endsWith('$')) {
            // Inline math
            const mathContent = block.slice(1, -1);
            element.style.display = 'inline';
            katex.render(mathContent, element, {
              displayMode: false,
              throwOnError: false,
              strict: false,
            });
          } else {
            // Testo normale
            element.innerHTML = block.replace(/\n/g, '<br>');
            element.style.marginBottom = '0.5rem';
          }
          
          containerRef.current?.appendChild(element);
        });
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span style="color: red;">Errore nel rendering LaTeX: ${latex}</span>`;
        }
      }
    }
  }, [latex]);

  return (
    <div 
      ref={containerRef} 
      className={cn("latex-content", className)} 
    />
  );
}

// Componente popup principale
export function Popup({
  trigger,
  children,
  title,
  content,
  latex,
  className,
  placement = 'auto',
  maxWidth = '400px',
  showCloseButton = true,
  ...popupOptions
}: PopupProps) {
  const { isOpen, open, close, toggle, popupRef, triggerRef } = usePopup(popupOptions);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  // Calcola posizionamento intelligente
  useEffect(() => {
    if (isOpen && triggerRef.current && popupRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let newPosition = { top: 0, left: 0 };

      // Determina il posizionamento ottimale
      const calculatePosition = (placement: string) => {
        switch (placement) {
          case 'top':
            return {
              top: triggerRect.top - popupRect.height - 8,
              left: triggerRect.left + (triggerRect.width - popupRect.width) / 2,
            };
          case 'bottom':
            return {
              top: triggerRect.bottom + 8,
              left: triggerRect.left + (triggerRect.width - popupRect.width) / 2,
            };
          case 'left':
            return {
              top: triggerRect.top + (triggerRect.height - popupRect.height) / 2,
              left: triggerRect.left - popupRect.width - 8,
            };
          case 'right':
            return {
              top: triggerRect.top + (triggerRect.height - popupRect.height) / 2,
              left: triggerRect.right + 8,
            };
          default:
            return {
              top: triggerRect.bottom + 8,
              left: triggerRect.left,
            };
        }
      };

      if (placement === 'auto') {
        // Logica di posizionamento automatico intelligente
        const positions = ['bottom', 'top', 'right', 'left'];
        
        for (const pos of positions) {
          const testPos = calculatePosition(pos);
          
          // Verifica se la posizione è completamente visibile
          const wouldFit = 
            testPos.top >= 0 &&
            testPos.left >= 0 &&
            testPos.top + popupRect.height <= viewport.height &&
            testPos.left + popupRect.width <= viewport.width;
          
          if (wouldFit) {
            newPosition = testPos;
            break;
          }
        }
        
        // Se nessuna posizione è perfetta, usa bottom come fallback
        if (newPosition.top === 0 && newPosition.left === 0) {
          newPosition = calculatePosition('bottom');
        }
      } else {
        newPosition = calculatePosition(placement);
      }

      // Aggiusta per rimanere dentro il viewport
      if (newPosition.left < 8) newPosition.left = 8;
      if (newPosition.left + popupRect.width > viewport.width - 8) {
        newPosition.left = viewport.width - popupRect.width - 8;
      }
      if (newPosition.top < 8) newPosition.top = 8;
      if (newPosition.top + popupRect.height > viewport.height - 8) {
        newPosition.top = viewport.height - popupRect.height - 8;
      }

      setPosition(newPosition);
    }
  }, [isOpen, placement]);

  // Clona il trigger e aggiungi gli event handlers
  const triggerElement = React.cloneElement(trigger as React.ReactElement<any>, {
    ref: triggerRef,
    onClick: toggle,
    'aria-expanded': isOpen,
    'aria-haspopup': 'dialog',
  });

  const popupContent = (
    <div
      ref={popupRef}
      className={cn(
        // Stili base
        "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl",
        "min-w-[200px] p-4 animate-in fade-in-0 zoom-in-95",
        // Stili per la modalità scura
        "dark:bg-gray-800 dark:border-gray-700",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        maxWidth,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "popup-title" : undefined}
      tabIndex={-1}
    >
      {/* Header con titolo e pulsante di chiusura */}
      {(title || showCloseButton) && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-600">
          {title && (
            <h3 
              id="popup-title" 
              className="font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h3>
          )}
          {showCloseButton && (
            <button
              onClick={close}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded"
              aria-label="Chiudi popup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Contenuto */}
      <div className="space-y-3">
        {latex && (
          <div className="text-sm">
            <LatexRenderer latex={latex} />
          </div>
        )}
        
        {content && (
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {content}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );

  return (
    <>
      {triggerElement}
      {isOpen && createPortal(popupContent, document.body)}
    </>
  );
}

// Componente semplificato per popup con solo testo
export function TextPopup({ 
  trigger, 
  text, 
  title, 
  className,
  ...props 
}: Omit<PopupProps, 'content' | 'children'> & { text: string }) {
  return (
    <Popup
      trigger={trigger}
      content={text}
      title={title}
      className={className}
      {...props}
    />
  );
}

// Componente per popup con formule LaTeX
export function FormulaPopup({ 
  trigger, 
  formula, 
  explanation, 
  title = "Formula matematica",
  className,
  ...props 
}: Omit<PopupProps, 'latex' | 'content' | 'children'> & { 
  formula: string; 
  explanation?: string; 
}) {
  return (
    <Popup
      trigger={trigger}
      latex={formula}
      content={explanation}
      title={title}
      className={cn("max-w-md", className)}
      {...props}
    />
  );
}

// Componente wrapper che combina un elemento con popup
export function WithPopup({ 
  children, 
  popupProps 
}: { 
  children: ReactNode; 
  popupProps: Omit<PopupProps, 'trigger'> 
}) {
  return (
    <Popup trigger={children} {...popupProps} />
  );
} 
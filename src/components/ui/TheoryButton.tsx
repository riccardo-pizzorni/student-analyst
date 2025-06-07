import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { HelpIcon } from '@/components/ui/icons';

export interface ExternalReference {
  title: string;
  author?: string;
  url: string;
  type: 'paper' | 'book' | 'article' | 'website';
  year?: number;
  description?: string;
}

export interface TheoryContent {
  title: string;
  category: string;
  overview: string;
  theory: string; // Can include LaTeX formulas
  keyPoints: string[];
  applications: string[];
  limitations?: string[];
  examples?: string[];
  references: ExternalReference[];
  relatedTopics?: string[];
}

export interface TheoryButtonProps {
  topic: string;
  content: TheoryContent;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

// Component for LaTeX rendering
function LatexRenderer({ content, className }: { content: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && content) {
      try {
        // Process mixed LaTeX and text content
        const blocks = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
        
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
            element.className = 'my-4';
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
            // Normal text with line breaks
            element.innerHTML = block.replace(/\n/g, '<br>');
            element.className = 'mb-2';
          }
          
          containerRef.current?.appendChild(element);
        });
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = content.replace(/\n/g, '<br>');
        }
      }
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={cn("theory-latex-content", className)} 
    />
  );
}

// Modal component for theory display
function TheoryModal({ 
  content, 
  isOpen, 
  onClose 
}: { 
  content: TheoryContent; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Focus modal when opened
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-50">
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "theory-modal relative w-full max-w-4xl max-h-[90vh] overflow-y-auto",
          "bg-white rounded-lg shadow-xl border border-gray-200",
          "animate-in fade-in-0 zoom-in-95 duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="theory-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="theory-title" className="text-2xl font-bold text-gray-900">
                {content.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{content.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Stampa teoria"
              >
                🖨️ Stampa
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded"
                aria-label="Chiudi teoria"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Panoramica</h3>
            <p className="text-gray-700 leading-relaxed">{content.overview}</p>
          </section>

          {/* Theory */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Teoria</h3>
            <div className="prose prose-gray max-w-none">
              <LatexRenderer content={content.theory} />
            </div>
          </section>

          {/* Key Points */}
          {content.keyPoints.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Punti Chiave</h3>
              <ul className="space-y-2">
                {content.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Applications */}
          {content.applications.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicazioni Pratiche</h3>
              <ul className="space-y-2">
                {content.applications.map((app, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">▶</span>
                    <span className="text-gray-700">{app}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Limitations */}
          {content.limitations && content.limitations.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitazioni</h3>
              <ul className="space-y-2">
                {content.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 font-bold">⚠️</span>
                    <span className="text-gray-700">{limitation}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Examples */}
          {content.examples && content.examples.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Esempi</h3>
              <div className="space-y-4">
                {content.examples.map((example, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <LatexRenderer content={example} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* References */}
          {content.references.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Riferimenti e Approfondimenti</h3>
              <div className="space-y-3">
                {content.references.map((ref, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{ref.title}</h4>
                        {ref.author && (
                          <p className="text-sm text-gray-600 mt-1">
                            {ref.author} {ref.year && `(${ref.year})`}
                          </p>
                        )}
                        {ref.description && (
                          <p className="text-sm text-gray-700 mt-2">{ref.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          "px-2 py-1 text-xs rounded",
                          ref.type === 'paper' && "bg-blue-100 text-blue-700",
                          ref.type === 'book' && "bg-green-100 text-green-700",
                          ref.type === 'article' && "bg-purple-100 text-purple-700",
                          ref.type === 'website' && "bg-gray-100 text-gray-700"
                        )}>
                          {ref.type}
                        </span>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Apri
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Topics */}
          {content.relatedTopics && content.relatedTopics.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Argomenti Correlati</h3>
              <div className="flex flex-wrap gap-2">
                {content.relatedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Main TheoryButton component
export function TheoryButton({ 
  topic, 
  content, 
  size = 'md', 
  className,
  disabled = false 
}: TheoryButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4 p-0.5',
    md: 'w-5 h-5 p-1',
    lg: 'w-6 h-6 p-1'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={cn(
          "theory-button inline-flex items-center justify-center rounded-full",
          "text-gray-400 hover:text-blue-600 hover:bg-blue-50",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent",
          sizeClasses[size],
          className
        )}
        title={`Teoria: ${topic}`}
        aria-label={`Apri teoria su ${topic}`}
      >
        <HelpIcon size={iconSizes[size]} />
      </button>

      <TheoryModal
        content={content}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// Convenience wrapper for common use cases
export function WithTheory({ 
  children, 
  topic, 
  content, 
  buttonSize = 'md',
  buttonClassName,
  containerClassName 
}: {
  children: React.ReactNode;
  topic: string;
  content: TheoryContent;
  buttonSize?: 'sm' | 'md' | 'lg';
  buttonClassName?: string;
  containerClassName?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", containerClassName)}>
      {children}
      <TheoryButton
        topic={topic}
        content={content}
        size={buttonSize}
        className={buttonClassName}
      />
    </div>
  );
} 
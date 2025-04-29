"use client";

import React, { useEffect, useRef } from 'react';

interface KaTeXFormulaProps {
  children: React.ReactNode;
  display?: boolean;
  className?: string;
  errorColor?: string;
}

/**
 * KaTeX Formula component that renders LaTeX formulas using KaTeX directly
 * This component doesn't rely on react-katex and works with React 19
 * 
 * Usage:
 * <KaTeXFormula>E = mc^2</KaTeXFormula>
 * <KaTeXFormula display>F = ma</KaTeXFormula>
 */
export default function KaTeXFormula({ 
  children, 
  display = false, 
  className = '',
  errorColor = '#cc0000'
}: KaTeXFormulaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Convert children to string if needed
  const formula = typeof children === 'string' 
    ? children 
    : String(children);

  // Process the formula to fix common issues
  const processedFormula = preprocessFormula(formula);
  
  useEffect(() => {
    // Function to load KaTeX script and CSS
    const loadKaTeX = () => {
      return new Promise<void>((resolve) => {
        // Check if KaTeX is already loaded
        if (typeof window !== 'undefined' && (window as any).katex) {
          resolve();
          return;
        }

        // Load KaTeX CSS
        if (!document.querySelector('link[href*="katex"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
          link.integrity = 'sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntxDrLrgRuwYaOA1yGOdVEKKUCiVXYafHk';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }

        // Load KaTeX script
        if (!document.querySelector('script[src*="katex"]')) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
          script.integrity = 'sha384-cpW21h6RZv/phavutF+AuVYrL+9wFuDWWD1Oc/haEYl1fVJFUaJwdLbuvkEbGlDx';
          script.crossOrigin = 'anonymous';
          script.defer = true;
          script.onload = () => resolve();
          document.head.appendChild(script);
        } else {
          resolve();
        }
      });
    };

    // Function to render formula
    const renderFormula = async () => {
      if (!containerRef.current) return;
      
      try {
        await loadKaTeX();
        
        // Wait for KaTeX to be available
        const checkKaTeX = () => {
          if (typeof window !== 'undefined' && (window as any).katex) {
            try {
              // Render the formula
              (window as any).katex.render(
                processedFormula, 
                containerRef.current, 
                { 
                  displayMode: display,
                  throwOnError: false,
                  errorColor: errorColor,
                  output: 'html',
                  trust: true
                }
              );
            } catch (error) {
              console.error('Error rendering formula with KaTeX:', error);
              containerRef.current.textContent = formula;
            }
          } else {
            setTimeout(checkKaTeX, 100);
          }
        };
        
        checkKaTeX();
      } catch (error) {
        console.error('Error loading KaTeX:', error);
        if (containerRef.current) {
          containerRef.current.textContent = formula;
        }
      }
    };

    renderFormula();
  }, [processedFormula, display, errorColor, formula]);

  return (
    <div 
      ref={containerRef} 
      className={`katex-formula ${display ? 'katex-display' : 'katex-inline'} ${className}`}
    />
  );
}

/**
 * Preprocesses a formula to fix common issues before rendering
 */
function preprocessFormula(formula: string): string {
  // Apply additional preprocessing specific to this component
  return formula
    // Fix common LaTeX issues
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '\\frac{$1}{$2}')
    
    // Fix subscripts without braces
    .replace(/([a-zA-Z]+)_([a-zA-Z0-9]+)(?!\{)/g, '$1_{$2}')
    
    // Fix specific physics variables with subscripts
    .replace(/v_0/g, 'v_{0}')
    .replace(/v_x/g, 'v_{x}')
    .replace(/v_y/g, 'v_{y}')
    
    // Fix angle notation
    .replace(/theta/g, '\\theta')
    .replace(/alpha/g, '\\alpha')
    .replace(/beta/g, '\\beta')
    
    // Fix degree symbol
    .replace(/(\d+)\s*°/g, '$1^{\\circ}')
    
    // Fix trigonometric functions
    .replace(/cos\(/g, '\\cos(')
    .replace(/sin\(/g, '\\sin(')
    .replace(/tan\(/g, '\\tan(')
    
    // Fix double exponents and angle-variable combinations
    .replace(/(\d+)°v_(\w+)/g, '$1^{\\circ} \\cdot v_{$2}')
    .replace(/(\d+)\^\\circ v_(\w+)/g, '$1^{\\circ} \\cdot v_{$2}')
    
    // Fix exponents without braces
    .replace(/\^(\d+)([^{]|$)/g, '^{$1}$2')
    .replace(/\^([a-zA-Z])([^{]|$)/g, '^{$1}$2');
}

/**
 * Inline KaTeX Formula component for inline math display
 */
export function InlineKaTeXFormula({ children, className = '', errorColor = '#cc0000' }: Omit<KaTeXFormulaProps, 'display'>) {
  return (
    <KaTeXFormula display={false} className={className} errorColor={errorColor}>
      {children}
    </KaTeXFormula>
  );
}

/**
 * Block KaTeX Formula component for block math display
 */
export function BlockKaTeXFormula({ children, className = '', errorColor = '#cc0000' }: Omit<KaTeXFormulaProps, 'display'>) {
  return (
    <KaTeXFormula display={true} className={className} errorColor={errorColor}>
      {children}
    </KaTeXFormula>
  );
}

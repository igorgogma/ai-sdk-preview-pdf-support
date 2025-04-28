"use client";

import { useEffect, useRef } from 'react';

interface MathFormulaProps {
  formula: string;
  display?: boolean;
  autoDetect?: boolean;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

// Helper function to escape special characters in LaTeX
const escapeLaTeX = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\~')
    .replace(/\^/g, '\\^');
};

// Helper function to detect if a string contains math expressions
const containsMath = (text: string): boolean => {
  // Check for LaTeX dollar sign notation first
  const dollarNotation = /\$[^$]+\$|\$\$[^$]+\$\$/;
  if (dollarNotation.test(text)) {
    return true;
  }

  // Check for LaTeX commands
  const latexCommands = /\\[a-zA-Z]+|\\[^a-zA-Z]/;
  if (latexCommands.test(text)) {
    return true;
  }

  // Check for fractions
  const fractions = /\\frac\{[^}]*\}\{[^}]*\}/;
  if (fractions.test(text)) {
    return true;
  }

  // Common math patterns
  const patterns = [
    /[=><]\s*[-+]?\d+(\.\d+)?([eE][-+]?\d+)?/, // Equations with =, >, <
    /\b\w+\s*=\s*\w+/, // Simple equations like a = b
    /\b\w+\s*\^\s*\d+/, // Exponents like x^2
    /\bsin\b|\bcos\b|\btan\b|\blog\b|\bln\b|\bsqrt\b/, // Common math functions
    /\bv\d*\s*=\s*\d+/, // Velocity equations like v = 10
    /\ba\s*=\s*\d+/, // Acceleration equations like a = 10
    /\bs\s*=\s*\d+/, // Distance equations like s = 10
    /\bt\s*=\s*\d+/, // Time equations like t = 10
    /\bF\s*=\s*\d+/, // Force equations like F = 10
    /\bE\s*=\s*\d+/, // Energy equations like E = 10
    /\bm\s*=\s*\d+/, // Mass equations like m = 10
    /\bg\s*=\s*\d+/, // Gravity equations like g = 10
    /\d+\s*[+\-*/]\s*\d+/, // Basic arithmetic
    /\(\s*[-+]?\d+(\.\d+)?([eE][-+]?\d+)?\s*\)/, // Numbers in parentheses
    /\\times|\\cdot|\\div/, // LaTeX operators
    /\\sqrt\{[^}]*\}/, // Square roots
    /\\left|\\right/, // Delimiters
    /\\sum|\\prod|\\int/, // Summation, product, integral
    /\\infty/, // Infinity
    /\\alpha|\\beta|\\gamma|\\delta|\\epsilon|\\zeta|\\eta|\\theta|\\iota|\\kappa|\\lambda|\\mu|\\nu|\\xi|\\pi|\\rho|\\sigma|\\tau|\\upsilon|\\phi|\\chi|\\psi|\\omega/, // Greek letters
    /\\Delta|\\Gamma|\\Lambda|\\Phi|\\Pi|\\Psi|\\Sigma|\\Theta|\\Upsilon|\\Xi|\\Omega/, // Capital Greek letters
    /\\nabla|\\partial/, // Differential operators
    /\\approx|\\sim|\\cong|\\equiv|\\prec|\\succ|\\preceq|\\succeq|\\ll|\\gg|\\subset|\\supset|\\subseteq|\\supseteq|\\in|\\ni|\\notin/, // Relations
    /\\pm|\\mp|\\times|\\div|\\ast|\\star|\\circ|\\bullet|\\oplus|\\ominus|\\otimes|\\oslash|\\odot/, // Binary operators
    /\\vec\{[^}]*\}|\\overrightarrow\{[^}]*\}/, // Vectors
    /\\hat\{[^}]*\}|\\bar\{[^}]*\}|\\tilde\{[^}]*\}/, // Accents
    /\\mathrm\{[^}]*\}|\\mathbf\{[^}]*\}|\\mathit\{[^}]*\}|\\mathsf\{[^}]*\}|\\mathtt\{[^}]*\}/, // Text styles
    /\\ln\(|\\log\(|\\exp\(|\\sin\(|\\cos\(|\\tan\(/, // Functions with parentheses
    /\d+\s*°/, // Degrees
    /\d+\s*m\/s/, // Meters per second
    /\d+\s*m\/s\^2/, // Meters per second squared
    /\d+\s*kg/, // Kilograms
    /\d+\s*N/, // Newtons
    /\d+\s*J/, // Joules
    /\d+\s*W/, // Watts
    /\d+\s*Pa/, // Pascals
    /\d+\s*K/, // Kelvin
    /\d+\s*°C/, // Celsius
    /\d+\s*°F/, // Fahrenheit
    /\d+\s*mol/, // Moles
  ];

  return patterns.some(pattern => pattern.test(text));
};

export default function MathFormula({ formula, display = false, autoDetect = false }: MathFormulaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we should auto-detect math
    const shouldRender = autoDetect ? containsMath(formula) : true;

    if (!shouldRender) {
      // If not math, just render as text
      if (containerRef.current) {
        containerRef.current.textContent = formula;
      }
      return;
    }

    // Function to load MathJax script
    const loadMathJax = () => {
      return new Promise<void>((resolve) => {
        // Check if MathJax is already being loaded
        if (document.querySelector('script[src*="mathjax"]')) {
          // Script is already loading, wait for it to be ready
          const checkMathJax = () => {
            if (window.MathJax) {
              resolve();
            } else {
              setTimeout(checkMathJax, 100);
            }
          };
          checkMathJax();
          return;
        }

        // If MathJax is not loaded, add a script to load it
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        script.onload = () => {
          // Configure MathJax with more robust settings
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']],
              processEscapes: true,
              processEnvironments: true,
              packages: ['base', 'ams', 'noerrors', 'noundefined', 'newcommand', 'boldsymbol', 'mhchem'],
              macros: {
                'frac': ['\\frac{#1}{#2}', 2],
                'omega': '\\omega',
                'L': 'L',
                'I': 'I',
                'M': 'M',
                'rightarrow': '\\rightarrow',
                'Delta': '\\Delta',
                'circ': '\\circ'
              }
            },
            svg: {
              fontCache: 'global',
              scale: 1.1, // Slightly larger rendering
              mtextInheritFont: true
            },
            startup: {
              typeset: false
            },
            options: {
              enableMenu: false,
              renderActions: {
                addMenu: [],
                checkLoading: []
              }
            }
          };
          resolve();
        };

        document.head.appendChild(script);
      });
    };

    // Function to render formula with improved handling
    const renderFormula = () => {
      if (containerRef.current) {
        try {
          // Preprocess the formula to fix common issues
          let processedFormula = formula;

          // Fix common LaTeX issues
          processedFormula = processedFormula
            // Fix fractions that might be using \frac{1}{2} syntax
            .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '\\frac{$1}{$2}')
            // Fix subscripts and superscripts
            .replace(/\_\{([^{}]+)\}/g, '_{$1}')
            .replace(/\^\{([^{}]+)\}/g, '^{$1}')
            // Fix common physics symbols
            .replace(/\\omega/g, '\\omega')
            .replace(/\\alpha/g, '\\alpha')
            // Fix common formatting issues with L, I, M
            .replace(/L\s*\^\s*2/g, 'L^2')
            .replace(/M\s*L\s*\^\s*2/g, 'ML^2')
            // Fix issues with \text or \mathrm
            .replace(/\\text\{([^{}]+)\}/g, '\\text{$1}')
            .replace(/\\mathrm\{([^{}]+)\}/g, '\\mathrm{$1}')
            // Fix chemical equations
            .replace(/rightarrow/g, '\\rightarrow')
            .replace(/\\rightarrow/g, '\\rightarrow')
            // Fix missing braces for superscripts
            .replace(/(\w)(\d+)(?!\w|\})/g, '$1^{$2}')
            // Fix Delta H
            .replace(/Delta\s*H/g, '\\Delta H')
            // Fix degree symbol
            .replace(/(\d+)\s*circ/g, '$1\\circ');

          // Check if the formula already contains dollar signs
          const hasDollarSigns = /\$|\$\$/.test(processedFormula);
          const hasBackslashDelimiters = /\\[\(\)\[\]]/.test(processedFormula);

          // Prepare the HTML content
          let htmlContent;

          if (hasDollarSigns) {
            // If it already has dollar signs, use it as is
            htmlContent = processedFormula;
          } else if (hasBackslashDelimiters) {
            // If it has \( \) or \[ \] delimiters, use it as is
            htmlContent = processedFormula;
          } else {
            // Otherwise, wrap it in the appropriate delimiters
            htmlContent = display
              ? `$$${processedFormula}$$`
              : `$${processedFormula}$`;
          }

          // Set the HTML content
          containerRef.current.innerHTML = htmlContent;

          // Typeset the formula
          if (window.MathJax && window.MathJax.typeset) {
            try {
              // Force a typeset of the container
              window.MathJax.typeset([containerRef.current]);

              // Check if typesetting was successful
              if (containerRef.current.querySelector('.MathJax') ||
                  containerRef.current.querySelector('.mjx-math')) {
                // Successfully typeset
                console.log('Successfully typeset formula');
              } else {
                throw new Error('MathJax did not render any elements');
              }
            } catch (error) {
              console.error('Error typesetting formula:', error);

              // Try an alternative approach
              try {
                // Reset the container and try with different delimiters
                containerRef.current.innerHTML = display
                  ? `\\[${processedFormula}\\]`
                  : `\\(${processedFormula}\\)`;

                window.MathJax.typeset([containerRef.current]);

                // Check if typesetting was successful
                if (!containerRef.current.querySelector('.MathJax') &&
                    !containerRef.current.querySelector('.mjx-math')) {
                  throw new Error('Alternative approach failed');
                }
              } catch (secondError) {
                console.error('Second error typesetting formula:', secondError);

                // Try a third approach with explicit HTML
                try {
                  // Use a more explicit approach with a span
                  containerRef.current.innerHTML = `<span class="math">${htmlContent}</span>`;
                  window.MathJax.typeset([containerRef.current]);
                } catch (thirdError) {
                  console.error('Third error typesetting formula:', thirdError);
                  // Final fallback to plain text
                  containerRef.current.textContent = formula;
                }
              }
            }
          } else {
            // MathJax not available, use plain text
            containerRef.current.textContent = formula;
          }
        } catch (error) {
          console.error('Error in renderFormula:', error);
          // Final fallback
          containerRef.current.textContent = formula;
        }
      }
    };

    // Main function to handle rendering
    const handleRendering = async () => {
      if (window.MathJax) {
        renderFormula();
      } else {
        try {
          await loadMathJax();
          renderFormula();
        } catch (error) {
          console.error('Error loading MathJax:', error);
          // Fallback to plain text
          if (containerRef.current) {
            containerRef.current.textContent = formula;
          }
        }
      }
    };

    handleRendering();

    // Cleanup function
    return () => {
      // Nothing to clean up
    };
  }, [formula, display, autoDetect]);

  return <div ref={containerRef} className={display ? 'my-4' : 'inline'} />;
}

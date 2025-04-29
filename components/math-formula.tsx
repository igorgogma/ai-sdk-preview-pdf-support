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
              packages: ['base', 'ams', 'noerrors', 'noundefined', 'newcommand', 'boldsymbol', 'mhchem', 'physics'],
              tags: 'ams',
              tagSide: 'right',
              tagIndent: '0.8em',
              multlineWidth: '85%',
              macros: {
                // Greek letters
                'omega': '\\omega',
                'alpha': '\\alpha',
                'beta': '\\beta',
                'gamma': '\\gamma',
                'delta': '\\delta',
                'theta': '\\theta',
                'lambda': '\\lambda',
                'sigma': '\\sigma',
                'pi': '\\pi',
                'phi': '\\phi',

                // Common physics variables
                'L': 'L',
                'I': 'I',
                'M': 'M',
                'v': 'v',
                'a': 'a',
                'g': 'g',
                'F': 'F',
                'E': 'E',
                'm': 'm',
                'c': 'c',

                // Common symbols
                'rightarrow': '\\rightarrow',
                'Delta': '\\Delta',
                'circ': '\\circ',

                // Physics notation
                'vO': '{v_0}',
                'vx': '{v_x}',
                'vy': '{v_y}',
                'ax': '{a_x}',
                'ay': '{a_y}',

                // Common functions
                'cos': '\\cos',
                'sin': '\\sin',
                'tan': '\\tan',

                // Degree symbol
                'deg': '^{\\circ}'
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

            // Fix subscripts without braces (e.g., v_0 -> v_{0}, theta_0 -> theta_{0})
            .replace(/([a-zA-Z]+)_([a-zA-Z0-9]+)(?!\{)/g, '$1_{$2}')

            // Fix specific physics variables with subscripts
            .replace(/v_0/g, 'v_{0}')
            .replace(/v_x/g, 'v_{x}')
            .replace(/v_y/g, 'v_{y}')
            .replace(/v_theta/g, 'v_{\\theta}')
            .replace(/v_Otheta/g, 'v_{0\\theta}')
            .replace(/a_x/g, 'a_{x}')
            .replace(/a_y/g, 'a_{y}')
            .replace(/F_x/g, 'F_{x}')
            .replace(/F_y/g, 'F_{y}')

            // Fix angle notation
            .replace(/theta/g, '\\theta')
            .replace(/alpha/g, '\\alpha')
            .replace(/beta/g, '\\beta')
            .replace(/gamma/g, '\\gamma')
            .replace(/delta/g, '\\delta')
            .replace(/omega/g, '\\omega')
            .replace(/phi/g, '\\phi')

            // Fix degree symbol (multiple patterns)
            .replace(/(\d+)\s*circ/g, '$1^{\\circ}')
            .replace(/(\d+)\s*°/g, '$1^{\\circ}')
            .replace(/(\d+)\s*\\circ/g, '$1^{\\circ}')
            .replace(/(\d+)\s*\\degree/g, '$1^{\\circ}')

            // Fix subscripts and superscripts with braces
            .replace(/\_\{([^{}]+)\}/g, '_{$1}')
            .replace(/\^\{([^{}]+)\}/g, '^{$1}')

            // Fix common physics symbols
            .replace(/\\omega/g, '\\omega')
            .replace(/\\alpha/g, '\\alpha')
            .replace(/\\theta/g, '\\theta')

            // Fix common formatting issues with L, I, M
            .replace(/L\s*\^\s*2/g, 'L^{2}')
            .replace(/M\s*L\s*\^\s*2/g, 'ML^{2}')

            // Fix issues with \text or \mathrm
            .replace(/\\text\{([^{}]+)\}/g, '\\text{$1}')
            .replace(/\\mathrm\{([^{}]+)\}/g, '\\mathrm{$1}')

            // Fix chemical equations
            .replace(/rightarrow/g, '\\rightarrow')
            .replace(/\\rightarrow/g, '\\rightarrow')

            // Fix missing braces for superscripts
            .replace(/(\w)(\d+)(?!\w|\})/g, '$1^{$2}')

            // Fix Delta H and other Greek symbols
            .replace(/Delta\s*H/g, '\\Delta H')
            .replace(/Delta/g, '\\Delta')

            // Fix specific physics notation
            .replace(/\\theta\\theta/g, '\\theta')
            .replace(/R\s*=\s*\\frac\{v_0\^2\s*\\sin\(2\\theta\)\}\{g\}/g, 'R = \\frac{v_{0}^{2}\\sin(2\\theta)}{g}')

            // Fix vector notation
            .replace(/\\vec\{([^{}]+)\}/g, '\\vec{$1}')
            .replace(/\\vec ([a-zA-Z])/g, '\\vec{$1}')

            // Fix specific issues from the screenshots
            .replace(/v0\s*=\s*(\d+)/g, 'v_{0} = $1')
            .replace(/v_0\s*=\s*(\d+)/g, 'v_{0} = $1')
            .replace(/cos\((\d+)°\)/g, '\\cos($1^{\\circ})')
            .replace(/cos\((\d+)\\circ\)/g, '\\cos($1^{\\circ})')
            .replace(/cos\(\\theta\)/g, '\\cos(\\theta)')
            .replace(/sin\(\\theta\)/g, '\\sin(\\theta)')
            .replace(/cos\(theta\)/g, '\\cos(\\theta)')
            .replace(/sin\(theta\)/g, '\\sin(\\theta)')

            // Fix trigonometric functions
            .replace(/cos\(/g, '\\cos(')
            .replace(/sin\(/g, '\\sin(')
            .replace(/tan\(/g, '\\tan(')

            // Fix specific velocity notation from screenshots
            .replace(/v_0\s*=\s*(\d+)v_0\s*=\s*(\d+)/g, 'v_{0} = $1')
            .replace(/v_0\s*=\s*(\d+)\^(\d+)/g, 'v_{0} = $1^{$2}')
            .replace(/v_0\s*=\s*(\d+)\^(\w+)/g, 'v_{0} = $1^{$2}')

            // Fix equals sign spacing
            .replace(/(\w+)\s*=\s*(\w+)/g, '$1 = $2');

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

"use client";

import React from 'react';
import MathFormula from './math-formula';

interface FormulaProps {
  children: React.ReactNode;
  display?: boolean;
  className?: string;
  errorColor?: string;
}

/**
 * Enhanced Formula component that makes it easier to display mathematical formulas
 * 
 * Usage:
 * <Formula>E = mc^2</Formula>
 * <Formula display>F = ma</Formula>
 */
export default function Formula({ 
  children, 
  display = false, 
  className = '',
  errorColor = '#cc0000'
}: FormulaProps) {
  // Convert children to string if needed
  const formula = typeof children === 'string' 
    ? children 
    : String(children);

  // Process the formula to fix common issues
  const processedFormula = preprocessFormula(formula);
  
  return (
    <div className={`formula-container ${display ? 'block-formula' : 'inline-formula'} ${className}`}>
      <MathFormula 
        formula={processedFormula} 
        display={display} 
        autoDetect={true} 
      />
    </div>
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
 * Inline Formula component for inline math display
 */
export function InlineFormula({ children, className = '', errorColor = '#cc0000' }: Omit<FormulaProps, 'display'>) {
  return (
    <Formula display={false} className={className} errorColor={errorColor}>
      {children}
    </Formula>
  );
}

/**
 * Block Formula component for block math display
 */
export function BlockFormula({ children, className = '', errorColor = '#cc0000' }: Omit<FormulaProps, 'display'>) {
  return (
    <Formula display={true} className={className} errorColor={errorColor}>
      {children}
    </Formula>
  );
}

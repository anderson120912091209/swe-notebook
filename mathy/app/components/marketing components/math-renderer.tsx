'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useNamespaceTranslation } from '../../lib/i18n/LanguageContext';

interface MathRendererProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  showSampleQuestion?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({ 
  placeholder,
  value = "",
  onChange,
  className = "",
  showSampleQuestion = true
}) => {
  const { t: tMath } = useNamespaceTranslation('math');
  const defaultPlaceholder = placeholder || tMath('mathRendererPlaceholder');
  const defaultEquation = "e^{i\\pi} + 1 = 0";
  const [mathValue, setMathValue] = useState(value || defaultEquation);
  const [showSymbols, setShowSymbols] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [MathQuill, setMathQuill] = useState<any>(null);
  const [mathField, setMathField] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (value) {
      setMathValue(value);
    }
  }, [value]);

  // Load MathQuill only on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && isClient) {
      const loadMathQuill = async () => {
        try {
          const { addStyles, EditableMathField } = await import('react-mathquill');
          addStyles();
          setMathQuill({ EditableMathField });
          // Ensure default value is set after MathQuill loads
          if (!value) {
            setMathValue(defaultEquation);
          }
        } catch (error) {
          console.error('Failed to load MathQuill:', error);
        }
      };
      loadMathQuill();
    }
  }, [isClient, value, defaultEquation]);

  const handleMathChange = (mathField: any) => {
    const latex = mathField.latex();
    setMathValue(latex);
    onChange?.(latex);
    setMathField(mathField);
  };

  const insertSymbol = (symbol: string) => {
    if (mathField) {
      mathField.write(symbol);
    }
  };

  const commonSymbols = [
    // Basic Operations
    { label: 'Plus', symbol: '+' },
    { label: 'Minus', symbol: '-' },
    { label: 'Times', symbol: '\\times' },
    { label: 'Divide', symbol: '\\div' },
    { label: 'Equals', symbol: '=' },
    { label: 'Not Equal', symbol: '\\neq' },
    { label: 'Approximately', symbol: '\\approx' },
    { label: 'Identical', symbol: '\\equiv' },
    
    // Inequalities
    { label: 'Less Than', symbol: '<' },
    { label: 'Greater Than', symbol: '>' },
    { label: 'Less or Equal', symbol: '\\leq' },
    { label: 'Greater or Equal', symbol: '\\geq' },
    { label: 'Much Less', symbol: '\\ll' },
    { label: 'Much Greater', symbol: '\\gg' },
    
    // Fractions and Roots
    { label: 'Fraction', symbol: '\\frac{a}{b}' },
    { label: 'Square Root', symbol: '\\sqrt{x}' },
    { label: 'Cube Root', symbol: '\\sqrt[3]{x}' },
    { label: 'nth Root', symbol: '\\sqrt[n]{x}' },
    
    // Powers and Subscripts
    { label: 'Power', symbol: 'x^n' },
    { label: 'Subscript', symbol: 'x_n' },
    { label: 'Superscript', symbol: 'x^n' },
    
    // Calculus
    { label: 'Integral', symbol: '\\int_{a}^{b}' },
    { label: 'Indefinite Integral', symbol: '\\int' },
    { label: 'Derivative', symbol: '\\frac{d}{dx}' },
    { label: 'Partial Derivative', symbol: '\\frac{\\partial}{\\partial x}' },
    { label: 'Limit', symbol: '\\lim_{x \\to a}' },
    { label: 'Differential', symbol: 'dx' },
    
    // Summation and Products
    { label: 'Summation', symbol: '\\sum_{i=1}^{n}' },
    { label: 'Product', symbol: '\\prod_{i=1}^{n}' },
    { label: 'Infinite Sum', symbol: '\\sum_{i=1}^{\\infty}' },
    
    // Greek Letters
    { label: 'α', symbol: '\\alpha' },
    { label: 'β', symbol: '\\beta' },
    { label: 'γ', symbol: '\\gamma' },
    { label: 'δ', symbol: '\\delta' },
    { label: 'ε', symbol: '\\epsilon' },
    { label: 'ζ', symbol: '\\zeta' },
    { label: 'η', symbol: '\\eta' },
    { label: 'θ', symbol: '\\theta' },
    { label: 'ι', symbol: '\\iota' },
    { label: 'κ', symbol: '\\kappa' },
    { label: 'λ', symbol: '\\lambda' },
    { label: 'μ', symbol: '\\mu' },
    { label: 'ν', symbol: '\\nu' },
    { label: 'ξ', symbol: '\\xi' },
    { label: 'π', symbol: '\\pi' },
    { label: 'ρ', symbol: '\\rho' },
    { label: 'σ', symbol: '\\sigma' },
    { label: 'τ', symbol: '\\tau' },
    { label: 'υ', symbol: '\\upsilon' },
    { label: 'φ', symbol: '\\phi' },
    { label: 'χ', symbol: '\\chi' },
    { label: 'ψ', symbol: '\\psi' },
    { label: 'ω', symbol: '\\omega' },
    
    // Capital Greek Letters
    { label: 'Α', symbol: '\\Alpha' },
    { label: 'Β', symbol: '\\Beta' },
    { label: 'Γ', symbol: '\\Gamma' },
    { label: 'Δ', symbol: '\\Delta' },
    { label: 'Ε', symbol: '\\Epsilon' },
    { label: 'Ζ', symbol: '\\Zeta' },
    { label: 'Η', symbol: '\\Eta' },
    { label: 'Θ', symbol: '\\Theta' },
    { label: 'Ι', symbol: '\\Iota' },
    { label: 'Κ', symbol: '\\Kappa' },
    { label: 'Λ', symbol: '\\Lambda' },
    { label: 'Μ', symbol: '\\Mu' },
    { label: 'Ν', symbol: '\\Nu' },
    { label: 'Ξ', symbol: '\\Xi' },
    { label: 'Π', symbol: '\\Pi' },
    { label: 'Ρ', symbol: '\\Rho' },
    { label: 'Σ', symbol: '\\Sigma' },
    { label: 'Τ', symbol: '\\Tau' },
    { label: 'Υ', symbol: '\\Upsilon' },
    { label: 'Φ', symbol: '\\Phi' },
    { label: 'Χ', symbol: '\\Chi' },
    { label: 'Ψ', symbol: '\\Psi' },
    { label: 'Ω', symbol: '\\Omega' },
    
    // Set Theory
    { label: 'Element Of', symbol: '\\in' },
    { label: 'Not Element Of', symbol: '\\notin' },
    { label: 'Subset', symbol: '\\subset' },
    { label: 'Superset', symbol: '\\supset' },
    { label: 'Proper Subset', symbol: '\\subsetneq' },
    { label: 'Intersection', symbol: '\\cap' },
    { label: 'Union', symbol: '\\cup' },
    { label: 'Empty Set', symbol: '\\emptyset' },
    { label: 'Universal Set', symbol: '\\mathbb{U}' },
    
    // Logic
    { label: 'And', symbol: '\\land' },
    { label: 'Or', symbol: '\\lor' },
    { label: 'Not', symbol: '\\neg' },
    { label: 'Implies', symbol: '\\implies' },
    { label: 'Iff', symbol: '\\iff' },
    { label: 'Exists', symbol: '\\exists' },
    { label: 'For All', symbol: '\\forall' },
    
    // Arrows
    { label: 'Right Arrow', symbol: '\\rightarrow' },
    { label: 'Left Arrow', symbol: '\\leftarrow' },
    { label: 'Double Arrow', symbol: '\\leftrightarrow' },
    { label: 'Long Arrow', symbol: '\\longrightarrow' },
    { label: 'Maps To', symbol: '\\mapsto' },
    
    // Functions
    { label: 'Function', symbol: 'f(x)' },
    { label: 'Composition', symbol: 'f \\circ g' },
    { label: 'Inverse', symbol: 'f^{-1}' },
    { label: 'Limit Function', symbol: '\\lim_{x \\to a} f(x)' },
    
    // Matrices
    { label: 'Matrix', symbol: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Determinant', symbol: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    { label: 'Vector', symbol: '\\vec{v}' },
    
    // Special Functions
    { label: 'sin', symbol: '\\sin' },
    { label: 'cos', symbol: '\\cos' },
    { label: 'tan', symbol: '\\tan' },
    { label: 'log', symbol: '\\log' },
    { label: 'ln', symbol: '\\ln' },
    { label: 'exp', symbol: '\\exp' },
    { label: 'abs', symbol: '|x|' },
    { label: 'Factorial', symbol: 'n!' },
    
    // Infinity and Numbers
    { label: 'Infinity', symbol: '\\infty' },
    { label: 'Imaginary', symbol: 'i' },
    { label: 'Natural Numbers', symbol: '\\mathbb{N}' },
    { label: 'Integers', symbol: '\\mathbb{Z}' },
    { label: 'Rational Numbers', symbol: '\\mathbb{Q}' },
    { label: 'Real Numbers', symbol: '\\mathbb{R}' },
    { label: 'Complex Numbers', symbol: '\\mathbb{C}' },
    
    // Brackets and Parentheses
    { label: 'Parentheses', symbol: '()' },
    { label: 'Brackets', symbol: '[]' },
    { label: 'Braces', symbol: '\\{\\}' },
    { label: 'Angle Brackets', symbol: '\\langle \\rangle' },
    { label: 'Absolute Value', symbol: '|x|' },
    { label: 'Ceiling', symbol: '\\lceil x \\rceil' },
    { label: 'Floor', symbol: '\\lfloor x \\rfloor' },
    
    // Dots and Ellipsis
    { label: 'Dot', symbol: '\\cdot' },
    { label: 'Ellipsis', symbol: '\\cdots' },
    { label: 'Vertical Dots', symbol: '\\vdots' },
    { label: 'Diagonal Dots', symbol: '\\ddots' },
    
    // Other Symbols
    { label: 'Degree', symbol: '^{\\circ}' },
    { label: 'Percent', symbol: '\\%' },
    { label: 'Prime', symbol: '^{\\prime}' },
    { label: 'Double Prime', symbol: '^{\\prime\\prime}' },
    { label: 'Angle', symbol: '\\angle' },
    { label: 'Perpendicular', symbol: '\\perp' },
    { label: 'Parallel', symbol: '\\parallel' },
    { label: 'Similar', symbol: '\\sim' },
    { label: 'Congruent', symbol: '\\cong' },
    { label: 'Approximately', symbol: '\\approx' },
    { label: 'Proportional', symbol: '\\propto' },
    { label: 'Gradient', symbol: '\\nabla' },
    { label: 'Laplacian', symbol: '\\Delta' },
    { label: 'Partial', symbol: '\\partial' },
  ];

  // Filter symbols based on search term
  const filteredSymbols = commonSymbols.filter(symbol => 
    symbol.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state while MathQuill is loading
  if (!isClient || !MathQuill) {
    return (
      <div className={`bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-100 relative ${className}`}>
        <div className="w-full h-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-2 border-2 border-neutral-200 relative ${className}`}>
      {/* MathQuill Input Field */}
      <div className="relative" ref={containerRef}>
        <MathQuill.EditableMathField
          latex={mathValue}
          onChange={handleMathChange}
          className="w-full bg-transparent text-gray-600 placeholder-gray-400 
          resize-none outline-none text-sm leading-relaxed min-h-[40px] pr-12 border-none text-center"
        />
        
      </div>

      {/* Math Symbols Panel */}
      {showSymbols && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-zinc-300 rounded-xl shadow-xl p-3 z-50 max-h-96 w-full backdrop-blur-sm animate-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                     {tMath('mathSymbolsTitle')}
            </h3>
            <button 
              onClick={() => setShowSymbols(false)}
              className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                       placeholder={tMath('mathSymbolsSearch')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-72 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="grid grid-cols-4 gap-1.5">
              {filteredSymbols.map((item, index) => (
                <button
                  key={index}
                  onClick={() => insertSymbol(item.symbol)}
                  className="bg-gray-50 hover:bg-blue-100 border border-gray-200 rounded-lg p-1.5 text-center transition-all duration-200 hover:shadow-sm hover:border-blue-300 min-h-[50px] flex flex-col justify-center items-center"
                >
                  <div className="font-semibold text-xs text-gray-800 leading-tight mb-0.5 break-words w-full">
                    {item.label}
                  </div>
                  <div className="text-[9px] text-gray-500 leading-tight break-all w-full font-mono">
                    {item.symbol.length > 12 ? item.symbol.substring(0, 10) + '...' : item.symbol}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
            </svg>
                   {tMath('toolbarImage')}
          </button>
          <button className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded-full text-xs font-medium">
            {tMath('toolbarNew')}
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 p-1 rounded-full">
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
                   {tMath('toolbarDraw')}
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSymbols(!showSymbols)}
            className="bg-blue-50 hover:bg-blue-100 
             hover: text-blue-700 px-2 py-1 rounded-full text-xs 
             font-semibold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
                   {tMath('toolbarFunction')}
          </button>
          <button className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            {tMath('toolbarCheckAnswer')}
            <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h6l-2 8 10-12h-6l2-8z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathRenderer;

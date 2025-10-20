// Suggestion engine for autocomplete

import { Suggestion } from './types';

// Keyword dictionary
const KEYWORDS: Suggestion[] = [
  // Greek letters
  { keyword: 'alpha', display: 'α', description: 'Greek letter alpha' },
  { keyword: 'beta', display: 'β', description: 'Greek letter beta' },
  { keyword: 'gamma', display: 'γ', description: 'Greek letter gamma' },
  { keyword: 'delta', display: 'δ', description: 'Greek letter delta' },
  { keyword: 'epsilon', display: 'ε', description: 'Greek letter epsilon' },
  { keyword: 'zeta', display: 'ζ', description: 'Greek letter zeta' },
  { keyword: 'eta', display: 'η', description: 'Greek letter eta' },
  { keyword: 'theta', display: 'θ', description: 'Greek letter theta' },
  { keyword: 'iota', display: 'ι', description: 'Greek letter iota' },
  { keyword: 'kappa', display: 'κ', description: 'Greek letter kappa' },
  { keyword: 'lambda', display: 'λ', description: 'Greek letter lambda' },
  { keyword: 'mu', display: 'μ', description: 'Greek letter mu' },
  { keyword: 'nu', display: 'ν', description: 'Greek letter nu' },
  { keyword: 'xi', display: 'ξ', description: 'Greek letter xi' },
  { keyword: 'pi', display: 'π', description: 'Greek letter pi' },
  { keyword: 'rho', display: 'ρ', description: 'Greek letter rho' },
  { keyword: 'sigma', display: 'σ', description: 'Greek letter sigma' },
  { keyword: 'tau', display: 'τ', description: 'Greek letter tau' },
  { keyword: 'upsilon', display: 'υ', description: 'Greek letter upsilon' },
  { keyword: 'phi', display: 'φ', description: 'Greek letter phi' },
  { keyword: 'chi', display: 'χ', description: 'Greek letter chi' },
  { keyword: 'psi', display: 'ψ', description: 'Greek letter psi' },
  { keyword: 'omega', display: 'ω', description: 'Greek letter omega' },
  
  // Functions
  { keyword: 'sqrt(x)', display: '√', description: 'Square root: sqrt(x)' },
  { keyword: 'frac(a,b)', display: 'a/b', description: 'Fraction: frac(a, b)' },
  { keyword: 'sin(x)', display: 'sin', description: 'Sine: sin(x)' },
  { keyword: 'cos(x)', display: 'cos', description: 'Cosine: cos(x)' },
  { keyword: 'tan(x)', display: 'tan', description: 'Tangent: tan(x)' },
  { keyword: 'log(x)', display: 'log', description: 'Logarithm: log(x)' },
  { keyword: 'ln(x)', display: 'ln', description: 'Natural log: ln(x)' },
  { keyword: 'exp(x)', display: 'exp', description: 'Exponential: exp(x)' },
  { keyword: 'abs(x)', display: '|x|', description: 'Absolute value: abs(x)' },
  { keyword: 'sum(x)', display: '∑', description: 'Summation: sum(expr)' },
  { keyword: 'int(x)', display: '∫', description: 'Integral: int(expr)' },
  { keyword: 'lim(x)', display: 'lim', description: 'Limit: lim(expr)' },
];

/**
 * Get suggestions for a partial input
 */
export function getSuggestions(prefix: string): Suggestion[] {
  if (!prefix || prefix.length < 1) {
    return [];
  }

  const lowerPrefix = prefix.toLowerCase();
  
  // For matching, extract just the function name (before parentheses)
  const matchName = (keyword: string) => {
    const name = keyword.split('(')[0];
    return name.toLowerCase();
  };
  
  // Exact match first
  const exactMatches = KEYWORDS.filter(k => 
    matchName(k.keyword) === lowerPrefix
  );
  
  // Starts with
  const startsWith = KEYWORDS.filter(k => 
    matchName(k.keyword).startsWith(lowerPrefix) &&
    matchName(k.keyword) !== lowerPrefix
  );
  
  // Contains (fuzzy)
  const contains = KEYWORDS.filter(k => 
    matchName(k.keyword).includes(lowerPrefix) &&
    !matchName(k.keyword).startsWith(lowerPrefix)
  );
  
  return [...exactMatches, ...startsWith, ...contains].slice(0, 8);
}

// Greek-only provider (for keystroke MVP)
export function getGreekSuggestions(prefix: string): Suggestion[] {
  if (!prefix || prefix.length < 1) return [];
  const greekSet = new Set([
    'alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega'
  ]);
  const lower = prefix.toLowerCase();
  const greekKeywords = KEYWORDS.filter(k => greekSet.has(k.keyword));
  const nameOf = (k: string) => k.split('(')[0].toLowerCase();
  const exact = greekKeywords.filter(k => nameOf(k.keyword) === lower);
  const starts = greekKeywords.filter(k => nameOf(k.keyword).startsWith(lower) && nameOf(k.keyword) !== lower);
  const contains = greekKeywords.filter(k => nameOf(k.keyword).includes(lower) && !nameOf(k.keyword).startsWith(lower));
  return [...exact, ...starts, ...contains].slice(0, 8);
}

/**
 * Get the current token being typed at cursor position
 */
export function getCurrentToken(src: string, cursorPosition: number): { token: string; start: number; end: number } | null {
  if (cursorPosition < 0 || cursorPosition > src.length) {
    return null;
  }

  // Find the token boundaries
  let start = cursorPosition;
  let end = cursorPosition;

  // Move back to find start
  while (start > 0 && /[a-zA-Z]/.test(src[start - 1])) {
    start--;
  }

  // Move forward to find end
  while (end < src.length && /[a-zA-Z]/.test(src[end])) {
    end++;
  }

  const token = src.substring(start, end);
  
  if (!token) {
    return null;
  }

  return { token, start, end };
}

/**
 * Apply a suggestion to the source string
 */
export function applySuggestion(
  src: string,
  cursorPosition: number,
  suggestion: Suggestion
): { newSrc: string; newCursorPosition: number } {
  const currentToken = getCurrentToken(src, cursorPosition);
  
  if (!currentToken) {
    // Insert at cursor
    const newSrc = src.substring(0, cursorPosition) + suggestion.keyword + src.substring(cursorPosition);
    return {
      newSrc,
      newCursorPosition: cursorPosition + suggestion.keyword.length
    };
  }

  // Replace current token
  const newSrc = src.substring(0, currentToken.start) + suggestion.keyword + src.substring(currentToken.end);
  
  return {
    newSrc,
    newCursorPosition: currentToken.start + suggestion.keyword.length
  };
}

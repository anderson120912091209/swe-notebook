// Simple preprocessor to convert custom syntax to LaTeX

// Greek letters mapping (without backslash)
const GREEK_LETTERS: Record<string, string> = {
  'alpha': '\\alpha',
  'beta': '\\beta',
  'gamma': '\\gamma',
  'delta': '\\delta',
  'epsilon': '\\epsilon',
  'zeta': '\\zeta',
  'eta': '\\eta',
  'theta': '\\theta',
  'iota': '\\iota',
  'kappa': '\\kappa',
  'lambda': '\\lambda',
  'mu': '\\mu',
  'nu': '\\nu',
  'xi': '\\xi',
  'pi': '\\pi',
  'rho': '\\rho',
  'sigma': '\\sigma',
  'tau': '\\tau',
  'upsilon': '\\upsilon',
  'phi': '\\phi',
  'chi': '\\chi',
  'psi': '\\psi',
  'omega': '\\omega',
  'sum': '\\sum',
  'sqrt': '\\sqrt',
  'sin': '\\sin',
  'cos': '\\cos',
  'tan': '\\tan',
  'log': '\\log',
  'ln': '\\ln',
  'exp': '\\exp',
  'abs': '\\abs',
  'lim': '\\lim',
  'int': '\\int',
};

/**
 * Preprocess custom syntax to LaTeX
 */
export function preprocessToLatex(input: string): string {
  let result = input;
  
  // 1. Convert Greek letters (alpha -> \alpha)
  for (const [greek, latex] of Object.entries(GREEK_LETTERS)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${greek}\\b`, 'g');
    result = result.replace(regex, latex);
  }
  
  // 2. Convert fractions (x/y -> \frac{x}{y})
  // This is more complex - we need to handle nested cases
  result = convertFractions(result);
  
  return result;
}

/**
 * Convert x/y syntax to \frac{x}{y}
 * Handles complex expressions with parentheses like x/(sqrt(x))
 */
function convertFractions(input: string): string {
  let result = input;
  
  // Use a simpler approach: find all / operators and convert them
  let i = 0;
  while (i < result.length) {
    if (result[i] === '/') {
      // Find the numerator (left side)
      const numerator = extractExpressionSimple(result, i, 'left');
      // Find the denominator (right side)  
      const denominator = extractExpressionSimple(result, i, 'right');
      
      if (numerator && denominator && !isAlreadyLatexFraction(result, i - numerator.length, i + denominator.length)) {
        // Replace the division with LaTeX fraction
        const start = i - numerator.length;
        const end = i + 1 + denominator.length;
        const latexFraction = `\\frac{${numerator}}{${denominator}}`;
        result = result.substring(0, start) + latexFraction + result.substring(end);
        
        // Adjust index for the new length
        i = start + latexFraction.length;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return result;
}

/**
 * Simple expression extraction for fractions
 */
function extractExpressionSimple(input: string, divisionIndex: number, direction: 'left' | 'right'): string {
  if (direction === 'left') {
    // Look backwards from the division operator
    let start = divisionIndex - 1;
    let parenCount = 0;
    
    while (start >= 0) {
      const char = input[start];
      
      if (char === ')') {
        parenCount++;
      } else if (char === '(') {
        parenCount--;
        if (parenCount === 0) {
          // Found matching opening parenthesis
          return input.substring(start, divisionIndex);
        }
      } else if (parenCount === 0 && (char === ' ' || char === '+' || char === '-' || char === '*' || char === '=')) {
        // Found a different operator, stop here
        break;
      }
      
      start--;
    }
    
    // Extract the expression
    return input.substring(start + 1, divisionIndex).trim();
  } else {
    // Look forwards from the division operator
    let end = divisionIndex + 1;
    let parenCount = 0;
    
    while (end < input.length) {
      const char = input[end];
      
      if (char === '(') {
        parenCount++;
      } else if (char === ')') {
        parenCount--;
        if (parenCount === 0) {
          // Found matching closing parenthesis
          return input.substring(divisionIndex + 1, end + 1);
        }
      } else if (parenCount === 0 && (char === ' ' || char === '+' || char === '-' || char === '*' || char === '/')) {
        // Found a different operator, stop here
        break;
      }
      
      end++;
    }
    
    // Extract the expression
    return input.substring(divisionIndex + 1, end).trim();
  }
}

/**
 * Check if the division is already part of a LaTeX fraction
 */
function isAlreadyLatexFraction(input: string, start: number, end: number): boolean {
  // Look backwards to see if we're inside a \frac{...}{...}
  let i = start - 1;
  let braceCount = 0;
  let foundFrac = false;
  
  while (i >= 0) {
    if (input[i] === '}') {
      braceCount++;
    } else if (input[i] === '{') {
      braceCount--;
      if (braceCount === 0 && i >= 4 && input.substring(i - 4, i) === 'frac') {
        foundFrac = true;
        break;
      }
    }
    i--;
  }
  
  return foundFrac;
}

/**
 * Check if a string contains custom syntax that needs preprocessing
 */
export function needsPreprocessing(input: string): boolean {
  // Check for Greek letters without backslash
  for (const greek of Object.keys(GREEK_LETTERS)) {
    const regex = new RegExp(`\\b${greek}\\b`);
    if (regex.test(input)) {
      return true;
    }
  }
  
  // Check for fraction syntax (simple check for / operator)
  if (input.includes('/')) {
    return true;
  }
  
  return false;
}

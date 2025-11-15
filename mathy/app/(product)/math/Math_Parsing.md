
## Implementation Approaches: 
Convert custom syntax -> LaTeX -> KaTeX rendering. We could also do direct rendering in the future if that brings on faster speed for user experience but that would need much more work with handling the typography and fonts. 
We could also do parser generator and transpile to LaTeX/MathML 

- Parser: PEG.js & Chevrotain 
- Rendering: KaTeX or MathJax 
- Typst's Praser is built on Rust, look for inspirations there if possible. 

## Building a new Syntax Plan 
1. Create a parser that converts custom syntax to an Abstract Syntax Tree (AST). 
2. Convert Abstract Syntax Tree to rendered output through the renderer. 
3. Integration Points: Accept custom syntax instead of LaTeX 

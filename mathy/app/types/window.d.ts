import type katex from 'katex';

declare global {
  interface Window {
    katex: typeof katex;
  }
}

export {};


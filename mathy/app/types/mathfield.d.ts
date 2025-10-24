// MathLive types
declare class MathfieldElement extends HTMLElement {
  value: string;
  focus(): void;
  blur(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          value?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput?: (evt: any) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onBlur?: (evt: any) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onFocus?: (evt: any) => void;
          mathVirtualKeyboardPolicy?: 'auto' | 'manual' | 'sandboxed';
          smartMode?: boolean;
          smartFence?: boolean;
          smartSuperscript?: boolean;
          defaultMode?: 'math' | 'text';
          readOnly?: boolean;
          disabled?: boolean;
        },
        MathfieldElement
      >;
    }
  }
}

export {};

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode, $insertNodes, $getSelection, $isRangeSelection } from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { INSERT_MATH_COMMAND } from './MathPlugin';
import { MathSymbolType } from '../nodes/MathNode';

class MathOption extends MenuOption {
    title: string;
    key: string;
    category: 'primary' | 'secondary' | 'symbol';
    symbol?: string;
    shortcut?: string;
    keywords: string[];

    constructor(
        title: string,
        key: string,
        category: 'primary' | 'secondary' | 'symbol',
        symbol?: string,
        shortcut?: string,
        keywords: string[] = []
    ) {
        super(title);
        this.title = title;
        this.key = key;
        this.category = category;
        this.symbol = symbol;
        this.shortcut = shortcut;
        this.keywords = keywords;
    }
}

// Mock data to match the screenshot structure
const MATH_OPTIONS = [
    // Alpha group
    new MathOption('Variable', 'alpha', 'primary', 'α', 'Enter', ['alpha']),
    new MathOption('Constant', 'alpha_const', 'secondary', 'α', '⌘2', ['alpha']),
    new MathOption('Variable or Function', 'alpha_var_func', 'secondary', '@', '⌘3', ['alpha']),

    // Alpha Symbols Grid
    new MathOption('alpha', 'alpha_sym_1', 'symbol', 'α', '⌘4', ['alpha']),
    new MathOption('alpha', 'alpha_sym_2', 'symbol', 'a', '⌘5', ['alpha']),
    new MathOption('alpha', 'alpha_sym_3', 'symbol', 'A', '⌘6', ['alpha']),
    new MathOption('alpha', 'alpha_sym_4', 'symbol', '𝐀', '⌘7', ['alpha']),
    new MathOption('alpha', 'alpha_sym_5', 'symbol', 'a', '⌘8', ['alpha']),
    new MathOption('alpha', 'alpha_sym_6', 'symbol', 'Ⓐ', '⌘9', ['alpha']),
    new MathOption('alpha', 'alpha_sym_7', 'symbol', 'A', '', ['alpha']),
    new MathOption('alpha', 'alpha_sym_8', 'symbol', '𝓐', '', ['alpha']),

    // Other basic options (kept for functionality)
    new MathOption('Summation', 'sum', 'primary', 'Σ', 'Enter', ['sum', 'summation']),
    new MathOption('Integral', 'int', 'primary', '∫', 'Enter', ['int', 'integral']),
    new MathOption('Fraction', 'frac', 'primary', '/', 'Enter', ['frac', 'fraction']),
    new MathOption('Square Root', 'sqrt', 'primary', '√', 'Enter', ['sqrt', 'root']),
    new MathOption('Superscript', 'sup', 'primary', '^', 'Enter', ['sup', 'superscript', '^']),
    new MathOption('Subscript', 'sub', 'primary', '_', 'Enter', ['sub', 'subscript', '_']),
];

const MATH_KEYWORDS = [
    'summation', 'integral', 'fraction', 'square root', 'superscript', 'sqrt', 'subscript',
    'alpha', 'beta', 'gamma', 'delta', 'theta', 'pi', 'sigma', 'omega',
    '^', '_'
];

export default function MathTypeaheadPlugin() {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    const checkForMathTrigger = useCallback(
        (text: string) => {
            if (!text || text.length === 0) return null;
            const trimmedText = text.trim();
            const lastSpaceIndex = trimmedText.lastIndexOf(' ');
            const lastWord = lastSpaceIndex >= 0
                ? trimmedText.substring(lastSpaceIndex + 1)
                : trimmedText;

            if (lastWord.length === 0) return null;

            const lastWordLower = lastWord.toLowerCase();
            const hasMatch = MATH_KEYWORDS.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                return keywordLower.startsWith(lastWordLower) || keywordLower === lastWordLower;
            });

            if (hasMatch) {
                const leadOffset = lastSpaceIndex >= 0 ? lastSpaceIndex + 1 : 0;
                return {
                    leadOffset,
                    matchingString: lastWord,
                    replaceableString: lastWord,
                };
            }

            if (lastWord === '^' || lastWord === '_') {
                return {
                    leadOffset: text.length - 1,
                    matchingString: lastWord,
                    replaceableString: lastWord,
                };
            }

            return null;
        },
        []
    );

    const options = useMemo(() => {
        if (!queryString) return MATH_OPTIONS;
        const query = queryString.toLowerCase();

        return MATH_OPTIONS.filter((option) => {
            // Check title, key, or keywords
            return (
                option.title.toLowerCase().includes(query) ||
                option.key.toLowerCase().includes(query) ||
                option.keywords.some(k => k.toLowerCase().includes(query))
            );
        });
    }, [queryString]);

    const onSelectOption = useCallback(
        (
            selectedOption: MathOption,
            nodeToReplace: TextNode | null,
            closeMenu: () => void
        ) => {
            editor.update(() => {
                if (nodeToReplace) {
                    nodeToReplace.remove();
                }

                // Handle Greek letters/Symbols insertion
                // If it has a 'symbol' property, insert that as text
                // Unless it's one of the special structural types
                const structuralTypes = ['sum', 'int', 'frac', 'sqrt', 'sup', 'sub'];

                if (structuralTypes.includes(selectedOption.key)) {
                    editor.dispatchCommand(INSERT_MATH_COMMAND, selectedOption.key as MathSymbolType);
                } else if (selectedOption.symbol) {
                    // Insert the symbol character
                    const textNode = new TextNode(selectedOption.symbol);
                    $insertNodes([textNode]);
                } else {
                    // Fallback
                    editor.dispatchCommand(INSERT_MATH_COMMAND, selectedOption.key as MathSymbolType);
                }
                closeMenu();
            });
        },
        [editor]
    );

    return (
        <LexicalTypeaheadMenuPlugin<MathOption>
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            triggerFn={checkForMathTrigger}
            options={options}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
            ) => {
                if (anchorElementRef.current && options.length === 0) {
                    return null;
                }

                // Group options for rendering
                // Note: We must maintain the original indices for selection to work
                const renderedItems = [];
                let currentCategory = '';

                // Helper to render a single option
                const renderOption = (option: MathOption, index: number, isGrid: boolean = false) => {
                    const isSelected = selectedIndex === index;
                    return (
                        <li
                            key={option.key}
                            tabIndex={-1}
                            className={`cursor-pointer ${isGrid
                                    ? `flex items-center justify-center h-10 rounded-md border ${isSelected ? 'bg-[#2a2a2a] border-gray-600' : 'bg-[#222222] border-gray-700 hover:bg-[#2a2a2a]'}`
                                    : `flex items-center justify-between px-3 py-2 rounded-md mb-1 ${isSelected ? 'bg-[#222222]' : 'hover:bg-[#222222]'}`
                                }`}
                            onClick={() => {
                                setHighlightedIndex(index);
                                selectOptionAndCleanUp(option);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            {isGrid ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-lg text-white">{option.symbol}</span>
                                    {option.shortcut && <span className="text-[9px] text-gray-400 absolute top-0.5 right-1">{option.shortcut}</span>}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-6 h-6 rounded ${option.category === 'primary' ? 'bg-purple-900 text-purple-300' : 'bg-green-900 text-green-300'}`}>
                                            {option.symbol || option.title[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-200 font-medium">{option.title}</span>
                                            {option.category === 'secondary' && <span className="text-xs text-gray-500">New</span>}
                                        </div>
                                    </div>
                                    {option.shortcut && <span className="text-xs text-gray-500">{option.shortcut}</span>}
                                </>
                            )}
                        </li>
                    );
                };

                return anchorElementRef.current && options.length
                    ? ReactDOM.createPortal(
                        <div className="fixed z-50 min-w-[300px] max-w-[320px] overflow-hidden rounded-xl border border-gray-700 bg-[#1a1a1a] shadow-2xl text-white font-sans p-2">
                            <ul className="max-h-[400px] overflow-y-auto">
                                {options.map((option, i) => {
                                    // We need to handle the layout structure here manually
                                    // while iterating linearly to preserve indices.
                                    // This is tricky. 
                                    // Simplified approach: Just render them. If it's a symbol, we need to wrap it in a grid container?
                                    // No, we can't wrap multiple <li>s in a container inside a <ul> easily if we map 1:1.
                                    // CSS Grid to the rescue!

                                    // Actually, let's just use classes.
                                    // If it's 'symbol', we want it to be inline-block width 25%?

                                    const isSymbol = option.category === 'symbol';
                                    const prevWasSymbol = i > 0 && options[i - 1].category === 'symbol';

                                    // If this is the FIRST symbol, render a header
                                    const showSymbolHeader = isSymbol && !prevWasSymbol;

                                    return (
                                        <React.Fragment key={option.key}>
                                            {showSymbolHeader && (
                                                <div className="text-xs text-gray-500 mt-2 mb-1 px-1 uppercase tracking-wider font-semibold">Symbols</div>
                                            )}
                                            {/* 
                                                To make a grid, we can float them or use inline-flex.
                                                The parent <ul> needs to handle this mixed layout.
                                                We can style the <li> to be full width for primary/secondary,
                                                and width-1/4 for symbols.
                                                Parent <ul> needs 'flex flex-wrap'.
                                            */}
                                            <div className={`${isSymbol ? 'inline-block w-1/4 p-1' : 'w-full'}`}>
                                                {renderOption(option, i, isSymbol)}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </ul>
                        </div>,
                        anchorElementRef.current
                    )
                    : null;
            }}
        />
    );
}

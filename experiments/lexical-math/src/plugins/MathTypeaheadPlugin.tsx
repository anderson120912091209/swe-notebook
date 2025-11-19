// ====== mathTypeaheadPlugin.tsx 概覽 ======
/* mathTypeaheadPlugin.tsx 是專門用來實現 typeahead 功能的 plugin */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
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

    constructor(title: string, key: string) {
        super(title);
        this.title = title;
        this.key = key;
    }
}

const MATH_OPTIONS = [
    new MathOption('Summation (sum)', 'sum'),
    new MathOption('Integral (int)', 'int'),
    new MathOption('Fraction (frac)', 'frac'),
    new MathOption('Square Root (sqrt)', 'sqrt'),
    new MathOption('Superscript (^)', 'sup'),
    new MathOption('Subscript (_)', 'sub'),
    new MathOption('Alpha (alpha)', 'alpha'),
    new MathOption('Beta (beta)', 'beta'),
    new MathOption('Gamma (gamma)', 'gamma'),
    new MathOption('Delta (delta)', 'delta'),
    new MathOption('Theta (theta)', 'theta'),
    new MathOption('Pi (pi)', 'pi'),
    new MathOption('Sigma (sigma)', 'sigma'),
    new MathOption('Omega (omega)', 'omega'),
];

// All keywords that should trigger the menu
const MATH_KEYWORDS = [
    'sum', 'int', 'frac', 'sqrt', 'sup', 'sub',
    'alpha', 'beta', 'gamma', 'delta', 'theta', 'pi', 'sigma', 'omega',
    '^', '_'
];

export default function MathTypeaheadPlugin() {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    // Auto-detect math keywords as user types
    const checkForMathTrigger = useCallback(
        (text: string) => {
            if (!text || text.length === 0) {
                return null;
            }

            // Get the last word (everything after the last space, or entire text if no spaces)
            // This handles cases like "hello sum" or just "sum"
            const trimmedText = text.trim();
            const lastSpaceIndex = trimmedText.lastIndexOf(' ');
            const lastWord = lastSpaceIndex >= 0 
                ? trimmedText.substring(lastSpaceIndex + 1)
                : trimmedText;

            if (lastWord.length === 0) {
                return null;
            }

            const lastWordLower = lastWord.toLowerCase();

            // Check if any keyword matches or starts with what user is typing
            const hasMatch = MATH_KEYWORDS.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                // User is typing a keyword (lastWord is a prefix of keyword)
                if (keywordLower.startsWith(lastWordLower) && lastWordLower.length >= 1) {
                    return true;
                }
                // Exact match
                if (keywordLower === lastWordLower) {
                    return true;
                }
                return false;
            });

            if (hasMatch) {
                // Calculate the offset where the last word starts
                const leadOffset = lastSpaceIndex >= 0 
                    ? lastSpaceIndex + 1 
                    : 0;
                
                return {
                    leadOffset,
                    matchingString: lastWord,
                    replaceableString: lastWord,
                };
            }

            // Special case: single character triggers ^ and _ at end of text
            if (lastWord === '^' || lastWord === '_') {
                const leadOffset = text.length - 1;
                return {
                    leadOffset,
                    matchingString: lastWord,
                    replaceableString: lastWord,
                };
            }

            return null;
        },
        []
    );

    const options = useMemo(() => {
        if (!queryString) {
            // If no query, show all options
            return MATH_OPTIONS;
        }
        
        const query = queryString.toLowerCase();
        
        // Filter and sort options based on relevance
        return MATH_OPTIONS
            .filter((option) => {
                const titleLower = option.title.toLowerCase();
                const keyLower = option.key.toLowerCase();
                
                // Exact match gets highest priority
                if (keyLower === query) return true;
                if (titleLower.includes(query)) return true;
                
                // Partial match - keyword starts with query
                if (keyLower.startsWith(query)) return true;
                
                // Contains query
                if (keyLower.includes(query)) return true;
                
                return false;
            })
            .sort((a, b) => {
                const aKey = a.key.toLowerCase();
                const bKey = b.key.toLowerCase();
                
                // Exact matches first
                if (aKey === query && bKey !== query) return -1;
                if (bKey === query && aKey !== query) return 1;
                
                // Then starts with query
                if (aKey.startsWith(query) && !bKey.startsWith(query)) return -1;
                if (bKey.startsWith(query) && !aKey.startsWith(query)) return 1;
                
                // Then alphabetical
                return aKey.localeCompare(bKey);
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

                const greekMap: Record<string, string> = {
                    alpha: 'α',
                    beta: 'β',
                    gamma: 'γ',
                    delta: 'δ',
                    theta: 'θ',
                    pi: 'π',
                    sigma: 'σ',
                    omega: 'ω',
                };

                if (greekMap[selectedOption.key]) {
                    console.log('Inserting Greek letter:', greekMap[selectedOption.key]);
                    const textNode = new TextNode(greekMap[selectedOption.key]);
                    $insertNodes([textNode]);
                } else {
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

                return anchorElementRef.current && options.length
                    ? ReactDOM.createPortal(
                        <div className="fixed z-50 min-w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                            <ul className="max-h-[300px] overflow-y-auto p-1">
                                {options.map((option, i) => (
                                    <li
                                        key={option.key}
                                        tabIndex={-1}
                                        className={`cursor - pointer rounded px - 3 py - 2 text - sm ${selectedIndex === i
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            } `}
                                        onClick={() => {
                                            setHighlightedIndex(i);
                                            selectOptionAndCleanUp(option);
                                        }}
                                        onMouseEnter={() => {
                                            setHighlightedIndex(i);
                                        }}
                                    >
                                        {option.title}
                                    </li>
                                ))}
                            </ul>
                        </div>,
                        anchorElementRef.current
                    )
                    : null;
            }}
        />
    );
}

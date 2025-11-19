import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode, $insertNodes } from 'lexical';
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

export default function MathTypeaheadPlugin() {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
        minLength: 0,
    });

    // Custom trigger for "sum", "int" without slash
    const checkForMathTrigger = useCallback(
        (text: string) => {
            const slashMatch = checkForTriggerMatch(text, editor);
            if (slashMatch) return slashMatch;

            // Check for keywords at the end of the text
            const validKeywords = ['sum', 'int', 'frac', 'sqrt', '^', '_'];
            for (const keyword of validKeywords) {
                if (text.endsWith(keyword)) {
                    return {
                        leadOffset: text.length - keyword.length,
                        matchingString: keyword,
                        replaceableString: keyword,
                    };
                }
            }
            return null;
        },
        [checkForTriggerMatch, editor]
    );

    const options = useMemo(() => {
        return MATH_OPTIONS.filter((option) => {
            if (!queryString) return true;
            return (
                option.title.toLowerCase().includes(queryString.toLowerCase()) ||
                option.key.toLowerCase().includes(queryString.toLowerCase())
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

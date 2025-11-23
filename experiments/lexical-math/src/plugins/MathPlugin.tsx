import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    LexicalCommand,
    $insertNodes,
} from 'lexical';
import { useEffect } from 'react';
import { $createMathNode, MathSymbolType } from '../nodes/MathNode';

export const INSERT_MATH_COMMAND: LexicalCommand<MathSymbolType> = createCommand(
    'INSERT_MATH_COMMAND'
);

export default function MathPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_MATH_COMMAND,
            (mathType: MathSymbolType) => {
                const mathNode = $createMathNode(mathType);
                $insertNodes([mathNode]);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}

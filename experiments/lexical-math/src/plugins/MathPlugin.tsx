// ====== mathPlugin.tsx 概覽 ======
/*這個 mathPlugin.tsx 是專門用來 create + register INSERT_MATH_COMMAND 這個 command 的
INSERT_MATH_COMMAND 主要的功能就是會 create 一個 mathNode 並且 insert 到當前的 editor 中
所選的 mathNode 當中 */
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

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    KEY_ENTER_COMMAND,
    COMMAND_PRIORITY_LOW,
    LexicalEditor,
    NodeKey,
    $getNodeByKey,
} from 'lexical';
import { useEffect } from 'react';

type Props = {
    nextEditor?: LexicalEditor;
    parentEditor: LexicalEditor;
    nodeKey: NodeKey;
};

export default function MathNavigationPlugin({
    nextEditor,
    parentEditor,
    nodeKey,
}: Props) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent) => {
                event.preventDefault();
                if (nextEditor) {
                    nextEditor.focus();
                } else {
                    // Exit the math node
                    parentEditor.update(() => {
                        const node = $getNodeByKey(nodeKey);
                        if (node) {
                            node.selectNext();
                        }
                    });
                }
                return true;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor, nextEditor, parentEditor, nodeKey]);

    return null;
}

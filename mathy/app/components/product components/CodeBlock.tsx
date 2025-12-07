import {createReactBlockSpec} from '@blocknote/react';
import CodeMirror from '@uiw/react-codemirror';
import {python} from '@codemirror/lang-python';
import {javascript} from '@codemirror/lang-javascript';
import {vscodeDark, vscodeLight} from '@uiw/codemirror-theme-vscode';
import { useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';

//interface to define the contract in which the component must receive `block` and `editor`. 
//that's how we can use stuff like `block.props.language` and `block.props.code`. 
interface CodeBlockProps {
    block: { //first object, object block 
        props: { //inside the block there's a props object
            language: string; //required: the programming language
            code: string; //required: the actual code text 
            output?: string; //optional: the output from the running the code 
            isExecuting?: boolean; //optional: whether the code is currently running
        };
    }; editor: any; //second prop: the editor object 
} 
//interface creates props, user's input is based on this 'contract'. 
const CodeBlockRenderer: React.FC<CodeBlockProps> = ({block, editor}) => {
    const [code, setCode] = useState(block.props.code || '');
    const [output, setOutput] = useState(block.props.output || '');
    const [isExecuting, setIsExecuting] = useState(false); 
    const {theme} = useTheme(); 

    const handleExecute = async () => {
        setIsExecuting(true); 
        try { 
            // executing the code with codemirror libraries. 
            const result = await executeCode(code, block.props.language); 
            setOutput(result);

            //updating the block props 
            editor.updateBlock(block.id){
                props: {...block.props, output: result}
            }
        }
    }
}

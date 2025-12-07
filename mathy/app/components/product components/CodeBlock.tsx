import {createReactBlockSpec} from '@blocknote/react';
import CodeMirror from '@uiw/react-codemirror';
import {python} from '@codemirror/lang-python';
import {javascript} from '@codemirror/lang-javascript';
import {vscodeDark, vscodeLight} from '@uiw/codemirror-theme-vscode';
import { useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';

//interface to define the contract in which the component must receive `block` and `editor`. 
//that's how we can use stuff like `block.props.language` and `block.props.code`. 
//interface creates props, user's input is based on this 'contract'. 
/* EXAMPLE: 
{
  block: {
    props: {
      language: "python",
      code: "print('Hello')",
      output: "Hello",
      isExecuting: false
    }
  },
  editor: <some editor object>
} */
interface CodeBlockProps {
    block: { //first object, object block 
        props: { //inside the block there's a props object
            language: string; //required: the programming language
            code: string; //required: the actual code text 
            output?: string; //optional: the output from the running the code 
            isExecuting?: boolean; //optional: whether the code is currently running
        };
        id: string; //block id needed for updates
    }; 
    editor: any; //second prop: the editor object 
} 

// Placeholder for code execution - you'll need to implement this
const executeCode = async (code: string, language: string): Promise<string> => {
    // TODO: Implement actual code execution logic
    // This could call a backend API endpoint
    throw new Error('Code execution not yet implemented');
};

//creating a constant that holds the component. 
//React.FC<CodeBlockProps> - typescript type, a react functional component that uses CodeBlockProps.

const CodeBlockRenderer: React.FC<CodeBlockProps> = ({block, editor}) => {
    //front-end local state for the code, initialized from block.props.code
    const [code, setCode] = useState(block.props.code || '');
    //local state for the output, initialized from block.props.output
    const [output, setOutput] = useState(block.props.output || '');
    //creates local state to track if the code is running
    const [isExecuting, setIsExecuting] = useState(false); 
    const {theme} = useTheme(); 

    const handleExecute = async () => {
        setIsExecuting(true); 
        try { 
            // executing the code with codemirror libraries. 
            const result = await executeCode(code, block.props.language); 
            setOutput(result);

            //updating the block props 
            editor.updateBlock(block.id, {
                props: {...block.props, output: result}
            });
        } catch (error: any) {
            setOutput(`Error: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    }; 

    const getLanguageExtension = () => { 
        switch (block.props.language) {
            case 'python': return python();
            case 'javascript': return javascript(); 
            default: return javascript();
        }
    };

    return ( 
        <div className="code-block-wrapper">
            {/*language selection*/}
            <div className="flex items-center justify-between p-2 border-b">
                <select
                    value={block.props.language}
                    onChange={(e)=>{
                        editor.updateBlock(block.id,{
                            props: {...block.props, language: e.target.value}
                        });
                    }}
                    className="text-sm p-1 border rounded-md"
                >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                </select>
                <button 
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="execute-btn"
                >
                    {isExecuting ? 'Running...' : '▶ Run'}
                </button>
            </div>

            {/*code editor*/}
            <CodeMirror
                value={code}
                height="auto"
                minHeight="100px"
                extensions={[getLanguageExtension()]}
                theme={theme === 'dark' ? vscodeDark : vscodeLight}
                onChange={(value) => { 
                    setCode(value);
                    editor.updateBlock(block.id, {
                        props: {...block.props, code: value}
                    });
                }}
            />
            
            {/*output display*/}
            {output && (
                <div className="output-container">
                    <div className="output-label">Output: </div>
                    <pre className="output-content">{output}</pre>
                </div>
            )}
        </div>
    );
};

export const CodeBlock = createReactBlockSpec(
    {
        type: 'codeBlock',
        propSchema: {
            language: {
                default: 'javascript',
                values: ['javascript', 'python', 'typescript'],
            },
            code: {
                default: '',
            },
            output: {
                default: '',
            },
            isExecuting: {
                default: false,
                values: [true, false],
            },
        },
        content: 'none',
    },
    {
        render: (props) => {
            return <CodeBlockRenderer {...props} />;
        },
    }
);

export default CodeBlockRenderer;
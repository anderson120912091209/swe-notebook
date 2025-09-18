'use client';

import { useRef, useEffect, useState } from 'react';
import YooptaEditor, { createYooptaEditor, YooEditor } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Embed from '@yoopta/embed';
import Callout from '@yoopta/callout';
import { NumberedList, BulletedList, TodoList } from '@yoopta/lists';
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import Code from '@yoopta/code';
import Divider from '@yoopta/divider';
import ActionMenuList from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';

// Mock toolbar component
const NotionToolbar = (props: React.ComponentProps<typeof DefaultToolbarRender>) => <DefaultToolbarRender {...props} />;

// Mock action menu component
const ActionNotionMenuExample = () => <div>Action Menu</div>;

const plugins = [
  Paragraph,
  Divider,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Embed,
];

const TOOLS = {
  ActionMenu: {
    render: ActionNotionMenuExample,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: NotionToolbar,
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
};

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

export default function YooptaDemoEditor() {
  const selectionRef = useRef(null);
  const [editor, setEditor] = useState<YooEditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Initialize editor after component mounts
    try {
      const editorInstance = createYooptaEditor();
      setEditor(editorInstance);
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize Yoopta editor:', error);
      setHasError(true);
      setIsReady(true);
    }
  }, []);

  // Error boundary for Slate.js errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Cannot resolve a DOM node from Slate node')) {
        console.error('Slate.js DOM resolution error:', event);
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (!isReady || !editor) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            <p>Editor failed to load. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div ref={selectionRef} className="relative [&_*]:!text-[#2b2b2b]">
        <YooptaEditor
          key="yoopta-editor"
          editor={editor}
          plugins={plugins}
          tools={TOOLS}
          selectionBoxRoot={selectionRef}
          marks={MARKS}
        />
      </div>
    </div>
  );
}


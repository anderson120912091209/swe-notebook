import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  Hash, 
  Calculator, 
  Code, 
  Quote, 
  Minus
} from 'lucide-react';

interface SlashCommandItem {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SlashCommandProps {
  position: { top: number; left: number };
  onSelect: (key: string) => void;
  onClose: () => void;
  searchQuery?: string;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  { 
    key: 'text', 
    label: 'Text', 
    description: 'Start writing with plain text',
    icon: Type 
  },
  { 
    key: 'heading', 
    label: 'Heading', 
    description: 'Big section heading',
    icon: Hash 
  },
  { 
    key: 'math', 
    label: 'Math Block', 
    description: 'Display mathematical equation',
    icon: Calculator 
  },
  { 
    key: 'math-inline', 
    label: 'Inline Math', 
    description: 'Inline mathematical expression',
    icon: Calculator 
  },
  { 
    key: 'code', 
    label: 'Code Block', 
    description: 'Code with syntax highlighting',
    icon: Code 
  },
  { 
    key: 'quote', 
    label: 'Quote', 
    description: 'Capture a quote or important note',
    icon: Quote 
  },
  { 
    key: 'divider', 
    label: 'Divider', 
    description: 'Visually divide blocks',
    icon: Minus 
  }
];

export default function SlashCommand({ 
  position, 
  onSelect, 
  onClose, 
  searchQuery = '' 
}: SlashCommandProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].key);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onSelect, onClose]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[280px] max-w-[400px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {filteredCommands.map((command, index) => {
        const Icon = command.icon;
        return (
          <div
            key={command.key}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              index === selectedIndex 
                ? 'bg-blue-50 text-blue-900' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onSelect(command.key)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              index === selectedIndex ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{command.label}</div>
              <div className="text-xs text-gray-500">{command.description}</div>
            </div>
            {command.key === 'math-inline' && (
              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Inline
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

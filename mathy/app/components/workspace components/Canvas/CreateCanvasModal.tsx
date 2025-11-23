'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useWorkspace } from '@/app/contexts/WorkspaceContext';

interface CreateCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFolderId?: string;
}

export default function CreateCanvasModal({ isOpen, onClose, defaultFolderId }: CreateCanvasModalProps) {
  const { createCanvas } = useWorkspace();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      await createCanvas(title.trim(), defaultFolderId, icon || undefined);
      setTitle('');
      setIcon('');
      onClose();
    } catch (error) {
      console.error('Failed to create canvas:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setTitle('');
      setIcon('');
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="sm"
      classNames={{
        base: "bg-transparent",
        backdrop: "bg-black/50"
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1" style={{ color: 'var(--foreground)' }}>
            Create New Canvas
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Canvas Title"
                placeholder="Enter canvas title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                isRequired
                maxLength={100}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border border-[var(--border-color)] hover:border-[var(--border-color)] data-[hover=true]:border-[var(--border-color)] group-data-[focus=true]:border-[var(--border-color)]"
                }}
                style={{ color: 'var(--foreground)' }}
              />
              
              <Input
                label="Icon (optional)"
                placeholder="🎨"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "border border-[var(--border-color)] hover:border-[var(--border-color)] data-[hover=true]:border-[var(--border-color)] group-data-[focus=true]:border-[var(--border-color)]"
                }}
                style={{ color: 'var(--foreground)' }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="light" 
              onPress={handleClose}
              isDisabled={isCreating}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              type="submit"
              isLoading={isCreating}
              isDisabled={!title.trim()}
              className="cursor-pointer"
            >
              {isCreating ? 'Creating...' : 'Create Canvas'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

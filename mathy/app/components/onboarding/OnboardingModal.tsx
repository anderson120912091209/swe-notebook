'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { completeOnboarding } from '@/app/lib/api/onboarding';
import { useAuth } from '@/app/contexts/AuthContext';
import { onboardingCache } from '@/app/lib/cache/onboardingCache';
import KeyboardKey from './KeyboardKey';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { customSchema, getMathMenuItems, getSlashMenuItems } from '@/app/lib/blocknote-schema';
import { filterSuggestionItems } from '@blocknote/core';
import { useTheme } from '@/app/contexts/ThemeContext';
import MathLiveDisplay from '@/app/components/product components/MathLiveDisplay';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interactive BlockNote editor component for onboarding demo
function InteractiveEditorDemo() {
  const { theme } = useTheme();
  
  // Create editor with initial content containing an example inline math
  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Try typing ',
            styles: {},
          },
          {
            type: 'text',
            text: '$',
            styles: { code: true },
          },
          {
            type: 'text',
            text: ' or ',
            styles: {},
          },
          {
            type: 'text',
            text: '/math',
            styles: { code: true },
          },
          {
            type: 'text',
            text: ' to insert inline math!',
            styles: {},
          },
        ],
      },
    ],
  });

  return (
    <>
      <div className="w-full onboarding-editor-demo">
        <BlockNoteView
          editor={editor}
          theme={theme}
          className="[&_.bn-editor]:!bg-transparent [&_.bn-container]:!bg-transparent [&_.bn-editor]:!px-0 [&_.bn-editor]:!py-2"
        >
          {/* $ menu for inline math */}
          {/* @ts-expect-error - SuggestionMenuController API is correct but TypeScript inference has issues */}
          <SuggestionMenuController
            triggerCharacter="$"
            getItems={async (query) =>
              filterSuggestionItems(getMathMenuItems(editor), query)
            }
          />
          {/* / slash menu with inline math included */}
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              filterSuggestionItems(getSlashMenuItems(editor), query)
            }
          />
        </BlockNoteView>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .onboarding-editor-demo .bn-side-menu,
          .onboarding-editor-demo .bn-block-handle,
          .onboarding-editor-demo .bn-block-menu,
          .onboarding-editor-demo .bn-formatting-toolbar {
            display: none !important;
          }
        `
      }} />
    </>
  );
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Clarity',
    description: 'Your intelligent workspace for math and ideas',
    content: (
      <div className="space-y-6">
        {/* Video/Image Container */}
        <div 
          className="w-full rounded-lg border overflow-hidden"
          style={{ 
            background: 'var(--hover-bg)', 
            borderColor: 'var(--border-color)',
            aspectRatio: '16/9',
            minHeight: '200px',
          }}
        >
          {/* Placeholder for video/image - you can replace this with an actual video or image */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-4xl mb-2" style={{ color: 'var(--foreground-muted)' }}>
                🎥
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Video or image placeholder
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 text-center max-w-lg mx-auto">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Think Clearly, Work Efficiently
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Clarity helps you organize your thoughts, solve complex math problems, 
            and share your knowledge seamlessly. Get started by creating your first page.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'inline-math',
    title: 'Inline Math',
    description: 'Type math expressions anywhere in your notes',
    content: (
      <div className="space-y-6">
        {/* Video Container */}
        <div 
          className="w-full rounded-lg border overflow-hidden"
          style={{ 
            background: 'var(--hover-bg)', 
            borderColor: 'var(--border-color)',
          }}
        >
          <video
            src="/onboarding/second_onboarding1.mp4"
            className="w-full h-auto"
            autoPlay
            muted
            loop
            style={{
              display: 'block',
            }}
          />
        </div>

        {/* Description and Keyboard Shortcut */}
        <div className="space-y-4 max-w-lg mx-auto">
          <div>
            <h3 className="text-lg font-semibold flex items-center flex-wrap gap-2" style={{ color: 'var(--foreground)' }}>
              <span>Type</span>
              <KeyboardKey keys={['$']} />
              <span>or</span>
              <KeyboardKey keys={['/math']} />
              <span>to insert inline math block.</span>
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Type <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--hover-bg)' }}>$</code> or {' '}
            <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--hover-bg)' }}>/math</code> anywhere in your text to start typing math.{' '}
            Your equations will render beautifully inline with your content.
          </p>
          <div 
            className="p-4 rounded-lg border mt-4"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
            }}
          >
            <InteractiveEditorDemo />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'math-block',
    title: 'Math Blocks',
    description: 'Create full math expressions with shortcuts',
    content: (
      <div className="space-y-6">
        {/* Video/Image Container */}
        <div 
          className="w-full rounded-lg border overflow-hidden"
          style={{ 
            background: 'var(--hover-bg)', 
            borderColor: 'var(--border-color)',
            aspectRatio: '16/9',
            minHeight: '200px',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-4xl mb-2" style={{ color: 'var(--foreground-muted)' }}>
                🎥
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Video or image placeholder
              </p>
            </div>
          </div>
        </div>

        {/* Description and Keyboard Shortcut */}
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Use <code className="px-2 py-1 rounded text-xs border mx-1" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>⌘ + M</code> for math blocks
            </h3>
            <KeyboardKey keys={['⌘', 'M']} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Create dedicated math blocks for complex equations. Perfect for integrals, 
            summations, and multi-line mathematical expressions.
          </p>
          <div 
            className="p-5 rounded-lg border mt-4"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="text-center">
              <MathLiveDisplay value="\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'search-menu',
    title: 'Search Menu',
    description: 'Quick access to blocks and commands',
    content: (
      <div className="space-y-6">
        {/* Video/Image Container */}
        <div 
          className="w-full rounded-lg border overflow-hidden"
          style={{ 
            background: 'var(--hover-bg)', 
            borderColor: 'var(--border-color)',
            aspectRatio: '16/9',
            minHeight: '200px',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-4xl mb-2" style={{ color: 'var(--foreground-muted)' }}>
                🎥
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Video or image placeholder
              </p>
            </div>
          </div>
        </div>

        {/* Description and Keyboard Shortcut */}
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Press <code className="px-2 py-1 rounded text-xs border mx-1" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>/</code> to search
            </h3>
            <KeyboardKey keys={['/']} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Open the command menu instantly to search for blocks, insert content, 
            or access actions. Type to filter and find what you need quickly.
          </p>
          <div 
            className="p-4 rounded-lg border mt-4"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--foreground-muted)' }}>/</span>
              <span style={{ color: 'var(--foreground)' }}>Search for blocks, commands, and more...</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'math-suggestions',
    title: 'Math Suggestions',
    description: 'Discover math symbols and functions',
    content: (
      <div className="space-y-6">
        {/* Video/Image Container */}
        <div 
          className="w-full rounded-lg border overflow-hidden"
          style={{ 
            background: 'var(--hover-bg)', 
            borderColor: 'var(--border-color)',
            aspectRatio: '16/9',
            minHeight: '200px',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-4xl mb-2" style={{ color: 'var(--foreground-muted)' }}>
                🎥
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Video or image placeholder
              </p>
            </div>
          </div>
        </div>

        {/* Description and Keyboard Shortcut */}
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              Type <code className="px-2 py-1 rounded text-xs border mx-1" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>\</code> for suggestions
            </h3>
            <KeyboardKey keys={['\\']} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            When typing math, use backslash to see a menu of available symbols, 
            functions, and operators. Browse Greek letters, integrals, sums, and more.
          </p>
          <div 
            className="p-4 rounded-lg border mt-4"
            style={{ 
              background: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--foreground-muted)' }}>\</span>
              <span style={{ color: 'var(--foreground)' }}>alpha, beta, gamma, integral, sum...</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleting(true);
      try {
        if (user?.id) {
          await completeOnboarding(user.id);
        } else {
          onboardingCache.setCompleted(true);
        }
        onClose();
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      if (user?.id) {
        await completeOnboarding(user.id);
      } else {
        onboardingCache.setCompleted(true);
      }
      onClose();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isOpen) return null;

  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border shadow-lg"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h2 className="text-lg font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
                  {currentStepData.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  {currentStepData.description}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:bg-[var(--hover-bg)]"
                style={{ color: 'var(--foreground-muted)' }}
                disabled={isCompleting}
              >
                Skip
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: index <= currentStep ? 'var(--foreground)' : 'var(--hover-bg)',
                      opacity: index <= currentStep ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStepData.content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={handleBack}
                disabled={currentStep === 0 || isCompleting}
                className="px-6 py-2.5 text-sm rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  color: currentStep === 0 ? 'var(--foreground-muted)' : 'var(--foreground)',
                  background: currentStep === 0 ? 'transparent' : 'var(--hover-bg)',
                  border: currentStep === 0 ? 'none' : '1px solid var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  if (currentStep > 0 && !isCompleting) {
                    e.currentTarget.style.background = 'var(--hover-bg)';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentStep > 0) {
                    e.currentTarget.style.background = currentStep === 0 ? 'transparent' : 'var(--hover-bg)';
                  }
                }}
              >
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={isCompleting}
                className="px-8 py-2.5 text-sm rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                }}
                onMouseEnter={(e) => {
                  if (!isCompleting) {
                    e.currentTarget.style.opacity = '0.95';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCompleting) {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!isCompleting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isCompleting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {isCompleting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                    Completing...
                  </span>
                ) : isLastStep ? (
                  'Get Started'
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

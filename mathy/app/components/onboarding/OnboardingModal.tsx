'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { completeOnboarding, OnboardingData } from '@/app/lib/api/onboarding';
import { useAuth } from '@/app/contexts/AuthContext';
import { onboardingCache } from '@/app/lib/cache/onboardingCache';
import KeyboardKey from './KeyboardKey';
import posthog from 'posthog-js';

// --- Types & Constants ---

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface University {
  name: string;
  domain: string;
  country: string;
}

type OnboardingStep =
  | {
    id: string;
    title: string;
    description: string;
    type: 'user-info';
    fieldType: 'role' | 'field' | 'university';
  }
  | {
    id: string;
    title: string;
    description: string;
    type: 'feature';
    videoSrc: string;
    shortcutContent: React.ReactNode;
    caption: string;
  };

const STEPS: OnboardingStep[] = [
  {
    id: 'role',
    title: 'Welcome to Clarity',
    description: 'Help us tailor your experience.',
    type: 'user-info',
    fieldType: 'role',
  },
  {
    id: 'field',
    title: 'Field of Study',
    description: 'What will you use Clarity for?',
    type: 'user-info',
    fieldType: 'field',
  },
  {
    id: 'university',
    title: 'Your University',
    description: 'Where are you studying?',
    type: 'user-info',
    fieldType: 'university',
  },
  {
    id: 'inline-math',
    title: 'Math Features',
    description: 'Beautiful inline equations.',
    type: 'feature',
    videoSrc: '/onboarding/second_onboarding1.mp4',
    shortcutContent: (
      <div className="flex items-center gap-2 flex-wrap justify-center font-medium">
        <span>Type</span>
        <KeyboardKey keys={['$']} />
        <span>or</span>
        <KeyboardKey keys={['/math']} />
      </div>
    ),
    caption: 'Start typing math anywhere. Your equations will render beautifully inline.',
  },
  {
    id: 'search-menu',
    title: 'Command Menu',
    description: 'Power at your fingertips.',
    type: 'feature',
    videoSrc: '/onboarding/slash_onboarding1.mp4',
    shortcutContent: (
      <div className="flex items-center gap-2 font-medium">
        <span>Press</span>
        <KeyboardKey keys={['/']} />
        <span>for menu</span>
      </div>
    ),
    caption: 'Open the command menu instantly to search for blocks, insert content, or access actions.',
  },
  {
    id: 'math-suggestions',
    title: 'Math Suggestions',
    description: 'Symbol search made easy.',
    type: 'feature',
    videoSrc: '/onboarding/search_math_onboarding1.mp4',
    shortcutContent: (
      <div className="flex items-center gap-2 font-medium">
        <span>Use</span>
        <KeyboardKey keys={['\\']} />
        <span>to search symbols</span>
      </div>
    ),
    caption: 'Browse Greek letters, integrals, and more using natural language search.',
  },
];

// --- Sub-components ---

const StepIndicator = ({ current, total }: { current: number; total: number }) => {
  return (
    <div className="flex justify-center gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            // Using scale instead of width for less layout shift feeling
            scale: i === current ? 1.2 : 1,
            backgroundColor: i === current ? 'var(--foreground)' : 'var(--border-color)',
            opacity: i === current ? 1 : 0.4,
          }}
          className="h-1.5 w-1.5 rounded-full" // Dot style
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
};

// --- Main Component ---

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  // User info state
  const [role, setRole] = useState<'student' | 'researcher' | 'professional' | 'other'>('student');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [university, setUniversity] = useState('');
  const [universityDomain, setUniversityDomain] = useState('');

  // University search
  const [universitySearch, setUniversitySearch] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);

  // Filter steps based on role
  const activeSteps = React.useMemo(() => {
    return role === 'student'
      ? STEPS
      : STEPS.filter(s => s.id !== 'university');
  }, [role]);

  const currentStepData = activeSteps[currentStep];

  // Preload videos
  useEffect(() => {
    if (isOpen) {
      STEPS.forEach(step => {
        if (step.type === 'feature' && step.videoSrc) {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = step.videoSrc;
          video.load();
        }
      });
    }
  }, [isOpen]);

  // Fetch universities
  useEffect(() => {
    if (universitySearch.length < 2 || role !== 'student') {
      setUniversities([]);
      return;
    }

    const fetchUniversities = async () => {
      setLoadingUniversities(true);
      try {
        const response = await fetch(
          `http://universities.hipolabs.com/search?name=${encodeURIComponent(universitySearch)}`
        );
        const data = await response.json();
        setUniversities(data.slice(0, 10));
      } catch (error) {
        console.error('Error fetching universities:', error);
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
      }
    };

    const timer = setTimeout(fetchUniversities, 300);
    return () => clearTimeout(timer);
  }, [universitySearch, role]);

  const handleSelectUniversity = (uni: University) => {
    setUniversity(uni.name);
    setUniversityDomain(uni.domain);
    setUniversitySearch(uni.name);
    setShowUniversityDropdown(false);
  };

  const canProceed = () => {
    if (currentStepData.type === 'feature') return true;
    if (currentStepData.fieldType === 'role') return true;
    if (currentStepData.fieldType === 'field') return fieldOfStudy.trim().length > 0;
    if (currentStepData.fieldType === 'university') return university.trim().length > 0;
    return true;
  };

  const saveUserInfo = async () => {
    const onboardingData: OnboardingData = {
      role,
      field_of_study: fieldOfStudy,
      ...(role === 'student' && university && {
        university,
        university_domain: universityDomain
      }),
    };

    posthog.capture('onboarding_user_info_collected', onboardingData);

    if (user?.id) {
      try {
        const supabase = (await import('@/app/lib/supabase/client')).createClient();
        await supabase
          .from('profiles')
          .update({
            role: onboardingData.role,
            field_of_study: onboardingData.field_of_study,
            university: onboardingData.university,
            university_domain: onboardingData.university_domain,
          })
          .eq('id', user.id);
      } catch (e) {
        console.error("Error saving profile", e);
      }
    }
  };

  const handleNext = async () => {
    // Check if we need to save user info
    const isLastUserInfoStep = currentStepData.type === 'user-info' &&
      (currentStep === activeSteps.length - 1 || activeSteps[currentStep + 1].type === 'feature');

    if (isLastUserInfoStep) {
      await saveUserInfo();
    }

    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete
      setIsCompleting(true);
      try {
        posthog.capture('onboarding_completed', { total_steps: activeSteps.length });

        const onboardingData: OnboardingData = {
          role,
          field_of_study: fieldOfStudy,
          ...(role === 'student' && university && { university, university_domain: universityDomain }),
        };

        if (user?.id) {
          await completeOnboarding(user.id, onboardingData);
        } else {
          onboardingCache.setCompleted(true);
        }
        onClose();
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        onClose(); // Close anyway
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const handleSkip = async () => {
    // Save basics if possible
    setIsCompleting(true);
    try {
      await saveUserInfo(); // try to save whatever we have

      posthog.capture('onboarding_skipped', { step: currentStep });

      const onboardingData: OnboardingData = {
        role: role || 'other',
        field_of_study: fieldOfStudy || 'General',
      };

      if (user?.id) {
        await completeOnboarding(user.id, onboardingData);
      } else {
        onboardingCache.setCompleted(true);
      }
      onClose();
    } catch (e) {
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          key="modal-card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[600px] overflow-hidden rounded-2xl border shadow-2xl flex flex-col max-h-[90vh]"
          style={{
            background: 'var(--card-bg)', // Using card-bg for depth
            borderColor: 'var(--border-color)',
            // Inner glow effect
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 48px -12px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Top Actions */}
          <div className="absolute top-6 right-6 z-10">
            <button
              onClick={handleSkip}
              className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-[var(--hover-bg)] transition-colors opacity-60 hover:opacity-100"
              style={{ color: 'var(--foreground)' }}
            >
              Skip
            </button>
          </div>

          <div className="flex-1 flex flex-col p-8 sm:p-10 overflow-y-auto custom-scrollbar">

            <div className="flex-shrink-0">
              <motion.div
                key={currentStepData.title}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-2"
              >
                <h2 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--foreground)' }}>{currentStepData.title}</h2>
                <p className="text-base" style={{ color: 'var(--foreground-muted)' }}>{currentStepData.description}</p>
              </motion.div>

              <div className="mt-8">
                <StepIndicator current={currentStep} total={activeSteps.length} />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="w-full"
                >
                  {/* --- Content Types --- */}

                  {currentStepData.type === 'user-info' && currentStepData.fieldType === 'role' && (
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {[
                        {
                          value: 'student',
                          label: 'Student',
                          icon: (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14.2172 3.49965C12.7962 2.83345 11.2037 2.83345 9.78272 3.49965L3.0916 6.63659C2.0156 7.14105 1.73507 8.56352 2.25 9.54666L2.25 14.5C2.25 14.9142 2.58579 15.25 3 15.25C3.41421 15.25 3.75 14.9142 3.75 14.5V10.672L9.78281 13.5003C11.2038 14.1665 12.7963 14.1665 14.2173 13.5003L20.9084 10.3634C22.3639 9.68105 22.3639 7.31899 20.9084 6.63664L14.2172 3.49965Z" fill="currentColor"/>
                              <path opacity="0.5" d="M5 11.2581L9.78281 13.5003C11.2038 14.1665 12.7963 14.1665 14.2173 13.5003L19 11.2581V16.6252C19 17.6333 18.4965 18.577 17.6147 19.0654C16.1463 19.8786 13.796 20.9998 12 20.9998C10.204 20.9998 7.8537 19.8786 6.38533 19.0654C5.5035 18.577 5 17.6333 5 16.6252V11.2581Z" fill="currentColor"/>
                            </svg>
                          )
                        },
                        {
                          value: 'researcher',
                          label: 'Researcher',
                          icon: (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.18744 15.0485C1.60418 16.6388 1.60418 19.2171 3.18744 20.8074C4.7707 22.3977 7.33768 22.3977 8.92094 20.8074L12.6667 17.0451L10.8946 16.3095C10.1177 15.9751 9.57994 15.2469 9.4866 14.4032C9.36539 13.3075 8.50424 12.4425 7.41335 12.3208H5.90317L3.18744 15.0485Z" fill="currentColor"/>
                              <path fillRule="evenodd" clipRule="evenodd" d="M13.3625 2.23307C13.6756 1.92134 14.1822 1.92246 14.4939 2.23556L21.767 9.54081C22.0787 9.85392 22.0776 10.3605 21.7645 10.6722C21.4513 10.9839 20.9448 10.9828 20.6331 10.6697L13.36 3.36444C13.0483 3.05133 13.0494 2.5448 13.3625 2.23307Z" fill="currentColor"/>
                              <path opacity="0.5" d="M14.0901 4.09766L3.18744 15.0485C1.60419 16.6388 1.60419 19.2171 3.18744 20.8074C4.7707 22.3976 7.33768 22.3976 8.92094 20.8074L19.8236 9.85652L14.0901 4.09766Z" fill="currentColor"/>
                            </svg>
                          )
                        },
                        {
                          value: 'professional',
                          label: 'Professional',
                          icon: (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path opacity="0.5" d="M3.17157 7.92157C2 9.09315 2 10.9788 2 14.75C2 18.5212 2 20.4069 3.17157 21.5784C4.34315 22.75 6.22876 22.75 10 22.75H14C17.7712 22.75 19.6569 22.75 20.8284 21.5784C22 20.4069 22 18.5212 22 14.75C22 10.9788 22 9.09315 20.8284 7.92157C19.6569 6.75 17.7712 6.75 14 6.75H10C6.22876 6.75 4.34315 6.75 3.17157 7.92157Z" fill="currentColor"/>
                              <path d="M16 10.75C16.5523 10.75 17 10.3023 17 9.75C17 9.19772 16.5523 8.75 16 8.75C15.4477 8.75 15 9.19772 15 9.75C15 10.3023 15.4477 10.75 16 10.75Z" fill="currentColor"/>
                              <path d="M9 9.75C9 10.3023 8.55228 10.75 8 10.75C7.44772 10.75 7 10.3023 7 9.75C7 9.19772 7.44772 8.75 8 8.75C8.55228 8.75 9 9.19772 9 9.75Z" fill="currentColor"/>
                              <path d="M12.052 2H11.948C11.0495 1.99997 10.3003 1.99995 9.70552 2.07991C9.07773 2.16432 8.51093 2.34999 8.05546 2.80546C7.59999 3.26093 7.41432 3.82773 7.32991 4.45552C7.24995 5.0503 7.24997 5.7995 7.25 6.69797L7.25 6.77572C7.70703 6.76076 8.20535 6.75451 8.75 6.75189V6.75C8.75 5.78599 8.7516 5.13843 8.81654 4.6554C8.87858 4.19393 8.9858 3.99644 9.11612 3.86612C9.24644 3.7358 9.44393 3.62858 9.9054 3.56654C10.3884 3.5016 11.036 3.5 12 3.5C12.964 3.5 13.6116 3.5016 14.0946 3.56654C14.5561 3.62858 14.7536 3.7358 14.8839 3.86612C15.0142 3.99644 15.1214 4.19393 15.1835 4.6554C15.2484 5.13843 15.25 5.78599 15.25 6.75V6.75189C15.7947 6.75451 16.293 6.76076 16.75 6.77572V6.69801C16.75 5.79954 16.7501 5.0503 16.6701 4.45552C16.5857 3.82773 16.4 3.26093 15.9445 2.80546C15.4891 2.34999 14.9223 2.16432 14.2945 2.07991C13.6997 1.99995 12.9505 1.99997 12.052 2Z" fill="currentColor"/>
                            </svg>
                          )
                        },
                        {
                          value: 'other',
                          label: 'Other',
                          icon: (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path opacity="0.5" d="M2 6.21053C2 4.22567 2 3.23323 2.65901 2.61662C3.31802 2 4.37868 2 6.5 2C8.62132 2 9.68198 2 10.341 2.61662C11 3.23323 11 4.22567 11 6.21053V17.7895C11 19.7743 11 20.7668 10.341 21.3834C9.68198 22 8.62132 22 6.5 22C4.37868 22 3.31802 22 2.65901 21.3834C2 20.7668 2 19.7743 2 17.7895V6.21053Z" fill="currentColor"/>
                              <path d="M13 15.4C13 13.3258 13 12.2887 13.659 11.6444C14.318 11 15.3787 11 17.5 11C19.6213 11 20.682 11 21.341 11.6444C22 12.2887 22 13.3258 22 15.4V17.6C22 19.6742 22 20.7113 21.341 21.3556C20.682 22 19.6213 22 17.5 22C15.3787 22 14.318 22 13.659 21.3556C13 20.7113 13 19.6742 13 17.6V15.4Z" fill="currentColor"/>
                              <path d="M13 5.5C13 4.4128 13 3.8692 13.1713 3.44041C13.3996 2.86867 13.8376 2.41443 14.389 2.17761C14.8024 2 15.3266 2 16.375 2H18.625C19.6734 2 20.1976 2 20.611 2.17761C21.1624 2.41443 21.6004 2.86867 21.8287 3.44041C22 3.8692 22 4.4128 22 5.5C22 6.5872 22 7.1308 21.8287 7.55959C21.6004 8.13133 21.1624 8.58557 20.611 8.82239C20.1976 9 19.6734 9 18.625 9H16.375C15.3266 9 14.8024 9 14.389 8.82239C13.8376 8.58557 13.3996 8.13133 13.1713 7.55959C13 7.1308 13 6.5872 13 5.5Z" fill="currentColor"/>
                            </svg>
                          )
                        },
                      ].map((opt) => {
                        const isSelected = role === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setRole(opt.value as any)}
                            className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[var(--card-bg)]' : 'hover:scale-[1.02]'}`}
                            style={{
                              backgroundColor: isSelected ? 'var(--foreground)' : 'var(--hover-bg)',
                              borderColor: isSelected ? 'transparent' : 'var(--border-color)',
                              color: isSelected ? 'var(--background)' : 'var(--foreground)',
                              boxShadow: isSelected ? '0 10px 20px -5px rgba(0,0,0,0.2)' : 'none',
                              '--ring-color': 'var(--foreground)',
                            } as any}
                          >
                            <span className="mb-3 opacity-90">{opt.icon}</span>
                            <span className="font-semibold text-sm">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentStepData.type === 'user-info' && currentStepData.fieldType === 'field' && (
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="relative group">
                        <input
                          type="text"
                          value={fieldOfStudy}
                          onChange={(e) => setFieldOfStudy(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                          placeholder="e.g. Computer Science..."
                          autoFocus
                          className="w-full bg-transparent text-xl font-medium border-b-2 py-3 px-1 outline-none transition-all placeholder:opacity-30"
                          style={{
                            color: 'var(--foreground)',
                            borderColor: fieldOfStudy ? 'var(--foreground)' : 'var(--border-color)',
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['Computer Science', 'Physics', 'Mathematics', 'Biology', 'Engineering', 'Economics'].map(f => (
                          <button
                            key={f}
                            onClick={() => setFieldOfStudy(f)}
                            className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-[var(--hover-bg)]"
                            style={{
                              borderColor: fieldOfStudy === f ? 'var(--foreground)' : 'var(--border-color)',
                              color: fieldOfStudy === f ? 'var(--foreground)' : 'var(--foreground-muted)'
                            }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStepData.type === 'user-info' && currentStepData.fieldType === 'university' && (
                    <div className="max-w-md mx-auto relative">
                      <input
                        type="text"
                        value={universitySearch}
                        onChange={(e) => {
                          setUniversitySearch(e.target.value);
                          setShowUniversityDropdown(true);
                        }}
                        onFocus={() => setShowUniversityDropdown(true)}
                        placeholder="Search university..."
                        autoFocus
                        className="w-full text-lg px-5 py-4 rounded-xl border outline-none transition-all focus:ring-2"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--foreground)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        }}
                      />

                      {/* Dropdown */}
                      <AnimatePresence>
                        {showUniversityDropdown && universitySearch.length >= 2 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-xl z-20 max-h-[220px] overflow-y-auto custom-scrollbar"
                            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                          >
                            {loadingUniversities ? (
                              <div className="p-4 text-center text-sm opacity-60" style={{ color: 'var(--foreground)' }}>Searching...</div>
                            ) : universities.length > 0 ? (
                              universities.map((uni, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSelectUniversity(uni)}
                                  className="w-full text-left px-5 py-3 hover:bg-[var(--hover-bg)] transition-colors border-b last:border-0 border-[var(--border-color)]"
                                >
                                  <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{uni.name}</div>
                                  <div className="text-xs opacity-60" style={{ color: 'var(--foreground-muted)' }}>{uni.country}</div>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm opacity-60" style={{ color: 'var(--foreground)' }}>No results found</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {currentStepData.type === 'feature' && (
                    <div className="flex flex-col items-center gap-6">
                      {/* Browser Window Style Container */}
                      <div
                        className="w-full rounded-lg overflow-hidden shadow-2xl border relative group"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: '#000' }}
                      >
                        {/* Window Controls */}
                        <div className="h-6 flex items-center gap-1.5 px-3 absolute top-0 left-0 z-10 w-full bg-gradient-to-b from-white/10 to-transparent">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                        </div>

                        <video
                          src={currentStepData.videoSrc}
                          className="w-full aspect-[16/9] object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          style={{ display: 'block' }}
                        />
                      </div>

                      <div className="text-center space-y-3 max-w-md">
                        <div className="bg-[var(--hover-bg)] inline-block px-4 py-2 rounded-lg border border-[var(--border-color)]">
                          {currentStepData.shortcutContent}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                          {currentStepData.caption}
                        </p>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* Bottom Navigation */}
          <div className="p-6 sm:p-8 pt-2 flex items-center justify-between border-t border-transparent">
            <button
              onClick={() => setCurrentStep(c => c - 1)}
              disabled={currentStep === 0 || isCompleting}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-[var(--hover-bg)]'}`}
              style={{ color: 'var(--foreground-muted)' }}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || isCompleting}
              className="group relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
                boxShadow: canProceed() ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <div className="relative z-10 flex items-center gap-2">
                {isCompleting && <div className="w-3 h-3 rounded-full border-2 border-[var(--background)] border-t-transparent animate-spin" />}
                {currentStep === activeSteps.length - 1 ? "Get Started" : "Continue"}
              </div>
              {canProceed() && !isCompleting && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              )}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

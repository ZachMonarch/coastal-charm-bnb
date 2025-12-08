import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional: boolean;
}

export const useWelcomeFlow = () => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(false);

  const welcomeSteps: WelcomeStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your personal information and preferences',
      completed: false,
      optional: false
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Choose your notification and display settings',
      completed: false,
      optional: true
    },
    {
      id: 'tour',
      title: 'Take a Quick Tour',
      description: 'Learn about the key features and how to use them',
      completed: false,
      optional: true
    },
    {
      id: 'complete',
      title: 'Welcome Complete!',
      description: 'You\'re all set up and ready to go',
      completed: false,
      optional: false
    }
  ];

  const [steps, setSteps] = useState(welcomeSteps);

  useEffect(() => {
    if (user) {
      // Check if user is new (created in last 24 hours) and hasn't completed welcome
      const isNewUser = user.created_at && 
        new Date(user.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const hasBasicProfile = user.full_name && user.phone;
      
      if (isNewUser && !hasBasicProfile && !hasCompletedWelcome) {
        setIsVisible(true);
      }
    }
  }, [user, hasCompletedWelcome]);

  const completeStep = async (stepId: string, data?: any) => {
    try {
      setSteps(prev => prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      ));

      // Handle step-specific actions
      switch (stepId) {
        case 'profile':
          if (data && user) {
            await updateUser(data);
            toast.success('Profile updated successfully!');
          }
          break;
        case 'preferences':
          // Save preferences (could be expanded)
          toast.success('Preferences saved!');
          break;
        case 'tour':
          toast.success('Tour completed!');
          break;
        case 'complete':
          setHasCompletedWelcome(true);
          setIsVisible(false);
          toast.success('Welcome setup complete!');
          break;
      }

      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to complete step');
      console.error('Welcome flow error:', error);
    }
  };

  const skipStep = () => {
    const currentStepData = steps[currentStep];
    if (currentStepData?.optional) {
      setSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, completed: true } : step
      ));
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
      toast.info('Step skipped');
    }
  };

  const skipWelcomeFlow = () => {
    setHasCompletedWelcome(true);
    setIsVisible(false);
    toast.info('Welcome flow skipped');
  };

  const restartWelcomeFlow = () => {
    setCurrentStep(0);
    setSteps(welcomeSteps);
    setHasCompletedWelcome(false);
    setIsVisible(true);
  };

  const getCurrentStep = () => steps[currentStep];
  const getProgress = () => Math.round(((currentStep + 1) / steps.length) * 100);
  const isLastStep = () => currentStep === steps.length - 1;
  const canSkipCurrent = () => getCurrentStep()?.optional;

  return {
    isVisible,
    currentStep: getCurrentStep(),
    currentStepIndex: currentStep,
    steps,
    progress: getProgress(),
    isLastStep: isLastStep(),
    canSkipCurrent: canSkipCurrent(),
    completeStep,
    skipStep,
    skipWelcomeFlow,
    restartWelcomeFlow,
    hasCompletedWelcome
  };
};
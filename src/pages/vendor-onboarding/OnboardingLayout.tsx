import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, SkipForward } from 'lucide-react';

interface OnboardingLayoutProps {
  children: ReactNode;
}

const STEPS = [
  { path: '/vendor-onboarding/profile', label: 'Profile' },
  { path: '/vendor-onboarding/company', label: 'Company' },
  { path: '/vendor-onboarding/capabilities', label: 'Capabilities' },
  { path: '/vendor-onboarding/compliance', label: 'Compliance' },
  { path: '/vendor-onboarding/review', label: 'Review' },
  { path: '/vendor-onboarding/complete', label: 'Complete' },
];

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [canSkip, setCanSkip] = useState(false);
  
  const currentStepIndex = STEPS.findIndex(step => step.path === location.pathname);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const isComplete = location.pathname === '/vendor-onboarding/complete';
  
  // Phase 5.2: Progress persistence
  useEffect(() => {
    const savedProgress = localStorage.getItem('vendor_onboarding_progress');
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress);
      setCanSkip(progressData.completedSteps?.includes(currentStepIndex));
    }
  }, [currentStepIndex]);
  
  const handleBack = () => {
    if (currentStepIndex > 0) {
      navigate(STEPS[currentStepIndex - 1].path);
    }
  };
  
  const handleSkip = () => {
    if (currentStepIndex < STEPS.length - 1) {
      navigate(STEPS[currentStepIndex + 1].path);
    }
  };
  
  const handleSaveProgress = () => {
    const progressData = {
      currentStep: currentStepIndex,
      completedSteps: [currentStepIndex],
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('vendor_onboarding_progress', JSON.stringify(progressData));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {!isComplete && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {canSkip && currentStepIndex < STEPS.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="gap-2"
                >
                  Skip
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleSaveProgress();
                  navigate('/vendor/dashboard');
                }}
              >
                Save & Exit
              </Button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-foreground">Vendor Onboarding</h1>
            <p className="text-slate-600 dark:text-muted-foreground">
              {isComplete ? 'Application Complete!' : `Step ${currentStepIndex + 1} of ${STEPS.length}`}
            </p>
          </div>

          {!isComplete && (
            <>
              <Progress value={progress} className="mb-4" />
              <div className="flex justify-between text-xs text-slate-500 dark:text-muted-foreground">
                {STEPS.slice(0, -1).map((step, index) => (
                  <span
                    key={step.path}
                    className={index <= currentStepIndex ? 'text-primary font-semibold' : ''}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RFQStepNavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  currentLabel: string;
  currentStep: number;
  isSaving: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  totalSteps: number;
}

export default function RFQStepNavigation({
  canGoBack,
  canGoForward,
  currentLabel,
  currentStep,
  isSaving,
  onNext,
  onPrevious,
  onSave,
  totalSteps,
}: RFQStepNavigationProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-sm text-muted-foreground">{currentLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onPrevious} disabled={!canGoBack || isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={onNext} disabled={!canGoForward || isSaving}>
            Save &amp; Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
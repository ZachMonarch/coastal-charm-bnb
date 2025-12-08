import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, Crown, Wrench, FileCheck, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Link } from 'react-router-dom';

export default function VendorOnboardingFlow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const onboardingSteps = [
    {
      id: 1,
      title: 'Welcome to Vendor Portal',
      description: 'Get started with your vendor account',
      completed: true,
      action: 'completed'
    },
    {
      id: 2,
      title: 'Choose Your Plan',
      description: 'Select a subscription plan to start applying for projects',
      completed: !!user?.subscription?.plan && user.subscription.plan !== 'free',
      action: 'subscription',
      link: '/vendor/subscription'
    },
    {
      id: 3,
      title: 'Complete Your Profile',
      description: 'Add your specialties, certifications, and contact information',
      completed: false, // This would be based on actual profile completion
      action: 'profile',
      link: '/vendor/dashboard?tab=profile'
    },
    {
      id: 4,
      title: 'Payment Setup',
      description: 'Complete required vendor fees and certifications',
      completed: false, // This would be based on payment status
      action: 'payments',
      link: '/vendor/payments'
    },
    {
      id: 5,
      title: 'Start Applying',
      description: 'Browse available projects and submit your first application',
      completed: false,
      action: 'apply',
      link: '/vendor/dashboard?tab=projects'
    }
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / onboardingSteps.length) * 100;

  const getStepIcon = (step: any) => {
    if (step.completed) return <CheckCircle className="h-6 w-6 text-success" />;
    
    switch (step.action) {
      case 'subscription': return <Crown className="h-6 w-6 text-primary" />;
      case 'profile': return <Wrench className="h-6 w-6 text-info" />;
      case 'payments': return <CreditCard className="h-6 w-6 text-warning" />;
      case 'apply': return <FileCheck className="h-6 w-6 text-primary" />;
      default: return <CheckCircle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const nextIncompleteStep = onboardingSteps.find(step => !step.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wrench className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome to Vendor Portal</h1>
              <p className="text-muted-foreground">Let's get your account set up in a few easy steps</p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Onboarding Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {completedSteps}/{onboardingSteps.length}
              </div>
              <p className="text-muted-foreground">Steps Completed</p>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-center text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Steps */}
        <div className="grid gap-6">
          {onboardingSteps.map((step, index) => (
            <Card 
              key={step.id} 
              className={`transition-all duration-200 ${
                step.completed 
                  ? 'bg-success/10 border-success/30 dark:bg-success/20 dark:border-success/40' 
                  : step.id === nextIncompleteStep?.id
                    ? 'border-primary shadow-lg'
                    : 'border-muted'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      step.completed 
                        ? 'bg-success/20 dark:bg-success/30' 
                        : step.id === nextIncompleteStep?.id
                          ? 'bg-primary/10'
                          : 'bg-muted'
                    }`}>
                      {getStepIcon(step)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        {step.completed && (
                          <Badge className="bg-success text-success-foreground">Completed</Badge>
                        )}
                        {step.id === nextIncompleteStep?.id && (
                          <Badge className="bg-primary text-primary-foreground">Next Step</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {step.completed ? (
                      <Badge variant="outline" className="text-success border-success">
                        Complete
                      </Badge>
                    ) : step.link ? (
                      <Button asChild variant={step.id === nextIncompleteStep?.id ? 'default' : 'outline'}>
                        <Link to={step.link}>
                          {step.id === nextIncompleteStep?.id ? 'Continue' : 'Start'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Jump to any section to complete your setup
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto flex-col p-4">
              <Link to="/vendor/subscription">
                <Crown className="h-6 w-6 mb-2" />
                <span className="text-sm">Choose Plan</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto flex-col p-4">
              <Link to="/vendor/dashboard">
                <Wrench className="h-6 w-6 mb-2" />
                <span className="text-sm">Complete Profile</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto flex-col p-4">
              <Link to="/vendor/payments">
                <CreditCard className="h-6 w-6 mb-2" />
                <span className="text-sm">Payment Setup</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto flex-col p-4">
              <Link to="/vendor/application">
                <FileCheck className="h-6 w-6 mb-2" />
                <span className="text-sm">Submit Application</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Continue Button */}
        {nextIncompleteStep && (
          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link to={nextIncompleteStep.link || '#'}>
                Continue Setup
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
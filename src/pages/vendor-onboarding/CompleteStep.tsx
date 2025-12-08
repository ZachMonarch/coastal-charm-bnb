import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, FileText } from 'lucide-react';

export default function CompleteStep() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-success">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription>
            Thank you for completing your vendor onboarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 rounded-lg bg-muted">
            <h3 className="font-semibold">What happens next?</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                  1
                </span>
                <span>Our team will review your application and documentation</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                  2
                </span>
                <span>We'll verify your insurance and conduct background checks</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                  3
                </span>
                <span>You'll receive an email notification once approved (typically 1-3 business days)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                  4
                </span>
                <span>Once verified, you can start bidding on projects!</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">While you wait...</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Upload additional certifications or licenses to strengthen your profile</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Browse available RFQs to understand the types of projects available</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={() => navigate('/vendor')}
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/vendor/rfq')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Browse RFQs
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4">
            Need help? Contact our support team at support@monarchproperty.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

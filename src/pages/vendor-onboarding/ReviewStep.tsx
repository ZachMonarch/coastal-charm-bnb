import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Edit, User, Building2, Wrench, FileCheck } from 'lucide-react';

export default function ReviewStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [capabilitiesData, setCapabilitiesData] = useState<string[]>([]);
  const [complianceData, setComplianceData] = useState<any>(null);

  useEffect(() => {
    // Load all saved data from localStorage
    const profile = localStorage.getItem('onboarding_profile');
    const company = localStorage.getItem('onboarding_company');
    const capabilities = localStorage.getItem('onboarding_capabilities');
    const compliance = localStorage.getItem('onboarding_compliance');

    if (profile) setProfileData(JSON.parse(profile));
    if (company) setCompanyData(JSON.parse(company));
    if (capabilities) setCapabilitiesData(JSON.parse(capabilities));
    if (compliance) setComplianceData(JSON.parse(compliance));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Submit for verification (verification_status is boolean)
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          is_verified: false, // Will be set to true when admin approves
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem('onboarding_profile');
      localStorage.removeItem('onboarding_company');
      localStorage.removeItem('onboarding_capabilities');
      localStorage.removeItem('onboarding_compliance');

      toast.success('Application submitted for review!');
      navigate('/vendor-onboarding/complete');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-foreground">Review Your Information</CardTitle>
          <CardDescription className="text-slate-600 dark:text-muted-foreground">Please review before submitting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500 dark:text-muted-foreground" />
                <h3 className="font-semibold text-slate-900 dark:text-foreground">Personal Information</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor-onboarding/profile')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            {profileData && (
              <div className="pl-6 space-y-1 text-sm text-slate-700 dark:text-foreground">
                <p><strong>Name:</strong> {profileData.full_name}</p>
                <p><strong>Email:</strong> {profileData.email}</p>
                <p><strong>Phone:</strong> {profileData.phone}</p>
              </div>
            )}
          </div>

          {/* Company Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500 dark:text-muted-foreground" />
                <h3 className="font-semibold text-slate-900 dark:text-foreground">Company Information</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor-onboarding/company')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            {companyData && (
              <div className="pl-6 space-y-1 text-sm text-slate-700 dark:text-foreground">
                <p><strong>Company:</strong> {companyData.company_name}</p>
                <p><strong>Address:</strong> {companyData.address}</p>
                <p><strong>Phone:</strong> {companyData.phone}</p>
              </div>
            )}
          </div>

          {/* Capabilities Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-slate-500 dark:text-muted-foreground" />
                <h3 className="font-semibold text-slate-900 dark:text-foreground">Service Capabilities</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor-onboarding/capabilities')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="pl-6 flex flex-wrap gap-2">
              {capabilitiesData.map((service) => (
                <Badge key={service} variant="secondary">
                  {service.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Compliance Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-slate-500 dark:text-muted-foreground" />
                <h3 className="font-semibold text-slate-900 dark:text-foreground">Compliance & Certifications</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor-onboarding/compliance')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            {complianceData && (
              <div className="pl-6 space-y-1 text-sm text-slate-700 dark:text-foreground">
                <p><strong>Insurance:</strong> {complianceData.insurance_provider}</p>
                <p><strong>Policy:</strong> {complianceData.insurance_policy_number}</p>
                <div className="flex gap-4 mt-2">
                  {complianceData.has_workers_comp && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Workers' Comp
                    </Badge>
                  )}
                  {complianceData.background_check_completed && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Background Check
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/vendor-onboarding/compliance')}
        >
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for Review
        </Button>
      </div>
    </div>
  );
}

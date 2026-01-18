import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileCheck, Upload } from 'lucide-react';

export default function ComplianceStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    license_number: '',
    license_state: '',
    has_workers_comp: false,
    background_check_completed: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('onboarding_compliance');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          insurance_verified: !!formData.insurance_provider,
          background_check_verified: formData.background_check_completed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      localStorage.setItem('onboarding_compliance', JSON.stringify(formData));
      toast.success('Compliance information saved');
      navigate('/vendor-onboarding/review');
    } catch (error) {
      console.error('Error saving compliance:', error);
      toast.error('Failed to save compliance information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-primary/10">
              <FileCheck className="h-5 w-5 text-amber-700 dark:text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Compliance & Certifications</CardTitle>
              <CardDescription className="text-muted-foreground">Provide required documentation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Insurance Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="insurance_provider">Insurance Provider *</Label>
                <Input
                  id="insurance_provider"
                  value={formData.insurance_provider}
                  onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  placeholder="ABC Insurance Co."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_policy_number">Policy Number *</Label>
                  <Input
                    id="insurance_policy_number"
                    value={formData.insurance_policy_number}
                    onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                    placeholder="POL-123456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry">Expiry Date *</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Licensing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="LIC-123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_state">State/Province</Label>
                  <Input
                    id="license_state"
                    value={formData.license_state}
                    onChange={(e) => setFormData({ ...formData, license_state: e.target.value })}
                    placeholder="CA"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Additional Requirements</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_workers_comp"
                  checked={formData.has_workers_comp}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, has_workers_comp: checked as boolean })
                  }
                />
                <label
                  htmlFor="has_workers_comp"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                >
                  I have Workers' Compensation Insurance
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="background_check_completed"
                  checked={formData.background_check_completed}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, background_check_completed: checked as boolean })
                  }
                />
                <label
                  htmlFor="background_check_completed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                >
                  I consent to a background check
                </label>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-info/5 border border-info/20">
              <p className="text-sm text-info">
                <Upload className="inline h-4 w-4 mr-1" />
                Documents will be uploaded in the next step
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vendor-onboarding/capabilities')}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading} style={{ color: 'white' }}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

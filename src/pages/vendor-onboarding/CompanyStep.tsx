import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

export default function CompanyStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    phone: '',
    tax_id: '',
    years_experience: '',
    description: '',
  });

  useEffect(() => {
    const loadSavedData = async () => {
      const saved = localStorage.getItem('onboarding_company');
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        // Load existing vendor profile data
        const { data } = await supabase
          .from('vendor_profiles')
          .select('company_name, address, phone')
          .eq('user_id', user?.id)
          .single();
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            company_name: data.company_name || '',
            address: data.address || '',
            phone: data.phone || '',
          }));
        }
      }
    };
    loadSavedData();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .upsert({
          user_id: user?.id,
          company_name: formData.company_name,
          address: formData.address,
          phone: formData.phone,
          description: formData.description,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      localStorage.setItem('onboarding_company', JSON.stringify(formData));
      toast.success('Company information saved');
      navigate('/vendor-onboarding/capabilities');
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Failed to save company information');
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
              <Building2 className="h-5 w-5 text-amber-700 dark:text-primary" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-foreground">Company Information</CardTitle>
              <CardDescription className="text-slate-600 dark:text-muted-foreground">Tell us about your business</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="ABC Services Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 987-6543"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID (Optional)</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_experience">Years in Business</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your company and services..."
                rows={4}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vendor-onboarding/profile')}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading}>
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

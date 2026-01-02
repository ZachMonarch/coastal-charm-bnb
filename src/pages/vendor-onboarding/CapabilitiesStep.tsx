import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Wrench } from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'carpentry', label: 'Carpentry' },
  { id: 'painting', label: 'Painting' },
  { id: 'landscaping', label: 'Landscaping' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'appliance_repair', label: 'Appliance Repair' },
  { id: 'general_maintenance', label: 'General Maintenance' },
  { id: 'cleaning', label: 'Cleaning Services' },
  { id: 'pest_control', label: 'Pest Control' },
];

export default function CapabilitiesStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    const loadSavedData = async () => {
      const saved = localStorage.getItem('onboarding_capabilities');
      if (saved) {
        setSelectedServices(JSON.parse(saved));
      } else {
        // Load existing specialties from vendor profile
        const { data } = await supabase
          .from('vendor_profiles')
          .select('specialties')
          .eq('user_id', user?.id)
          .single();
        
        if (data?.specialties) {
          setSelectedServices(data.specialties);
        }
      }
    };
    loadSavedData();
  }, [user?.id]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service category');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          specialties: selectedServices,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      localStorage.setItem('onboarding_capabilities', JSON.stringify(selectedServices));
      toast.success('Service capabilities saved');
      navigate('/vendor-onboarding/compliance');
    } catch (error) {
      console.error('Error saving capabilities:', error);
      toast.error('Failed to save service capabilities');
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
              <Wrench className="h-5 w-5 text-amber-700 dark:text-primary" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-foreground">Service Capabilities</CardTitle>
              <CardDescription className="text-slate-600 dark:text-muted-foreground">Select the services you provide</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-slate-800 dark:text-foreground">Select all that apply *</Label>
              <div className="grid grid-cols-2 gap-4">
                {SERVICE_CATEGORIES.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <label
                      htmlFor={service.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700 dark:text-foreground"
                    >
                      {service.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Selected: {selectedServices.length}</strong> service{selectedServices.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vendor-onboarding/company')}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading || selectedServices.length === 0} style={{ color: 'white' }}>
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

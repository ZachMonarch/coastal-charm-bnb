import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhase9RFQ } from '@/hooks/usePhase9RFQ';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PropertySelect } from './PropertySelect';
import { LotBuilder } from './LotBuilder';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface Lot {
  title: string;
  description: string;
  quantity: number;
  unit: string;
}

interface FormErrors {
  title?: string;
  property_id?: string;
  deadline?: string;
  lots?: string;
}

export default function RFQCreationForm() {
  const navigate = useNavigate();
  const { createRFQ } = usePhase9RFQ();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_id: '',
    deadline: '',
    lots: [] as Lot[]
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.property_id) {
      newErrors.property_id = 'Please select a property';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }
    
    if (formData.lots.length === 0) {
      newErrors.lots = 'At least one lot is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    setLoading(true);

    try {
      await createRFQ({
        property_id: parseInt(formData.property_id),
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        lots: formData.lots
      });

      toast.success('RFQ created successfully');
      navigate('/admin/rfq');
    } catch (error) {
      console.error('Error creating RFQ:', error);
      toast.error('Failed to create RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New RFQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">RFQ Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                clearError('title');
              }}
              className={errors.title ? 'border-destructive' : ''}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <PropertySelect
              value={formData.property_id}
              onChange={(value) => {
                setFormData({ ...formData, property_id: value });
                clearError('property_id');
              }}
            />
            {errors.property_id && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.property_id}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="deadline">Deadline *</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => {
                setFormData({ ...formData, deadline: e.target.value });
                clearError('deadline');
              }}
              className={errors.deadline ? 'border-destructive' : ''}
              aria-invalid={!!errors.deadline}
            />
            {errors.deadline && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.deadline}
              </p>
            )}
          </div>

          <div>
            <LotBuilder
              lots={formData.lots}
              onChange={(lots) => {
                setFormData({ ...formData, lots });
                clearError('lots');
              }}
            />
            {errors.lots && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.lots}
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create RFQ'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

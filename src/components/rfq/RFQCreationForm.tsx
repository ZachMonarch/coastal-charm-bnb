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

interface Lot {
  title: string;
  description: string;
  quantity: number;
  unit: string;
}

export default function RFQCreationForm() {
  const navigate = useNavigate();
  const { createRFQ } = usePhase9RFQ();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_id: '',
    deadline: '',
    lots: [] as Lot[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id || !formData.title || !formData.deadline || formData.lots.length === 0) {
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

      navigate('/admin/rfqs');
    } catch (error) {
      console.error('Error creating RFQ:', error);
    } finally {
      setLoading(false);
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
            <Label htmlFor="title">RFQ Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <PropertySelect
            value={formData.property_id}
            onChange={(value) => setFormData({ ...formData, property_id: value })}
          />

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </div>

          <LotBuilder
            lots={formData.lots}
            onChange={(lots) => setFormData({ ...formData, lots })}
          />

          <Button type="submit" disabled={loading || formData.lots.length === 0} className="w-full">
            {loading ? 'Creating...' : 'Create RFQ'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

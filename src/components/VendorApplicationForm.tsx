import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { DollarSign, Clock, Calendar, MapPin } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  deadline?: string;
}

interface VendorApplicationFormProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorApplicationForm({ project, onClose, onSuccess }: VendorApplicationFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidData, setBidData] = useState({
    bid_amount: '',
    estimated_duration: '',
    proposal_details: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // First, create a vendor application record for tracking
      const { data: application, error: applicationError } = await supabase
        .from('vendor_applications')
        .insert({
          user_id: user.id,
          project_title: project.title,
          project_description: project.description,
          project_type: project.category,
          budget_min: project.budget_min,
          budget_max: project.budget_max,
          location: project.location,
          deadline: project.deadline,
          status: 'open'
        })
        .select('id')
        .single();

      if (applicationError) throw applicationError;

      // Then create vendor bid linked to the application
      const { error: bidError } = await supabase
        .from('vendor_bids')
        .insert({
          vendor_id: user.id,
          application_id: application.id,
          bid_amount: parseFloat(bidData.bid_amount),
          estimated_duration: bidData.estimated_duration,
          proposal_details: bidData.proposal_details,
          status: 'submitted'
        });

      if (bidError) throw bidError;

      toast.success('Application submitted successfully!');
      onSuccess();
    } catch (error) {
      logger.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Apply for Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{project.title}</h3>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {project.budget_min && project.budget_max && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">${project.budget_min} - ${project.budget_max}</span>
                </div>
              )}
              
              {project.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{project.location}</span>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">{project.category}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bid_amount">Your Bid Amount ($)</Label>
                <Input
                  id="bid_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={bidData.bid_amount}
                  onChange={(e) => setBidData(prev => ({ ...prev, bid_amount: e.target.value }))}
                  placeholder="Enter your bid"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimated_duration">Estimated Duration</Label>
                <Input
                  id="estimated_duration"
                  value={bidData.estimated_duration}
                  onChange={(e) => setBidData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                  placeholder="e.g., 3-5 days"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="proposal_details">Proposal Details</Label>
              <Textarea
                id="proposal_details"
                value={bidData.proposal_details}
                onChange={(e) => setBidData(prev => ({ ...prev, proposal_details: e.target.value }))}
                placeholder="Describe your approach, timeline, and why you're the best fit for this project..."
                className="min-h-[120px]"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
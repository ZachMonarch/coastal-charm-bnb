import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, FileText } from "lucide-react";
import { useVendorBids, VendorApplication } from "@/hooks/useVendors";
import { RFQProject, useVendorRFQs } from "@/hooks/useVendorRFQs";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";

interface VendorBidFormProps {
  application?: VendorApplication;
  project?: RFQProject;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function VendorBidForm({ application, project, onClose, onSuccess }: VendorBidFormProps) {
  const { user } = useAuth();
  const { submitBid: submitLegacyBid } = useVendorBids();
  const { submitBid: submitRFQBid } = useVendorRFQs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bid_amount: "",
    proposal_details: "",
    estimated_duration: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const targetId = application?.id || project?.id;
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      if (application) {
        // Legacy application bid submission
        await submitLegacyBid({
          vendor_id: user.id,
          application_id: application.id,
          bid_amount: parseFloat(formData.bid_amount),
          proposal_details: formData.proposal_details,
          estimated_duration: formData.estimated_duration || undefined,
          status: "submitted"
        });
      } else if (project) {
        // New RFQ project bid submission
        await submitRFQBid({
          project_id: project.id,
          bid_amount: parseFloat(formData.bid_amount),
          proposal_details: formData.proposal_details,
          estimated_duration: formData.estimated_duration || undefined
        });
      }

      toast.success("Bid submitted successfully!");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error("Failed to submit bid");
      console.error("Error submitting bid:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {application?.project_title || project?.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{application?.project_description || project?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="ml-2 border-border bg-muted/50 text-foreground">
                {application?.project_type || project?.category}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>
              <Badge 
                variant="outline" 
                className={`ml-2 ${
                  (application?.priority || project?.priority) === 'urgent' ? 'border-destructive/50 bg-destructive/10 text-destructive' :
                  (application?.priority || project?.priority) === 'high' ? 'border-warning/50 bg-warning/10 text-warning-foreground' :
                  (application?.priority || project?.priority) === 'medium' ? 'border-info/50 bg-info/10 text-info' :
                  'border-success/50 bg-success/10 text-success'
                }`}
              >
                {application?.priority || project?.priority}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Budget:</span>
              <span className="ml-2 font-medium text-foreground">
                ${application?.budget_min || project?.budget_min || 0} - ${application?.budget_max || project?.budget_max || 'Open'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <span className="ml-2 font-medium text-foreground">{application?.location || project?.location || 'TBD'}</span>
            </div>
          </div>
          {(application?.deadline || project?.deadline) && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-muted-foreground">Deadline:</span>
              <span className="ml-2 font-medium text-foreground">
                {new Date(application?.deadline || project?.deadline || '').toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid Form */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Submit Your Bid</CardTitle>
          <CardDescription className="text-muted-foreground">
            Provide your quote and proposal details for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bid_amount" className="text-foreground">Bid Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bid_amount"
                    type="number"
                    value={formData.bid_amount}
                    onChange={(e) => updateFormData("bid_amount", e.target.value)}
                    placeholder="0.00"
                    className="pl-9 bg-background border-2 border-input focus:border-primary text-foreground placeholder:text-muted-foreground"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_duration" className="text-foreground">Estimated Duration</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={(e) => updateFormData("estimated_duration", e.target.value)}
                    placeholder="e.g., 2-3 days, 1 week"
                    className="pl-9 bg-background border-2 border-input focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal_details" className="text-foreground">Proposal Details</Label>
              <Textarea
                id="proposal_details"
                value={formData.proposal_details}
                onChange={(e) => updateFormData("proposal_details", e.target.value)}
                placeholder="Describe your approach, materials, timeline, and any additional details..."
                className="min-h-[120px] bg-background border-2 border-input focus:border-primary text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-muted">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? "Submitting..." : "Submit Bid"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
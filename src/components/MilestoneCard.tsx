import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Upload, CheckCircle, Clock, FileText } from "lucide-react";
import { Milestone, Deliverable } from "@/hooks/useContractDetails";
import { format } from "date-fns";

interface MilestoneCardProps {
  milestone: Milestone;
  deliverables: Deliverable[];
  onUploadDeliverable: (milestoneId: string, file: File) => Promise<void>;
  onMarkComplete: (milestoneId: string) => Promise<void>;
  isUploading?: boolean;
}

export function MilestoneCard({ 
  milestone, 
  deliverables, 
  onUploadDeliverable, 
  onMarkComplete,
  isUploading = false 
}: MilestoneCardProps) {
  const milestoneDeliverables = deliverables.filter(d => d.milestone_id === milestone.id);
  const hasDeliverables = milestoneDeliverables.length > 0;
  const isCompleted = milestone.status === 'completed';
  const isOverdue = milestone.status === 'overdue';
  const canComplete = milestone.status === 'in_progress' && hasDeliverables;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadDeliverable(milestone.id, file);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'bg-muted/30' : 'hover:shadow-md'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`text-lg ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>
              {milestone.name}
            </CardTitle>
            {milestone.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {milestone.description}
              </p>
            )}
          </div>
          <Badge variant={getStatusColor(milestone.status)}>
            {milestone.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
              {milestone.due_date ? format(new Date(milestone.due_date), 'MMM dd, yyyy') : 'No deadline'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatCurrency(milestone.amount)}
            </span>
          </div>
        </div>

        {/* Deliverables */}
        {milestoneDeliverables.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Deliverables ({milestoneDeliverables.length})
            </h4>
            <div className="space-y-2">
              {milestoneDeliverables.map((deliverable) => (
                <div 
                  key={deliverable.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{deliverable.file_name}</span>
                    {deliverable.is_approved && (
                      <Badge variant="default" className="text-xs">Approved</Badge>
                    )}
                  </div>
                  {deliverable.file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(deliverable.file_url!, '_blank')}
                    >
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => document.getElementById(`file-upload-${milestone.id}`)?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Deliverable
              </Button>
              <input
                id={`file-upload-${milestone.id}`}
                type="file"
                accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
          
          {canComplete && (
            <Button
              size="sm"
              onClick={() => onMarkComplete(milestone.id)}
              className="ml-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          {isCompleted && milestone.completion_date && (
            <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-success" />
              Completed {format(new Date(milestone.completion_date), 'MMM dd, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
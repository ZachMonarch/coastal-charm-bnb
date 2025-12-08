import { ContractWithMilestones, Deliverable } from "@/hooks/useContractDetails";
import { MilestoneCard } from "./MilestoneCard";
import { ContractProgressBar } from "./ContractProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

interface MilestoneTrackerProps {
  contract: ContractWithMilestones;
  deliverables: Deliverable[];
  onUploadDeliverable: (milestoneId: string, file: File) => Promise<void>;
  onMarkMilestoneComplete: (milestoneId: string) => Promise<void>;
  isUploading?: boolean;
}

export function MilestoneTracker({ 
  contract, 
  deliverables, 
  onUploadDeliverable, 
  onMarkMilestoneComplete,
  isUploading = false 
}: MilestoneTrackerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{contract.title}</CardTitle>
          <p className="text-muted-foreground">{contract.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="font-semibold">{formatCurrency(contract.totalValue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-semibold">{Math.round(contract.progress)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-semibold">
                  {contract.deadline ? format(new Date(contract.deadline), 'MMM dd, yyyy') : 'No deadline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{contract.location || 'Remote'}</p>
              </div>
            </div>
          </div>
          
          <ContractProgressBar
            progress={contract.progress}
            completedMilestones={contract.completedMilestones}
            totalMilestones={contract.milestones.length}
            showText={true}
          />
        </CardContent>
      </Card>

      {/* Next Milestone Alert */}
      {contract.nextMilestone && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{contract.nextMilestone.name}</p>
                <p className="text-sm text-muted-foreground">
                  Due: {contract.nextMilestone.due_date ? format(new Date(contract.nextMilestone.due_date), 'MMM dd, yyyy') : 'No deadline'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(contract.nextMilestone.amount)}</p>
                <p className="text-sm text-muted-foreground">{contract.nextMilestone.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones Timeline */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Project Milestones</h3>
        <div className="space-y-4">
          {contract.milestones
            .sort((a, b) => a.order_index - b.order_index)
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                deliverables={deliverables}
                onUploadDeliverable={onUploadDeliverable}
                onMarkComplete={onMarkMilestoneComplete}
                isUploading={isUploading}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
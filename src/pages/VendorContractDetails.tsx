import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useContractDetails } from "@/hooks/useContractDetails";
import { MilestoneTracker } from "@/components/MilestoneTracker";
import { ContractStatusChip } from "@/components/ContractStatusChip";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";

export default function VendorContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const {
    contract,
    deliverables,
    loading,
    error,
    markMilestoneComplete,
    uploadDeliverable
  } = useContractDetails(id!);

  const handleUploadDeliverable = async (milestoneId: string, file: File) => {
    setIsUploading(true);
    try {
      await uploadDeliverable(milestoneId, file);
      toast({
        title: "Success",
        description: "Deliverable uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload deliverable",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkMilestoneComplete = async (milestoneId: string) => {
    try {
      await markMilestoneComplete(milestoneId);
      toast({
        title: "Success",
        description: "Milestone marked as complete",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark milestone as complete",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/vendor/contracts')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contracts
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            {error || 'Contract not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivatePageWrapper title="Contract Details">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/vendor/contracts')}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contract Details</h1>
            <p className="text-muted-foreground">Manage milestones and deliverables</p>
          </div>
        </div>
        <ContractStatusChip status={contract.status} />
      </div>

      {/* Milestone Tracker */}
      <MilestoneTracker
        contract={contract}
        deliverables={deliverables}
        onUploadDeliverable={handleUploadDeliverable}
        onMarkMilestoneComplete={handleMarkMilestoneComplete}
        isUploading={isUploading}
      />
    </div>
    </PrivatePageWrapper>
  );
}
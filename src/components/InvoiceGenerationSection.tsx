import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react';
import { CompletedMilestone } from '@/hooks/useVendorInvoicing';
import { ButtonSpinner } from '@/components/shared/LoadingSpinner';

interface InvoiceGenerationSectionProps {
  completedMilestones: CompletedMilestone[];
  loading: boolean;
  generating: boolean;
  onGenerateInvoice: (milestone: CompletedMilestone) => void;
}

export default function InvoiceGenerationSection({ 
  completedMilestones, 
  loading, 
  generating,
  onGenerateInvoice 
}: InvoiceGenerationSectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Generate Invoices ({completedMilestones.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {completedMilestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No completed milestones available for invoicing</p>
            <p className="text-sm">Complete project milestones to generate invoices</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              The following completed milestones are ready for invoice generation:
            </p>
            
            {completedMilestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{milestone.name}</h4>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
                      Completed
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    Project: {milestone.project.title}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${Number(milestone.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Completed: {new Date(milestone.completion_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => onGenerateInvoice(milestone)}
                  disabled={generating}
                  className="ml-4"
                >
                  {generating ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Invoice
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
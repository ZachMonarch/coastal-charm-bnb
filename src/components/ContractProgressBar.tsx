import { Progress } from "@/components/ui/progress";

interface ContractProgressBarProps {
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  showText?: boolean;
  className?: string;
}

export function ContractProgressBar({ 
  progress, 
  completedMilestones, 
  totalMilestones, 
  showText = true,
  className 
}: ContractProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {showText && (
          <>
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedMilestones}/{totalMilestones} milestones
            </span>
          </>
        )}
      </div>
      <Progress value={progress} className="h-3" />
      {showText && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span className="font-medium">{Math.round(progress)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
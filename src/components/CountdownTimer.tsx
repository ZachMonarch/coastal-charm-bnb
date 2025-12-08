import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  deadline: string;
  showIcon?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function CountdownTimer({ deadline, showIcon = true, className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  const calculateTimeRemaining = (): TimeRemaining => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false };
  };

  useEffect(() => {
    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const getUrgencyLevel = () => {
    if (timeRemaining.isExpired) return 'expired';
    
    const totalHours = timeRemaining.days * 24 + timeRemaining.hours;
    
    if (totalHours < 24) return 'critical'; // Less than 24 hours
    if (totalHours < 72) return 'warning';  // Less than 3 days
    return 'normal';
  };

  const getUrgencyColor = () => {
    const urgency = getUrgencyLevel();
    
    switch (urgency) {
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      default:
        return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
    }
  };

  const formatTimeDisplay = () => {
    if (timeRemaining.isExpired) {
      return 'Expired';
    }

    const parts = [];
    
    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.hours}h`);
    }
    if (timeRemaining.minutes > 0 || timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.minutes}m`);
    }
    
    // Only show seconds if less than 1 hour remaining
    if (timeRemaining.days === 0 && timeRemaining.hours === 0) {
      parts.push(`${timeRemaining.seconds}s`);
    }

    return parts.join(' ');
  };

  const urgencyLevel = getUrgencyLevel();

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        getUrgencyColor(),
        className
      )}
    >
      {showIcon && (
        urgencyLevel === 'expired' ? (
          <AlertTriangle className="h-3 w-3" />
        ) : (
          <Clock className="h-3 w-3" />
        )
      )}
      <span>{formatTimeDisplay()}</span>
    </Badge>
  );
}
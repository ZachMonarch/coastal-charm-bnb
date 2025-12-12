import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarIcon, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, addMonths, isAfter, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityReview {
  id?: string;
  scheduled_date: string;
  review_type: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  status: 'pending' | 'completed' | 'overdue';
  completed_date?: string;
  notes?: string;
}

export default function SecurityReviewScheduler() {
  const [nextReview, setNextReview] = useState<Date>(new Date('2026-01-15'));
  const [reviews, setReviews] = useState<SecurityReview[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(nextReview);
  const { toast } = useToast();

  useEffect(() => {
    loadScheduledReviews();
  }, []);

  const loadScheduledReviews = async () => {
    // In production, this would load from database
    // For now, we'll create a default schedule
    const defaultReviews: SecurityReview[] = [
      {
        scheduled_date: '2026-01-15',
        review_type: 'monthly',
        status: 'pending',
        notes: 'Comprehensive security review - Q1 2026'
      },
      {
        scheduled_date: '2026-04-15',
        review_type: 'quarterly',
        status: 'pending',
        notes: 'Q2 2026 - Penetration testing scheduled'
      },
      {
        scheduled_date: '2026-07-15',
        review_type: 'quarterly',
        status: 'pending',
        notes: 'Q3 2026 - External audit preparation'
      },
      {
        scheduled_date: '2026-10-15',
        review_type: 'quarterly',
        status: 'pending',
        notes: 'Q4 2026 - Annual security assessment'
      }
    ];
    setReviews(defaultReviews);
  };

  const scheduleReview = async (date: Date, type: SecurityReview['review_type']) => {
    const newReview: SecurityReview = {
      scheduled_date: format(date, 'yyyy-MM-dd'),
      review_type: type,
      status: 'pending',
      notes: `${type.charAt(0).toUpperCase() + type.slice(1)} security review`
    };

    // In production, save to database
    setReviews([...reviews, newReview].sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    ));

    toast({
      title: "Review Scheduled",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} review scheduled for ${format(date, 'PPP')}`,
    });
  };

  const markCompleted = (review: SecurityReview) => {
    const updatedReviews = reviews.map(r => 
      r.scheduled_date === review.scheduled_date 
        ? { ...r, status: 'completed' as const, completed_date: format(new Date(), 'yyyy-MM-dd') }
        : r
    );
    setReviews(updatedReviews);

    toast({
      title: "Review Completed",
      description: "Security review marked as completed",
    });
  };

  const getDaysUntil = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  const getStatusBadge = (review: SecurityReview) => {
    const daysUntil = getDaysUntil(review.scheduled_date);
    
    if (review.status === 'completed') {
      return <Badge variant="default" className="bg-success text-success-foreground">Completed</Badge>;
    }
    if (daysUntil < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (daysUntil <= 7) {
      return <Badge variant="default" className="bg-warning text-black font-semibold">Due Soon</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const getTypeBadge = (type: SecurityReview['review_type']) => {
    const colors = {
      weekly: 'bg-info text-info-foreground',
      monthly: 'bg-primary text-primary-foreground',
      quarterly: 'bg-warning text-warning-foreground font-semibold',
      annual: 'bg-destructive text-destructive-foreground'
    };
    return <Badge className={colors[type]}>{type.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Security Review Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Next Review Alert */}
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Security Review:</strong> {format(nextReview, 'PPPP')}
              <br />
              <span className="text-muted-foreground">
                ({getDaysUntil(nextReview.toISOString())} days remaining)
              </span>
            </AlertDescription>
          </Alert>

          {/* Quick Schedule Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scheduleReview(addMonths(new Date(), 1), 'monthly')}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-xs text-muted-foreground">Schedule</span>
              <span className="font-semibold">Monthly</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scheduleReview(addMonths(new Date(), 3), 'quarterly')}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-xs text-muted-foreground">Schedule</span>
              <span className="font-semibold">Quarterly</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scheduleReview(addMonths(new Date(), 12), 'annual')}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-xs text-muted-foreground">Schedule</span>
              <span className="font-semibold">Annual</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedDate) {
                  scheduleReview(selectedDate, 'monthly');
                }
              }}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-xs text-muted-foreground">Schedule</span>
              <span className="font-semibold">Custom</span>
            </Button>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => isBefore(date, new Date())}
            />
          </div>

          {/* Scheduled Reviews List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Upcoming Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews scheduled</p>
            ) : (
              <div className="space-y-2">
                {reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(review.review_type)}
                        {getStatusBadge(review)}
                      </div>
                      <p className="text-sm font-medium">
                        {format(new Date(review.scheduled_date), 'PPP')}
                      </p>
                      {review.notes && (
                        <p className="text-xs text-muted-foreground">{review.notes}</p>
                      )}
                    </div>
                    {review.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markCompleted(review)}
                        className="ml-4"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Guidelines */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Review Schedule Guidelines
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li><strong>Weekly:</strong> Run automated tests, review critical events (15 min)</li>
              <li><strong>Monthly:</strong> Comprehensive review, compliance reporting (1 hour)</li>
              <li><strong>Quarterly:</strong> Deep audit, penetration testing (4 hours)</li>
              <li><strong>Annual:</strong> Complete assessment, external audit (2 days)</li>
            </ul>
          </div>

          {/* Training Materials Link */}
          <Alert>
            <AlertDescription>
              📚 <strong>New to the Security Dashboard?</strong> Review the{" "}
              <a 
                href="/docs/SECURITY_DASHBOARD_TRAINING_GUIDE.md" 
                className="underline font-semibold"
                target="_blank"
              >
                Training Guide
              </a>
              {" "}for complete documentation and best practices.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

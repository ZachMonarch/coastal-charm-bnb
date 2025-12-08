import { CheckCircle, Circle, Clock } from 'lucide-react';

interface TimelineEvent {
  label: string;
  date?: string;
  completed: boolean;
  current?: boolean;
}

interface RFQTimelineProps {
  events: TimelineEvent[];
}

export function RFQTimeline({ events }: RFQTimelineProps) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            {event.completed ? (
              <CheckCircle className="w-6 h-6 text-primary" />
            ) : event.current ? (
              <Clock className="w-6 h-6 text-primary animate-pulse" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground" />
            )}
            {index < events.length - 1 && (
              <div className={`w-0.5 h-12 ${event.completed ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className={`font-medium ${event.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {event.label}
            </p>
            {event.date && (
              <p className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

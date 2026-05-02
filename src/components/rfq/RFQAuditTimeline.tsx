import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { History } from 'lucide-react';

interface AuditEntry {
  id: string;
  rfq_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_id: string | null;
  created_at: string;
}

export default function RFQAuditTimeline({ rfqId }: { rfqId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rfqId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('rfq_audit_log')
        .select('id,rfq_id,entity_type,entity_id,action,actor_id,created_at')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (active) {
        setEntries((data ?? []) as AuditEntry[]);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [rfqId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No audit history yet.</p>;
  }

  return (
    <ol className="relative border-l border-border pl-6 space-y-4">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted border">
            <History className="h-3 w-3" />
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{e.action}</Badge>
            <span className="text-sm font-medium">{e.entity_type}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(e.created_at), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

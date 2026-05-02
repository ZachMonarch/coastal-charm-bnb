import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, FileCheck, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import RFQAuditTimeline from './RFQAuditTimeline';

interface PropertyRow {
  property_id: number;
  service_types: string[];
  notes: string | null;
  properties?: { title: string | null; city: string | null; state: string | null } | null;
}

interface Props {
  rfqId: string;
  deadline?: string | null;
}

export default function RFQStatusSummary({ rfqId, deadline }: Props) {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [counts, setCounts] = useState({ requests: 0, grants: 0, bids: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rfqId) return;
    let active = true;
    (async () => {
      const [propsRes, reqRes, grantRes, bidsRes] = await Promise.all([
        supabase
          .from('rfq_properties')
          .select('property_id,service_types,notes,properties(title,city,state)')
          .eq('rfq_id', rfqId),
        supabase
          .from('rfq_access_requests')
          .select('id', { count: 'exact', head: true })
          .eq('rfq_id', rfqId)
          .eq('status', 'pending'),
        supabase
          .from('rfq_access_grants')
          .select('id', { count: 'exact', head: true })
          .eq('rfq_id', rfqId)
          .is('revoked_at', null),
        supabase
          .from('rfq_bids')
          .select('id', { count: 'exact', head: true })
          .eq('rfq_id', rfqId),
      ]);
      if (!active) return;
      setProperties((propsRes.data ?? []) as unknown as PropertyRow[]);
      setCounts({
        requests: reqRes.count ?? 0,
        grants: grantRes.count ?? 0,
        bids: bidsRes.count ?? 0,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [rfqId]);

  const daysToDeadline = deadline ? differenceInDays(new Date(deadline), new Date()) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={<Building2 className="h-4 w-4" />} label="Linked properties" value={loading ? '—' : properties.length} />
        <KPI icon={<Users className="h-4 w-4" />} label="Pending requests" value={loading ? '—' : counts.requests} />
        <KPI icon={<FileCheck className="h-4 w-4" />} label="Approved vendors" value={loading ? '—' : counts.grants} />
        <KPI
          icon={<Clock className="h-4 w-4" />}
          label="Days to deadline"
          value={daysToDeadline === null ? '—' : daysToDeadline >= 0 ? daysToDeadline : 'Past due'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked properties & services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No properties linked. Use the Properties &amp; Services tab to add locations.
            </p>
          ) : (
            <ul className="space-y-3">
              {properties.map((p) => (
                <li key={p.property_id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium">{p.properties?.title ?? `Property #${p.property_id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.properties?.city, p.properties?.state].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                      {(p.service_types ?? []).map((s) => (
                        <Badge key={s} variant="secondary" className="capitalize text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  {p.notes && <p className="text-xs text-muted-foreground mt-2">{p.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RFQAuditTimeline rfqId={rfqId} />
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon} {label}
        </div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

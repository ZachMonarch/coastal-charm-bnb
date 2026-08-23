import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Lock } from 'lucide-react';
import { format } from 'date-fns';

interface PublicRFQ {
  id: string;
  title: string;
  status: string;
  deadline: string;
  category: string | null;
  expected_duration: string | null;
  preview: string | null;
  project_address_summary: string | null;
  created_at: string;
}

export default function RFQDiscovery() {
  const [rfqs, setRfqs] = useState<PublicRFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc('get_public_rfqs', { _limit: 60, _offset: 0 });
      if (active && !error && data) setRfqs(data as PublicRFQ[]);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <Helmet>
        <title>Open Projects & RFQs — Monarch Property Management</title>
        <meta
          name="description"
          content="Browse open property management RFQs and project bids. Sign in and request access to view full details and submit bids."
        />
        <link rel="canonical" href="https://monarchpropertymmgt.online/rfq" />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Open Projects</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Browse current Requests for Quotes. Detailed scope, documents, and bidding require an
          approved vendor account.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : rfqs.length === 0 ? (
        <p className="text-muted-foreground">No open projects right now. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rfqs.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="capitalize">
                    {r.status}
                  </Badge>
                  {r.category && <Badge variant="secondary">{r.category}</Badge>}
                </div>
                <CardTitle className="text-lg leading-snug mt-2 line-clamp-2">
                  {r.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 select-none blur-[2px] hover:blur-none transition">
                  {r.preview || 'Sign in and request access to view full project details.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Deadline: {format(new Date(r.deadline), 'MMM dd, yyyy')}
                </div>
                {r.project_address_summary && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {r.project_address_summary.split(',').slice(-2).join(',').trim()}
                  </div>
                )}
                <div className="mt-auto pt-3">
                  <Button asChild className="w-full">
                    <Link to={`/rfq/${r.id}`}>
                      <Lock className="h-3.5 w-3.5 mr-2" /> View & request access
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

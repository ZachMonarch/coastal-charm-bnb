import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useRFQAccess } from '@/hooks/useRFQAccess';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, MapPin, Lock, Clock, CheckCircle2, Hourglass } from 'lucide-react';
import RequestRFQAccessDialog from '@/components/rfq/RequestRFQAccessDialog';
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

export default function PublicRFQView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [rfq, setRfq] = useState<PublicRFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const access = useRFQAccess(id);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const { data } = await supabase.rpc('get_public_rfq', { _id: id });
      if (active) {
        setRfq((data?.[0] ?? null) as PublicRFQ | null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // If user has been granted access and is signed in, route them to the full vendor view
  useEffect(() => {
    if (!access.isLoading && access.hasAccess && isAuthenticated) {
      navigate(`/vendor/rfq/${id}`, { replace: true });
    }
  }, [access.isLoading, access.hasAccess, isAuthenticated, id, navigate]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!rfq) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Project not found</h1>
        <p className="text-muted-foreground mb-6">
          This project may have been closed or is no longer available publicly.
        </p>
        <Button asChild>
          <Link to="/rfq">Browse open projects</Link>
        </Button>
      </main>
    );
  }

  const statusBadge = () => {
    if (access.hasAccess) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
          <CheckCircle2 className="h-4 w-4" /> Access granted
        </span>
      );
    }
    if (access.isPending) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
          <Hourglass className="h-4 w-4" /> Request pending review
        </span>
      );
    }
    return null;
  };

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <Helmet>
        <title>{rfq.title} — Open Project | Monarch Property Management</title>
        <meta name="description" content={rfq.preview ?? 'Open project / RFQ accepting bids.'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://monarchpropertymmgt.online/rfq/${rfq.id}`} />
      </Helmet>

      <Button variant="ghost" onClick={() => navigate('/rfq')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> All projects
      </Button>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Badge variant="outline" className="capitalize">{rfq.status}</Badge>
        {rfq.category && <Badge variant="secondary">{rfq.category}</Badge>}
        {statusBadge()}
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-3">{rfq.title}</h1>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
        <span className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Deadline: <strong className="text-foreground">{format(new Date(rfq.deadline), 'MMM dd, yyyy')}</strong>
        </span>
        {rfq.expected_duration && (
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" /> {rfq.expected_duration}
          </span>
        )}
        {rfq.project_address_summary && (
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {rfq.project_address_summary.split(',').slice(-2).join(',').trim()}
          </span>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{rfq.preview || 'No public summary available.'}</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Lock className="h-5 w-5 mt-1 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Full project details are restricted</h2>
              <p className="text-sm text-muted-foreground">
                Documents, scope of work, linked properties, services, and bidding require admin approval.
                {!isAuthenticated && ' Create a free vendor account to request access.'}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {['Project documents & technical specifications', 'Linked properties and required services', 'Budget guidance & commercial framework', 'Submit a bid'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground select-none blur-[1.5px] hover:blur-none transition">
                <Lock className="h-3.5 w-3.5" /> {item}
              </div>
            ))}
          </div>

          {access.isPending ? (
            <Button disabled className="w-full">
              <Hourglass className="h-4 w-4 mr-2" /> Awaiting admin approval
            </Button>
          ) : access.isRejected ? (
            <Button variant="outline" onClick={() => setRequestOpen(true)} className="w-full">
              Re-submit request
            </Button>
          ) : (
            <Button onClick={() => setRequestOpen(true)} className="w-full">
              {isAuthenticated ? 'Request access' : 'Sign up to request access'}
            </Button>
          )}
        </CardContent>
      </Card>

      <RequestRFQAccessDialog
        rfqId={rfq.id}
        rfqTitle={rfq.title}
        open={requestOpen}
        onOpenChange={setRequestOpen}
      />
    </main>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRFQListSubscription } from '@/hooks/useRFQSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Clock, CheckCircle2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RFQStatusBadge } from '@/components/rfq/shared/RFQStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHero from '@/components/shared/PageHero';
import StatsCard from '@/components/shared/StatsCard';

export default function RFQManagement() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useRFQListSubscription();

  const { data: rfqs, isLoading } = useQuery({
    queryKey: ['rfqs', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('rfqs')
        .select(`
          id,
          title,
          description,
          status,
          deadline,
          created_at,
          property:properties(id, title, address),
          rfq_lots(id),
          rfq_invites(id, status)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalRfqs = rfqs?.length || 0;
  const openRfqs = rfqs?.filter(r => r.status === 'open').length || 0;
  const awardedRfqs = rfqs?.filter(r => r.status === 'awarded').length || 0;
  const completedRfqs = rfqs?.filter(r => r.status === 'completed').length || 0;

  return (
    <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="info" intensity="subtle" showOrbs>
      <div className="container mx-auto py-6 space-y-6">
        <PageHero
          title="RFQ Management"
          description="Create and manage Requests for Quotations for your properties and projects"
          icon={FileText}
          variant="gradient"
         actions={[
            { label: 'Create RFQ', href: '/admin/rfq/create-detailed' }
          ]}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total RFQs"
            value={totalRfqs}
            icon={FileText}
            color="info"
            animated
          />
          <StatsCard
            title="Open"
            value={openRfqs}
            icon={Clock}
            color="warning"
            animated
          />
          <StatsCard
            title="Awarded"
            value={awardedRfqs}
            icon={Award}
            color="primary"
            animated
          />
          <StatsCard
            title="Completed"
            value={completedRfqs}
            icon={CheckCircle2}
            color="success"
            animated
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'draft', 'open', 'awarded', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Active RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Loading RFQs...</div>
          ) : rfqs && rfqs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lots</TableHead>
                  <TableHead>Invites</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => (
                  <TableRow
                    key={rfq.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/rfq/${rfq.id}`)}
                  >
                    <TableCell className="font-medium">{rfq.title}</TableCell>
                    <TableCell>{rfq.property?.title || 'N/A'}</TableCell>
                    <TableCell>
                      <RFQStatusBadge status={rfq.status as any} />
                    </TableCell>
                    <TableCell>{rfq.rfq_lots?.length || 0}</TableCell>
                    <TableCell>{rfq.rfq_invites?.length || 0}</TableCell>
                    <TableCell>
                      {new Date(rfq.deadline).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/rfq/${rfq.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No RFQs found. Create your first RFQ to get started.
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </EnhancedPageBackground>
  );
}

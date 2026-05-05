import { useTopVendors } from '@/hooks/useAdminVendorOps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function TopVendorLeaderboard() {
  const { data, isLoading } = useTopVendors(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top Vendor Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vendors yet.</p>
        ) : (
          <ol className="space-y-2">
            {(data as any[]).map((v, idx) => (
              <li key={v.vendor_id} className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
                <Link to={`/admin/vendors/${v.vendor_id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                  <span className="font-bold text-primary w-6">#{idx + 1}</span>
                  <span className="font-medium">{v.company_name || 'Unnamed Vendor'}</span>
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{v.contracts_awarded} contracts</span>
                  <span>★ {Number(v.rating).toFixed(1)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

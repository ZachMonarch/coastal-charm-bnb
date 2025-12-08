import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Search, Filter, Download, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  created_at: string;
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, table_name, record_id, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('INSERT')) return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
    return 'bg-muted text-muted-foreground border-border';
  };

  // Calculate stats
  const totalLogs = logs.length;
  const today = new Date().toDateString();
  const todayLogs = logs.filter(log => new Date(log.created_at).toDateString() === today).length;
  const createActions = logs.filter(log => log.action.includes('CREATE') || log.action.includes('INSERT')).length;
  const deleteActions = logs.filter(log => log.action.includes('DELETE') || log.action.includes('REMOVE')).length;

  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="info">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Hero Section */}
          <PageHero
            title="Audit Log"
            description="Track all system actions and changes for compliance and security"
            icon={FileText}
            variant="gradient"
            actions={[
              { label: "Refresh", href: "#", variant: "outline" },
              { label: "Export", href: "#", variant: "outline" }
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Logs"
              value={totalLogs}
              icon={FileText}
              color="info"
              subtitle="Last 100 entries"
            />
            <StatsCard
              title="Today's Activity"
              value={todayLogs}
              icon={Activity}
              color="success"
              subtitle="Actions today"
            />
            <StatsCard
              title="Create Actions"
              value={createActions}
              icon={FileText}
              color="primary"
              subtitle="New records"
            />
            <StatsCard
              title="Delete Actions"
              value={deleteActions}
              icon={AlertTriangle}
              color="warning"
              subtitle="Removed records"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={loadAuditLogs} className="border-primary/20">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="border-primary/20">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by action, table, or user..."
                    className="border-primary/20"
                  />
                </div>
                <Button variant="outline" className="border-primary/20">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 100 audit log entries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Loading audit logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border border-primary/20 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {log.table_name || 'Unknown'} {log.record_id && `(ID: ${log.record_id.slice(0, 8)}...)`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            User: {log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </EnhancedPageBackground>
    </OptimizedProtectedRoute>
  );
}
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Filter, FileEdit, UserPlus, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/utils/logger';
import { getActionTypeColor } from '@/utils/themeColors';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  user_id: string;
  old_values?: any;
  new_values?: any;
}

const ACTION_ICONS: Record<string, any> = {
  INSERT: FileEdit,
  UPDATE: FileEdit,
  DELETE: AlertCircle,
  ROLE_CHANGE: UserPlus,
  PAYMENT: DollarSign,
  RFQ: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: getActionTypeColor('create'),
  UPDATE: getActionTypeColor('update'),
  DELETE: getActionTypeColor('delete'),
  ROLE_CHANGE: getActionTypeColor('security'),
  PAYMENT: getActionTypeColor('create'),
  RFQ: getActionTypeColor('access'),
};

export default function ActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [user?.id, filter]);

  const fetchLogs = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, user_id, old_values, new_values')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      logger.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionType = (action: string): string => {
    if (action.includes('INSERT')) return 'INSERT';
    if (action.includes('UPDATE')) return 'UPDATE';
    if (action.includes('DELETE')) return 'DELETE';
    if (action.includes('ROLE')) return 'ROLE_CHANGE';
    if (action.includes('PAYMENT')) return 'PAYMENT';
    if (action.includes('RFQ') || action.includes('BID')) return 'RFQ';
    return 'UPDATE';
  };

  const formatAction = (log: AuditLog): string => {
    const actionType = getActionType(log.action);
    const tableName = log.table_name.replace(/_/g, ' ');

    switch (actionType) {
      case 'INSERT':
        return `Created new ${tableName}`;
      case 'UPDATE':
        return `Updated ${tableName}`;
      case 'DELETE':
        return `Deleted ${tableName}`;
      case 'ROLE_CHANGE':
        return `Role changed to ${log.new_values?.role || 'unknown'}`;
      case 'PAYMENT':
        return `Payment processed`;
      case 'RFQ':
        return `RFQ action: ${log.action}`;
      default:
        return log.action;
    }
  };

  return (
    <Card className="neumorphic-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Activity Log
            </CardTitle>
            <CardDescription>Your recent activity history</CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
              <SelectItem value="ROLE_CHANGE">Role Changes</SelectItem>
              <SelectItem value="PAYMENT">Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity logs found
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const actionType = getActionType(log.action);
                const Icon = ACTION_ICONS[actionType] || FileEdit;
                const colorClass = ACTION_COLORS[actionType] || ACTION_COLORS.UPDATE;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{formatAction(log)}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.table_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

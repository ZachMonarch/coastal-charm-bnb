import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, PlayCircle, Eye, CheckCircle2, XCircle, AlertTriangle, History } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnvironmentBanner from '@/components/EnvironmentBanner';

export default function AdminControlSuite() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [intent, setIntent] = useState('');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetTable, setTargetTable] = useState('');
  const [operation, setOperation] = useState('UPDATE');
  const [confirmText, setConfirmText] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from('admin_jobs' as any) // Types will auto-regenerate after migration
      .select('id, title, intent, risk_level, target_table, target_operation, created_by, created_at, status, completed_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Failed to load jobs');
      return;
    }

    setJobs(data || []);
  };

  const createJob = async () => {
    if (!title || !intent || !targetTable) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_jobs' as any) // Types will auto-regenerate after migration
        .insert({
          title,
          intent,
          risk_level: riskLevel,
          target_table: targetTable,
          target_operation: operation,
          created_by: user?.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Job created successfully');
      setTitle('');
      setIntent('');
      setTargetTable('');
      loadJobs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending_approval: { variant: 'default', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' }
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-success/10 text-success dark:bg-success/20 border-success/30',
      medium: 'bg-warning/10 text-warning dark:bg-warning/20 border-warning/30',
      high: 'bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive/30'
    };
    return <Badge variant="outline" className={colors[risk as keyof typeof colors] || ''}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <EnvironmentBanner />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Admin Control Suite
        </h1>
        <p className="text-muted-foreground mt-2">
          Governance-driven administrative operations with full audit trail
        </p>
      </div>

      {/* Warning */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>CRITICAL:</strong> All operations are permanent and fully audited. 
          High-risk operations require dual approval.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Job Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Admin Job</CardTitle>
            <CardDescription>Define and track administrative operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Job Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Update vendor verification status"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Intent / Reason</label>
              <Textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Why is this operation needed?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={riskLevel} onValueChange={(v: any) => setRiskLevel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (Requires Approval)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Operation</label>
                <Select value={operation} onValueChange={setOperation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELECT">SELECT</SelectItem>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="RPC">RPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Target Table</label>
              <Input
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                placeholder="e.g., vendor_profiles"
              />
            </div>

            <Button onClick={createJob} disabled={loading} className="w-full">
              <PlayCircle className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Jobs</span>
              <Button variant="outline" size="sm" onClick={loadJobs}>
                <History className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No jobs yet. Create your first administrative job above.
                </p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-3 border rounded space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{job.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{job.intent}</p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{job.target_operation}</span>
                      <span>•</span>
                      <span>{job.target_table}</span>
                      <span>•</span>
                      {getRiskBadge(job.risk_level)}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Governance Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Low Risk
              </h4>
              <p className="text-xs text-muted-foreground">
                Read operations, minor updates. Single approval required.
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-yellow-500" />
                Medium Risk
              </h4>
              <p className="text-xs text-muted-foreground">
                Moderate updates affecting multiple records. Review recommended.
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-500" />
                High Risk
              </h4>
              <p className="text-xs text-muted-foreground">
                Mass operations, deletions. Requires dual approval + snapshot.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

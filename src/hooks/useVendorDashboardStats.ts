import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { logger } from '@/utils/logger';

export interface VendorDashboardStats {
  openRFQs: number;
  assignedProjects: number;
  pendingDocuments: number;
  unpaidInvoices: number;
  profileCompletion: number;
  nextDeadline: string | null;
  urgentTasks: number;
  totalApplications: number;
  completedProjects: number;
  rating: number;
  responseTime: string;
}

export function useVendorDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorDashboardStats>({
    openRFQs: 0,
    assignedProjects: 0,
    pendingDocuments: 0,
    unpaidInvoices: 0,
    profileCompletion: 0,
    nextDeadline: null,
    urgentTasks: 0,
    totalApplications: 0,
    completedProjects: 0,
    rating: 0,
    responseTime: '0h',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;
        
        // Fetch all stats in parallel
        const [
          openRFQsResult,
          assignedProjectsResult,
          vendorDocumentsResult,
          vendorPaymentsResult,
          vendorApplicationsResult,
          vendorProfileResult
        ] = await Promise.all([
          // Open RFQs available to bid on (count only)
          supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open'),
          
          // Assigned projects (minimal fields for stats)
          supabase
            .from('projects')
            .select('id, status, deadline')
            .eq('assigned_vendor_id', user.id)
            .in('status', ['in_progress', 'assigned']),
          
          // Vendor documents status (minimal fields)
          supabase
            .from('vendor_documents')
            .select('id, is_verified')
            .eq('vendor_id', user.id),
          
          // Vendor payments (minimal fields for stats)
          supabase
            .from('vendor_payments')
            .select('id, status')
            .eq('vendor_id', user.id),
          
          // Vendor applications (minimal fields)
          supabase
            .from('vendor_applications')
            .select('id, status')
            .eq('user_id', user.id),
          
          // Vendor profile (only needed fields for stats)
          supabase
            .from('vendor_profiles')
            .select('company_name, description, phone, address, specialties, certifications, years_experience, rating, response_time_hours')
            .eq('user_id', user.id)
            .single()
        ]);

        const openRFQs = openRFQsResult.count || 0;
        const assignedProjects = assignedProjectsResult.data?.length || 0;
        const assignedProjectsData = assignedProjectsResult.data || [];
        const allDocuments = vendorDocumentsResult.data || [];
        const pendingDocuments = allDocuments.filter(doc => !doc.is_verified).length;
        const unpaidInvoices = vendorPaymentsResult.data?.filter(payment => payment.status === 'pending').length || 0;
        const applications = vendorApplicationsResult.data || [];
        const profile = vendorProfileResult.data;

        // Calculate profile completion percentage
        const profileFields = [
          profile?.company_name,
          profile?.description,
          profile?.phone,
          profile?.address,
          profile?.specialties?.length > 0,
          profile?.certifications?.length > 0,
          profile?.years_experience,
          allDocuments.length > 0
        ];
        const completedFields = profileFields.filter(Boolean).length;
        const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

        // Find next deadline (already have deadline field from query)
        const projectsWithDeadlines = assignedProjectsData.filter(p => p.deadline);
        const nextDeadline = projectsWithDeadlines.length > 0 
          ? projectsWithDeadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]?.deadline
          : null;

        // Calculate urgent tasks (upcoming deadlines + pending payments)
        const urgentDeadlines = projectsWithDeadlines.filter(p => {
          const deadline = new Date(p.deadline);
          const now = new Date();
          const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7; // Urgent if deadline is within 7 days
        }).length;
        const urgentTasks = urgentDeadlines + unpaidInvoices;

        setStats({
          openRFQs,
          assignedProjects,
          pendingDocuments,
          unpaidInvoices,
          profileCompletion,
          nextDeadline,
          urgentTasks,
          totalApplications: applications.length,
          completedProjects: applications.filter(app => app.status === 'completed').length,
          rating: profile?.rating || 0,
          responseTime: profile?.response_time_hours ? `${profile.response_time_hours}h` : '24h',
        });
      } catch (err) {
        logger.error('Error fetching vendor dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchStats();

    // Set up real-time subscriptions for live updates
    const projectsChannel = supabase
      .channel('vendor-dashboard-projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        () => fetchStats()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vendor_documents', filter: `vendor_id=eq.${user.id}` }, 
        () => fetchStats()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vendor_payments', filter: `vendor_id=eq.${user.id}` }, 
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
    };
  }, [user?.id, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
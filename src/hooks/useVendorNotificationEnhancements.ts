import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { notifyQualifiedVendors, notifyMilestoneStatusChange } from '@/utils/notificationService';

export function useVendorNotificationEnhancements() {
  const { user } = useAuth();

  // Listen for new projects to notify qualified vendors
  useRealtimeUpdates({
    table: 'projects',
    event: 'INSERT',
    onInsert: async (payload) => {
      const project = payload.new;
      
      // Only notify for open projects
      if (project.status === 'open') {
        try {
          const vendorCount = await notifyQualifiedVendors(
            project.id,
            project.title,
            project.category,
            project.skills_required || [],
            {
              min: project.budget_min,
              max: project.budget_max
            }
          );
          
          console.log(`Notified ${vendorCount} qualified vendors about new RFQ: ${project.title}`);
        } catch (error) {
          console.error('Error notifying vendors about new RFQ:', error);
        }
      }
    }
  });

  // Listen for project status changes to catch newly opened projects
  useRealtimeUpdates({
    table: 'projects',
    event: 'UPDATE', 
    onUpdate: async (payload) => {
      const oldProject = payload.old;
      const newProject = payload.new;
      
      // If project status changed to 'open', notify vendors
      if (oldProject.status !== 'open' && newProject.status === 'open') {
        try {
          const vendorCount = await notifyQualifiedVendors(
            newProject.id,
            newProject.title,
            newProject.category,
            newProject.skills_required || [],
            {
              min: newProject.budget_min,
              max: newProject.budget_max
            }
          );
          
          console.log(`Notified ${vendorCount} qualified vendors about opened RFQ: ${newProject.title}`);
        } catch (error) {
          console.error('Error notifying vendors about opened RFQ:', error);
        }
      }
    }
  });

  // Listen for milestone status changes
  useRealtimeUpdates({
    table: 'project_milestones',
    event: 'UPDATE',
    onUpdate: async (payload) => {
      const oldMilestone = payload.old;
      const newMilestone = payload.new;
      
      // Check if milestone status changed to completed or if it was approved/rejected
      if (oldMilestone.status !== newMilestone.status) {
        try {
          // Get project details using Supabase
          const { data: project, error } = await supabase
            .from('projects')
            .select('id, title, assigned_vendor_id')
            .eq('id', newMilestone.project_id)
            .single();

          if (error || !project?.assigned_vendor_id) return;
          
          let status: 'approved' | 'rejected';
          let amount: string | undefined;
          
          if (newMilestone.status === 'completed') {
            status = 'approved';
            amount = newMilestone.amount ? `$${newMilestone.amount.toLocaleString()}` : undefined;
          } else if (newMilestone.status === 'rejected') {
            status = 'rejected';
          } else {
            return; // Don't notify for other status changes
          }
          
          await notifyMilestoneStatusChange(
            project.assigned_vendor_id,
            project.title,
            newMilestone.name,
            status,
            amount
          );
          
          console.log(`Notified vendor about milestone ${status}: ${newMilestone.name}`);
        } catch (error) {
          console.error('Error notifying vendor about milestone status change:', error);
        }
      }
    }
  });

  // Listen for vendor bid status changes
  useRealtimeUpdates({
    table: 'vendor_bids',
    event: 'UPDATE',
    onUpdate: async (payload) => {
      const oldBid = payload.old;
      const newBid = payload.new;
      
      // Only notify the vendor who owns this bid
      if (user?.id === newBid.vendor_id && oldBid.status !== newBid.status) {
        try {
          // Get project details using Supabase
          const { data: project, error } = await supabase
            .from('projects')
            .select('id, title')
            .eq('id', newBid.project_id)
            .single();

          if (error || !project) return;
          
          // Import notification service here to avoid circular dependencies
          const { createNotification, notificationTemplates } = await import('@/utils/notificationService');
          
          const template = notificationTemplates.bidStatusUpdate(project.title, newBid.status);
          
          await createNotification({
            userId: newBid.vendor_id,
            title: template.title,
            message: template.message,
            type: template.type,
            actionUrl: `/vendor/projects/${newBid.project_id}`
          });
          
          console.log(`Notified vendor about bid status change: ${newBid.status}`);
        } catch (error) {
          console.error('Error notifying vendor about bid status change:', error);
        }
      }
    }
  });

  return {
    // Return any status or methods if needed
    isActive: !!user
  };
}
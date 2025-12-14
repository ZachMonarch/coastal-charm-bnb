import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
}

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  actionUrl
}: CreateNotificationOptions) => {
  try {
    // Check user's notification preferences before creating notification
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('user_id, push_notifications, email_notifications, security_alerts, project_updates, payment_alerts, invoice_alerts')
      .eq('user_id', userId)
      .single();

    // If settings exist and push notifications are disabled, skip
    if (settings && !settings.push_notifications) {
      console.log(`Push notifications disabled for user ${userId}, skipping...`);
      return null;
    }

    // Check specific alert types
    if (settings) {
      const shouldSkip = 
        (type === 'warning' && !settings.security_alerts) ||
        (message.toLowerCase().includes('project') && !settings.project_updates) ||
        (message.toLowerCase().includes('payment') && !settings.payment_alerts) ||
        (message.toLowerCase().includes('invoice') && !settings.invoice_alerts);
      
      if (shouldSkip) {
        console.log(`Notification type disabled for user ${userId}, skipping...`);
        return null;
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Predefined notification templates
export const notificationTemplates = {
  bookingConfirmed: (propertyTitle: string, checkIn: string) => ({
    title: 'Booking Confirmed',
    message: `Your booking for ${propertyTitle} on ${checkIn} has been confirmed.`,
    type: 'success' as const
  }),

  bookingCancelled: (propertyTitle: string) => ({
    title: 'Booking Cancelled',
    message: `Your booking for ${propertyTitle} has been cancelled.`,
    type: 'warning' as const
  }),

  projectAssigned: (projectTitle: string) => ({
    title: 'New Project Assignment',
    message: `You have been assigned to project: ${projectTitle}`,
    type: 'info' as const
  }),

  projectCompleted: (projectTitle: string) => ({
    title: 'Project Completed',
    message: `Project ${projectTitle} has been marked as completed.`,
    type: 'success' as const
  }),

  vendorBidReceived: (projectTitle: string, vendorName: string) => ({
    title: 'New Bid Received',
    message: `${vendorName} has submitted a bid for ${projectTitle}`,
    type: 'info' as const
  }),

  vendorBidAccepted: (projectTitle: string) => ({
    title: 'Bid Accepted',
    message: `Your bid for ${projectTitle} has been accepted!`,
    type: 'success' as const
  }),

  vendorBidRejected: (projectTitle: string) => ({
    title: 'Bid Not Selected',
    message: `Your bid for ${projectTitle} was not selected.`,
    type: 'warning' as const
  }),

  subscriptionExpiring: (expirationDate: string) => ({
    title: 'Subscription Expiring',
    message: `Your subscription will expire on ${expirationDate}. Renew to continue using premium features.`,
    type: 'warning' as const
  }),

  subscriptionRenewed: (tier: string, renewalDate: string) => ({
    title: 'Subscription Renewed',
    message: `Your ${tier} subscription has been renewed until ${renewalDate}.`,
    type: 'success' as const
  }),

  paymentFailed: () => ({
    title: 'Payment Failed',
    message: 'Your recent payment could not be processed. Please update your payment method.',
    type: 'error' as const
  }),

  paymentSuccess: (amount: string) => ({
    title: 'Payment Successful',
    message: `Payment of ${amount} has been processed successfully.`,
    type: 'success' as const
  }),

  // Payment Management Templates
  paymentRequestReceived: (title: string, amount: string, dueDate?: string) => ({
    title: 'Payment Request',
    message: `New payment required: ${title} - $${amount}${dueDate ? ` (Due: ${dueDate})` : ''}`,
    type: 'warning' as const
  }),

  paymentModified: (title: string) => ({
    title: 'Payment Updated',
    message: `Payment "${title}" has been modified. Please review the changes.`,
    type: 'info' as const
  }),

  paymentCancelled: (title: string) => ({
    title: 'Payment Cancelled',
    message: `Payment request for "${title}" has been cancelled.`,
    type: 'info' as const
  }),

  payoutReceived: (amount: string, reason: string) => ({
    title: 'Payout Received',
    message: `You have received a payout of $${amount}${reason ? ` for ${reason}` : ''}`,
    type: 'success' as const
  }),

  refundApproved: (paymentTitle: string, amount: string) => ({
    title: 'Refund Approved',
    message: `Your refund request for "${paymentTitle}" ($${amount}) has been approved and will be processed shortly.`,
    type: 'success' as const
  }),

  refundRejected: (paymentTitle: string, reason?: string) => ({
    title: 'Refund Request Declined',
    message: `Your refund request for "${paymentTitle}" was declined${reason ? `: ${reason}` : ''}.`,
    type: 'warning' as const
  }),

  // New vendor-specific templates
  newRFQAvailable: (projectTitle: string, category: string, budget?: string) => ({
    title: 'New RFQ Available',
    message: `A new ${category} project "${projectTitle}" is now available for bidding${budget ? ` (Budget: ${budget})` : ''}.`,
    type: 'info' as const
  }),

  milestoneApproved: (projectTitle: string, milestoneName: string, amount?: string) => ({
    title: 'Milestone Approved',
    message: `Milestone "${milestoneName}" for project "${projectTitle}" has been approved${amount ? ` (${amount})` : ''}.`,
    type: 'success' as const
  }),

  milestoneRejected: (projectTitle: string, milestoneName: string, reason?: string) => ({
    title: 'Milestone Needs Revision',
    message: `Milestone "${milestoneName}" for project "${projectTitle}" requires revisions${reason ? `: ${reason}` : ''}.`,
    type: 'warning' as const
  }),

  milestoneDeadlineApproaching: (projectTitle: string, milestoneName: string, daysLeft: number) => ({
    title: 'Milestone Deadline Approaching',
    message: `Milestone "${milestoneName}" for project "${projectTitle}" is due in ${daysLeft} day(s).`,
    type: 'warning' as const
  }),

  documentExpiring: (documentType: string, daysLeft: number) => ({
    title: 'Document Expiring Soon',
    message: `Your ${documentType} will expire in ${daysLeft} day(s). Please renew to maintain verification status.`,
    type: 'warning' as const
  }),

  documentExpired: (documentType: string) => ({
    title: 'Document Expired',
    message: `Your ${documentType} has expired. Please upload a new document to maintain verification status.`,
    type: 'error' as const
  }),

  bidStatusUpdate: (projectTitle: string, status: string) => ({
    title: 'Bid Status Update',
    message: `Your bid for "${projectTitle}" has been ${status}.`,
    type: status === 'accepted' ? 'success' as const : 'info' as const
  }),

  contractMilestoneComplete: (projectTitle: string, milestoneName: string) => ({
    title: 'Milestone Completed',
    message: `You have successfully completed milestone "${milestoneName}" for project "${projectTitle}".`,
    type: 'success' as const
  })
};

// Batch notification creation
export const createBulkNotifications = async (notifications: CreateNotificationOptions[]) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications.map(n => ({
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type || 'info',
        action_url: n.actionUrl
      })));

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Send notification to all admins
export const notifyAdmins = async (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => {
  try {
    // Get all admin users
    const { data: adminProfiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (error) throw error;
    if (!adminProfiles || adminProfiles.length === 0) return;

    const adminNotifications = adminProfiles.map(admin => ({
      userId: admin.id,
      title,
      message,
      type: type || 'info'
    }));

    await createBulkNotifications(adminNotifications);
  } catch (error) {
    console.error('Error notifying admins:', error);
    throw error;
  }
};

// Notify qualified vendors about new RFQ
export const notifyQualifiedVendors = async (projectId: string, projectTitle: string, category: string, requiredSkills: string[] = [], budget?: { min?: number, max?: number }) => {
  try {
    const query = supabase
      .from('vendor_profiles')
      .select('user_id, specialties, service_areas')
      .eq('is_verified', true)
      .eq('availability_status', 'available');

    const { data: qualifiedVendors, error } = await query;

    if (error) throw error;
    if (!qualifiedVendors || qualifiedVendors.length === 0) return;

    // Filter vendors by specialties if required skills are specified
    const matchingVendors = qualifiedVendors.filter(vendor => {
      if (requiredSkills.length === 0) return true;
      
      const vendorSpecialties = vendor.specialties || [];
      return requiredSkills.some(skill => 
        vendorSpecialties.some((specialty: string) => 
          specialty.toLowerCase().includes(skill.toLowerCase()) ||
          category.toLowerCase().includes(specialty.toLowerCase())
        )
      );
    });

    if (matchingVendors.length === 0) return;

    const budgetString = budget?.min && budget?.max 
      ? `$${budget.min.toLocaleString()} - $${budget.max.toLocaleString()}`
      : undefined;

    const template = notificationTemplates.newRFQAvailable(projectTitle, category, budgetString);
    
    const vendorNotifications = matchingVendors.map(vendor => ({
      userId: vendor.user_id,
      title: template.title,
      message: template.message,
      type: template.type,
      actionUrl: `/vendor/projects/${projectId}`
    }));

    await createBulkNotifications(vendorNotifications);
    
    return matchingVendors.length;
  } catch (error) {
    console.error('Error notifying qualified vendors:', error);
    throw error;
  }
};

// Check and notify about expiring documents
export const checkExpiringDocuments = async () => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // This would need to be implemented when document expiration dates are added to the vendor_documents table
    // For now, this is a placeholder for the structure
    
    console.log('Document expiration check would run here');
    // Implementation would check vendor_documents table for documents with expiration dates
    // and create notifications for vendors with expiring documents
  } catch (error) {
    console.error('Error checking expiring documents:', error);
    throw error;
  }
};

// Notify vendor about milestone status change
export const notifyMilestoneStatusChange = async (
  vendorId: string, 
  projectTitle: string, 
  milestoneName: string, 
  status: 'approved' | 'rejected', 
  amount?: string,
  reason?: string
) => {
  try {
    const template = status === 'approved' 
      ? notificationTemplates.milestoneApproved(projectTitle, milestoneName, amount)
      : notificationTemplates.milestoneRejected(projectTitle, milestoneName, reason);

    await createNotification({
      userId: vendorId,
      title: template.title,
      message: template.message,
      type: template.type,
      actionUrl: '/vendor/projects'
    });
  } catch (error) {
    console.error('Error notifying milestone status change:', error);
    throw error;
  }
};
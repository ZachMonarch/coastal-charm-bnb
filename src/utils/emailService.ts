
import { supabase } from '@/integrations/supabase/client';

interface EmailOptions {
  to: string;
  template: 'welcome' | 'booking_confirmation' | 'project_assignment' | 'password_reset' | 'test' | 'vendor_invite' | 'maintenance_notification' | 'payment_reminder';
  data?: Record<string, any>;
  subject?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: options
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (userEmail: string, userName: string, dashboardUrl?: string) => {
  return sendEmail({
    to: userEmail,
    template: 'welcome',
    data: {
      name: userName,
      dashboardUrl: dashboardUrl || `${window.location.origin}/dashboard`
    }
  });
};

export const sendBookingConfirmation = async (
  guestEmail: string,
  bookingDetails: {
    guestName: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
    bookingId: string;
  }
) => {
  return sendEmail({
    to: guestEmail,
    template: 'booking_confirmation',
    data: bookingDetails
  });
};

export const sendProjectAssignment = async (
  vendorEmail: string,
  projectDetails: {
    vendorName: string;
    projectTitle: string;
    projectDescription: string;
    priority: string;
    deadline: string;
    budgetMin: number;
    budgetMax: number;
    projectUrl: string;
  }
) => {
  return sendEmail({
    to: vendorEmail,
    template: 'project_assignment',
    data: projectDetails
  });
};

export const sendPasswordReset = async (userEmail: string, resetUrl: string) => {
  return sendEmail({
    to: userEmail,
    template: 'password_reset',
    data: {
      resetUrl
    }
  });
};

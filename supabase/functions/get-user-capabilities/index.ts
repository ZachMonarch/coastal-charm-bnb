import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface UserCapabilities {
  canViewAdmin: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageVendors: boolean;
  canManageProperties: boolean;
  canApproveVendors: boolean;
  canCreatePayments: boolean;
  canViewReports: boolean;
  canViewAuditLogs: boolean;
  canManageRoles: boolean;
  canViewDashboard: boolean;
  canSubmitBids: boolean;
  canUploadDocuments: boolean;
  canViewProjects: boolean;
  canManageProfile: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight using shared utility
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user roles from database (server-side validation)
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      throw rolesError;
    }

    const roles = userRoles.map(r => r.role);
    const isAdmin = roles.includes('admin');
    const isPropertyManager = roles.includes('property_manager');
    const isVendor = roles.includes('vendor');
    const isTenant = roles.includes('tenant');

    // Calculate capabilities server-side (source of truth)
    const capabilities: UserCapabilities = {
      // Admin capabilities
      canViewAdmin: isAdmin,
      canManageUsers: isAdmin,
      canManageProjects: isAdmin || isPropertyManager,
      canManageVendors: isAdmin,
      canManageProperties: isAdmin || isPropertyManager,
      canApproveVendors: isAdmin,
      canCreatePayments: isAdmin || isPropertyManager,
      canViewReports: isAdmin || isPropertyManager,
      canViewAuditLogs: isAdmin,
      canManageRoles: isAdmin,
      
      // Common capabilities
      canViewDashboard: isAdmin || isPropertyManager || isVendor || isTenant,
      canManageProfile: isAdmin || isPropertyManager || isVendor || isTenant,
      
      // Vendor capabilities
      canSubmitBids: isVendor,
      canUploadDocuments: isVendor,
      canViewProjects: isAdmin || isPropertyManager || isVendor,
    };

    return new Response(
      JSON.stringify({ capabilities }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in get-user-capabilities:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

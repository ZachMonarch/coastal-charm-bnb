import { supabase } from '@/integrations/supabase/client';

export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    // Test database connection
    const { data: dbTest, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    const databaseStatus = dbError ? 'error' : 'connected';
    
    // Test Supabase connection
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const supabaseStatus = authError ? 'error' : 'connected';

    const overallStatus = databaseStatus === 'connected' && supabaseStatus === 'connected' 
      ? 'healthy' 
      : 'degraded';

    return new Response(
      JSON.stringify({
        status: overallStatus,
        timestamp,
        version: '1.0.0',
        services: {
          database: databaseStatus,
          supabase: supabaseStatus,
        },
        uptime: process.uptime ? Math.floor(process.uptime()) : null,
      }),
      {
        status: overallStatus === 'healthy' ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp,
        version: '1.0.0',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

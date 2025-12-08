import { supabase } from '../../src/integrations/supabase/client'

async function globalSetup() {
  // Setup test environment
  console.log('Setting up test environment...')
  
  // Ensure Supabase is configured for test environment
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
  }
  
  console.log('Test environment setup complete.')
}

export default globalSetup
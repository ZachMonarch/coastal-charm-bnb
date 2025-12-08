import { supabase } from '../../src/integrations/supabase/client'

async function globalTeardown() {
  // Cleanup test environment
  console.log('Cleaning up test environment...')
  
  // Clean up any lingering test data
  try {
    // Signout if needed
    await supabase.auth.signOut()
    
    // Cleanup any orphaned test data here
    
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
  
  console.log('Test environment cleanup complete.')
}

export default globalTeardown
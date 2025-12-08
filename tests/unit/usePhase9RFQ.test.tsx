import React from 'react'
import { render, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

// Mock the auth context to return a test user
vi.mock('@/contexts/OptimizedAuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

// Mock supabase client for Phase 9 RPC functions
vi.mock('@/integrations/supabase/client', () => {
  const mockRpc = vi.fn((functionName: string) => ({
    data: { id: 'mock-rfq-id' },
    error: null
  }))
  
  return { 
    supabase: { 
      rpc: mockRpc,
      __mockRpc: mockRpc 
    } 
  }
})

import { usePhase9RFQ } from '@/hooks/usePhase9RFQ'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const TestComponent = ({ onReady }: { onReady: (hooks: any) => void }) => {
  const hooks = usePhase9RFQ()
  React.useEffect(() => onReady(hooks), [hooks, onReady])
  return null
}

describe('usePhase9RFQ (Phase 9 RPC)', () => {
  it('exposes Phase 9 RPC functions', async () => {
    let hooks: any = null
    const qc = new QueryClient()
    
    await act(async () => {
      render(
        <QueryClientProvider client={qc}>
          <TestComponent onReady={(h) => { hooks = h }} />
        </QueryClientProvider>
      )
    })

    // Verify all Phase 9 functions are exposed
    expect(typeof hooks.createRFQ).toBe('function')
    expect(typeof hooks.inviteVendors).toBe('function')
    expect(typeof hooks.submitBid).toBe('function')
    expect(typeof hooks.awardContract).toBe('function')
  })

  it('calls create_rfq RPC function', async () => {
    const { supabase } = await import('@/integrations/supabase/client')
    const mockRpc = (supabase as any).__mockRpc

    let hooks: any = null
    const qc = new QueryClient()
    
    await act(async () => {
      render(
        <QueryClientProvider client={qc}>
          <TestComponent onReady={(h) => { hooks = h }} />
        </QueryClientProvider>
      )
    })

    await act(async () => {
      try {
        await hooks.createRFQ({ 
          property_id: 1, 
          title: 'Test RFQ', 
          description: 'Test Description',
          deadline: '2025-12-31',
          lots: [{ title: 'Lot 1', description: 'Test', quantity: 10, unit: 'units' }]
        })
      } catch (error) {
        // Expected to throw in test environment due to toast
      }
    })

    expect(mockRpc).toHaveBeenCalledWith('create_rfq', expect.any(Object))
  })
})

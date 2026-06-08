import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, it, vi } from 'vitest';

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: mockRpc },
}));

vi.mock('@/contexts/OptimizedAuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock('@/hooks/useRFQAccess', () => ({
  useRFQAccess: () => ({
    hasAccess: false,
    isLoading: false,
    isPending: false,
    isRejected: false,
    submitRequest: vi.fn(),
  }),
}));

vi.mock('@/components/rfq/RequestRFQAccessDialog', () => ({
  default: () => null,
}));

import PublicRFQView from '@/pages/public/PublicRFQView';
import RFQDiscovery from '@/pages/public/RFQDiscovery';

describe('RFQ public sharing flow', () => {
  it('renders an anonymous public RFQ share page from the safe RPC payload', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'rfq-public-1',
          title: 'Shared HVAC Project',
          status: 'open',
          deadline: '2027-02-01',
          category: 'hvac',
          expected_duration: '4 weeks',
          preview: 'Masked public project summary',
          project_address_summary: 'Morgantown, WV',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const { getByRole, getByText } = render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/rfq/rfq-public-1']}>
          <Routes>
            <Route path="/rfq/:id" element={<PublicRFQView />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => expect(getByRole('heading', { level: 1, name: 'Shared HVAC Project' })).toBeInTheDocument());
    expect(getByText('Masked public project summary')).toBeInTheDocument();
    expect(getByText('Sign up to request access')).toBeInTheDocument();
    expect(mockRpc).toHaveBeenCalledWith('get_public_rfq', { _id: 'rfq-public-1' });
  });

  it('lists open RFQ projects on the public discovery route', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'rfq-public-2',
          title: 'Shared Painting Project',
          status: 'published',
          deadline: '2027-03-01',
          category: 'painting',
          expected_duration: '2 weeks',
          preview: 'Public listing summary',
          project_address_summary: 'Fairmont, WV',
          created_at: '2026-01-02T00:00:00Z',
        },
      ],
      error: null,
    });

    const { getByRole } = render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/rfq']}>
          <RFQDiscovery />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => expect(getByRole('heading', { level: 3, name: 'Shared Painting Project' })).toBeInTheDocument());
    expect(getByRole('link', { name: /view & request access/i })).toHaveAttribute('href', '/rfq/rfq-public-2');
    expect(mockRpc).toHaveBeenCalledWith('get_public_rfqs', { _limit: 60, _offset: 0 });
  });
});
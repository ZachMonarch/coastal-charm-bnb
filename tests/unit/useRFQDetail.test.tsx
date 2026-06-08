import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

const mockSingle = vi.fn();
const mockDocumentsOrder = vi.fn();
const mockPropertySingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'rfqs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockSingle })),
          })),
        };
      }

      if (table === 'rfq_documents') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ order: mockDocumentsOrder })),
          })),
        };
      }

      if (table === 'safe_property_listings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockPropertySingle })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  },
}));

import { useRFQDetail } from '@/hooks/useRFQDetail';

function TestRFQDetail({ rfqId, onData }: { rfqId: string; onData: (data: any) => void }) {
  const { data } = useRFQDetail(rfqId);

  React.useEffect(() => {
    if (data) onData(data);
  }, [data, onData]);

  return <ul>{data?.system_strategy.design_finality?.map((item: string) => <li key={item}>{item}</li>)}</ul>;
}

describe('useRFQDetail', () => {
  it('normalizes legacy RFQ JSON strings before detail pages render lists', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'rfq-1',
        title: 'Legacy RFQ',
        description: 'Legacy imported project',
        status: 'open',
        deadline: '2027-01-10',
        category: 'hvac',
        expected_duration: '8 weeks',
        created_at: '2026-01-01T00:00:00Z',
        property_id: null,
        document_control: {},
        executive_summary: { building_overview: 'Overview from legacy template' },
        building_details: {},
        system_strategy: {
          system_type: 'VRF',
          prohibited_systems: 'PTAC units',
          design_finality: 'No substitutions after award',
        },
        unit_configuration: [{ unit_type: 'Studio', quantity: '3', typical_size: '450 SF', capacity: '1 ton' }],
        technical_specs: { residential_load: '12 tons', installation_scope: 'Install and commission' },
        commercial_framework: { payment_milestones: [{ milestone: 1, payment_percent: 30, condition: 'Start' }] },
        codes_compliance: 'ASHRAE 62.1',
        staffing_requirements: { certifications: 'Licensed HVAC contractor' },
        budget_guidance: { contingency_percent: '10%' },
      },
      error: null,
    });
    mockDocumentsOrder.mockResolvedValueOnce({ data: [], error: null });

    const onData = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { getByText } = render(
      <QueryClientProvider client={client}>
        <TestRFQDetail rfqId="rfq-1" onData={onData} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(getByText('No substitutions after award')).toBeInTheDocument());
    expect(onData.mock.calls[0][0].system_strategy.design_finality).toEqual(['No substitutions after award']);
    expect(onData.mock.calls[0][0].unit_configuration[0].hvac_capacity).toBe('1 ton');
    expect(onData.mock.calls[0][0].technical_specs.cooling_load_summary.residential).toBe('12 tons');
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client used by the hook/save paths
vi.mock('@/integrations/supabase/client', () => {
  const builders: any[] = [];
  const factory = () => {
    const b: any = {
      _table: '',
      from(table: string) {
        b._table = table;
        return b;
      },
      insert: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return b;
  };
  const supabase = factory();
  builders.push(supabase);
  return { supabase };
});

import { supabase } from '@/integrations/supabase/client';

describe('properties insert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('omits id so the database default sequence assigns it', async () => {
    const { error } = await (supabase as any)
      .from('properties')
      .insert({
        title: 'Test property',
        city: 'Los Angeles',
        state: 'CA',
        property_type: 'condo',
        status: 'available',
      });

    expect(error).toBeNull();
    expect((supabase as any).insert).toHaveBeenCalledTimes(1);
    const arg = (supabase as any).insert.mock.calls[0][0];
    expect(arg).not.toHaveProperty('id');
    expect(arg.title).toBe('Test property');
  });
});

describe('rfq_properties upsert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upserts on (rfq_id, property_id) so re-saves do not duplicate', async () => {
    const { error } = await (supabase as any)
      .from('rfq_properties')
      .upsert(
        { rfq_id: 'r1', property_id: 1, service_types: ['painting'], notes: null },
        { onConflict: 'rfq_id,property_id' }
      );

    expect(error).toBeNull();
    expect((supabase as any).upsert).toHaveBeenCalledTimes(1);
    const [row, opts] = (supabase as any).upsert.mock.calls[0];
    expect(row.rfq_id).toBe('r1');
    expect(row.service_types).toEqual(['painting']);
    expect(opts.onConflict).toBe('rfq_id,property_id');
  });

  it('handles per-row failures without aborting the whole batch', async () => {
    const calls = [{ error: null }, { error: { message: 'unique constraint' } as any }];
    (supabase as any).upsert = vi.fn().mockImplementation(() => Promise.resolve(calls.shift()));

    const rows = [
      { rfq_id: 'r1', property_id: 1, service_types: ['x'], notes: null },
      { rfq_id: 'r1', property_id: 2, service_types: ['y'], notes: null },
    ];

    const failures: string[] = [];
    for (const r of rows) {
      const { error } = await (supabase as any).from('rfq_properties').upsert(r, {
        onConflict: 'rfq_id,property_id',
      });
      if (error) failures.push(`Property #${r.property_id}: ${error.message}`);
    }

    expect(failures).toEqual(['Property #2: unique constraint']);
  });
});

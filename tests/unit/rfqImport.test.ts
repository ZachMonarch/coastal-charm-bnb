import { describe, expect, it } from 'vitest';
import { parseImportedRfqRows } from './rfqImport';

describe('parseImportedRfqRows', () => {
  it('imports key-value rows even when populated values are stored in the description column', () => {
    const result = parseImportedRfqRows([
      { field_name: 'title', value: '', description: 'RFQ Painting Services' },
      { field_name: 'description', value: '', description: 'Interior and exterior painting for common areas' },
      { field_name: 'category', value: '', description: 'Painting Service' },
      { field_name: 'project_address', value: '', description: '538 Morris Avenue, Mundelein IL 60060' },
      { field_name: 'floors', value: '', description: '11 floors' },
      { field_name: 'residential_units', value: '', description: '139 units' },
    ]);

    expect(result.mode).toBe('template');
    expect(result.data.title).toBe('RFQ Painting Services');
    expect(result.data.category).toBe('painting');
    expect(result.data.document_control?.project_address).toBe('538 Morris Avenue, Mundelein IL 60060');
    expect(result.data.building_details?.floors).toBe(11);
    expect(result.data.building_details?.residential_units).toBe(139);
  });

  it('imports flat unit-configuration rows and supports the legacy hvac_capacity column name', () => {
    const result = parseImportedRfqRows([
      { unit_type: '1 Bedroom', quantity: '42', typical_size: '650 SF', hvac_capacity: '1.5 ton' },
      { unit_type: '2 Bedroom', quantity: '18', typical_size: '900 SF', capacity: '2 ton' },
    ]);

    expect(result.mode).toBe('unit_configuration');
    expect(result.unitCount).toBe(2);
    expect(result.data.unit_configuration).toEqual([
      { unit_type: '1 Bedroom', quantity: 42, typical_size: '650 SF', capacity: '1.5 ton' },
      { unit_type: '2 Bedroom', quantity: 18, typical_size: '900 SF', capacity: '2 ton' },
    ]);
  });
});
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { RFQ_CATEGORIES } from '@/lib/rfqCategories';

const CSV_TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  title: 'RFQ project title',
  description: 'Detailed project description',
  category: 'Service category (e.g. hvac, painting, plumbing, electrical)',
  expected_duration: 'e.g. 8-12 months',
  rfq_reference: 'Reference number e.g. MPM-2025-01',
  document_title: 'Document title',
  project_name: 'Project name',
  project_address: 'Full project address',
  building_overview: 'Building overview description',
  project_scope: 'Scope of work description',
  building_type: 'e.g. Residential Condominium',
  floors: 'Number of floors',
  total_area: 'Total area in SF',
  residential_units: 'Number of units',
  codes_compliance: 'Comma-separated compliance codes',
};

export interface ImportedUnitConfig {
  unit_type: string;
  quantity: number;
  typical_size: string;
  capacity: string;
}

export interface ImportedRfqTemplateData {
  title?: string;
  description?: string;
  category?: string;
  deadline?: string;
  expected_duration?: string;
  document_control?: {
    rfq_reference?: string;
    document_title?: string;
    project_name?: string;
    project_address?: string;
    issue_date?: string;
    document_status?: string;
  };
  executive_summary?: {
    building_overview?: string;
    project_scope?: string;
    design_intent?: string;
  };
  building_details?: {
    building_type?: string;
    floors?: number;
    total_area?: string;
    residential_units?: number;
    common_areas?: string;
    parking_spaces?: string;
    fire_protection?: string;
  };
  system_strategy?: {
    system_type?: string;
    rationale?: string;
    design_finality?: string;
  };
  technical_specs?: {
    residential_load?: string;
    common_area_load?: string;
    total_load?: string;
  };
  commercial_framework?: {
    maintenance_terms?: string;
    emergency_terms?: string;
  };
  codes_compliance?: string[];
  staffing_requirements?: {
    team_size?: string;
    certifications?: string[];
    suggested_roles?: string[];
  };
  budget_guidance?: {
    installation_min?: number;
    installation_max?: number;
    maintenance_min?: number;
    maintenance_max?: number;
    emergency_min?: number;
    emergency_max?: number;
    contingency_percent?: string;
  };
  unit_configuration?: ImportedUnitConfig[];
}

export interface ParsedRfqImportResult {
  data: ImportedRfqTemplateData;
  mode: 'template' | 'unit_configuration';
  unitCount?: number;
}

type ImportRow = Record<string, unknown>;
type NormalizedRow = Record<string, string>;

const sanitizeCell = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeRow = (row: ImportRow): NormalizedRow => {
  return Object.entries(row).reduce<NormalizedRow>((acc, [key, value]) => {
    const normalizedKey = sanitizeCell(key).toLowerCase().replace(/\s+/g, '_');
    if (normalizedKey) acc[normalizedKey] = sanitizeCell(value);
    return acc;
  }, {});
};

const parseInteger = (value: string): number | undefined => {
  const match = value.match(/-?\d+/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseCurrencyNumber = (value: string): number | undefined => {
  const normalized = value.replace(/[^\d.-]/g, '');
  if (!normalized) return undefined;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseFlexibleList = (value: string): string[] => {
  const cleaned = sanitizeCell(value);
  if (!cleaned) return [];

  const multilineValues = cleaned
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (multilineValues.length > 1) return multilineValues;

  const commaValues = cleaned
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (commaValues.length > 1 && commaValues.every((item) => item.length <= 40)) {
    return commaValues;
  }

  return [cleaned];
};

const normalizeCategory = (value: string): string | undefined => {
  const normalized = sanitizeCell(value).toLowerCase();
  if (!normalized) return undefined;

  const exactMatch = RFQ_CATEGORIES.find(
    (category) => category.id === normalized || category.label.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch.id;

  const fuzzyMatch = RFQ_CATEGORIES.find((category) => {
    const idText = category.id.replace(/_/g, ' ');
    const labelText = category.label.toLowerCase();
    return normalized.includes(idText) || normalized.includes(labelText);
  });

  if (fuzzyMatch) return fuzzyMatch.id;

  return normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
};

const getKeyValueContent = (fieldName: string, row: NormalizedRow): string => {
  const valueCell = sanitizeCell(row.value);
  if (valueCell) return valueCell;

  const descriptionCell = sanitizeCell(row.description);
  if (!descriptionCell) return '';

  return CSV_TEMPLATE_DESCRIPTIONS[fieldName] === descriptionCell ? '' : descriptionCell;
};

const mapFieldDictionaryToTemplate = (mapped: Record<string, string>): ImportedRfqTemplateData => ({
  title: mapped.title || undefined,
  description: mapped.description || undefined,
  category: normalizeCategory(mapped.category),
  deadline: mapped.deadline || undefined,
  expected_duration: mapped.expected_duration || undefined,
  document_control: {
    rfq_reference: mapped.rfq_reference || undefined,
    document_title: mapped.document_title || undefined,
    project_name: mapped.project_name || undefined,
    project_address: mapped.project_address || undefined,
    issue_date: mapped.issue_date || undefined,
    document_status: mapped.document_status || undefined,
  },
  executive_summary: {
    building_overview: mapped.building_overview || undefined,
    project_scope: mapped.project_scope || undefined,
    design_intent: mapped.design_intent || undefined,
  },
  building_details: {
    building_type: mapped.building_type || undefined,
    floors: parseInteger(mapped.floors || ''),
    total_area: mapped.total_area || undefined,
    residential_units: parseInteger(mapped.residential_units || ''),
    common_areas: mapped.common_areas || undefined,
    parking_spaces: mapped.parking_spaces || undefined,
    fire_protection: mapped.fire_protection || undefined,
  },
  system_strategy: {
    system_type: mapped.system_type || undefined,
    rationale: mapped.rationale || undefined,
    design_finality: mapped.design_finality || undefined,
  },
  technical_specs: {
    residential_load: mapped.residential_load || undefined,
    common_area_load: mapped.common_area_load || undefined,
    total_load: mapped.total_load || undefined,
  },
  commercial_framework: {
    maintenance_terms: mapped.maintenance_terms || undefined,
    emergency_terms: mapped.emergency_terms || undefined,
  },
  codes_compliance: parseFlexibleList(mapped.codes_compliance || ''),
  staffing_requirements: {
    team_size: mapped.team_size || undefined,
    certifications: parseFlexibleList(mapped.certifications || ''),
    suggested_roles: parseFlexibleList(mapped.suggested_roles || ''),
  },
  budget_guidance: {
    installation_min: parseCurrencyNumber(mapped.installation_min || ''),
    installation_max: parseCurrencyNumber(mapped.installation_max || ''),
    maintenance_min: parseCurrencyNumber(mapped.maintenance_min || ''),
    maintenance_max: parseCurrencyNumber(mapped.maintenance_max || ''),
    emergency_min: parseCurrencyNumber(mapped.emergency_min || ''),
    emergency_max: parseCurrencyNumber(mapped.emergency_max || ''),
    contingency_percent: mapped.contingency_percent || undefined,
  },
});

const parseUnitConfigurationRows = (rows: NormalizedRow[]): ImportedUnitConfig[] => {
  return rows
    .filter((row) => sanitizeCell(row.unit_type))
    .map((row) => ({
      unit_type: sanitizeCell(row.unit_type),
      quantity: parseInteger(row.quantity || '') || 0,
      typical_size: sanitizeCell(row.typical_size),
      capacity: sanitizeCell(row.capacity || row.hvac_capacity),
    }));
};

export const parseImportedRfqRows = (rows: ImportRow[]): ParsedRfqImportResult => {
  const normalizedRows = rows.map(normalizeRow).filter((row) => Object.values(row).some(Boolean));
  if (!normalizedRows.length) {
    throw new Error('The selected file is empty.');
  }

  const firstRow = normalizedRows[0];
  const isKeyValueFormat = Boolean(firstRow.field_name);

  if (isKeyValueFormat) {
    const mapped = normalizedRows.reduce<Record<string, string>>((acc, row) => {
      const fieldName = sanitizeCell(row.field_name).toLowerCase();
      if (!fieldName) return acc;

      const content = getKeyValueContent(fieldName, row);
      if (content) acc[fieldName] = content;
      return acc;
    }, {});

    if (!Object.keys(mapped).length) {
      throw new Error('The template file has headers, but no filled RFQ values yet.');
    }

    return {
      mode: 'template',
      data: mapFieldDictionaryToTemplate(mapped),
    };
  }

  const looksLikeDirectTemplate = [
    'title',
    'description',
    'category',
    'expected_duration',
    'rfq_reference',
    'project_name',
  ].some((field) => field in firstRow);

  if (looksLikeDirectTemplate) {
    return {
      mode: 'template',
      data: mapFieldDictionaryToTemplate(firstRow),
    };
  }

  const unitConfiguration = parseUnitConfigurationRows(normalizedRows);
  if (unitConfiguration.length) {
    return {
      mode: 'unit_configuration',
      unitCount: unitConfiguration.length,
      data: { unit_configuration: unitConfiguration },
    };
  }

  throw new Error('Unsupported import format. Use the RFQ CSV/XLSX template or unit configuration rows.');
};

const parseCsvFile = (file: File): Promise<ImportRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: () => reject(new Error('Failed to read CSV file.')),
    });
  });
};

const parseSpreadsheetFile = async (file: File): Promise<ImportRow[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('The spreadsheet does not contain any worksheets.');
  }

  return XLSX.utils.sheet_to_json<ImportRow>(workbook.Sheets[sheetName], {
    defval: '',
    raw: false,
  });
};

export const parseRfqImportFile = async (file: File): Promise<ParsedRfqImportResult> => {
  const fileName = file.name.toLowerCase();
  const rows = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    ? await parseSpreadsheetFile(file)
    : await parseCsvFile(file);

  return parseImportedRfqRows(rows);
};
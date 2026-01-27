/**
 * Unified RFQ/Project Service Categories
 * Single source of truth for all category dropdowns across the app
 */

export interface ServiceCategory {
  id: string;
  label: string;
  description?: string;
}

/**
 * Master list of service categories for RFQs, Projects, and Vendor capabilities
 * This ensures consistency across:
 * - Admin RFQ creation (RFQEdit.tsx)
 * - Admin Project creation (AdminProjectCreationForm.tsx, AdminRFQSystem.tsx)
 * - Vendor onboarding (CapabilitiesStep.tsx)
 * - Public quote requests (RequestQuote.tsx)
 * - Vendor marketplace filtering (VendorMarketplace.tsx)
 */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'plumbing', label: 'Plumbing', description: 'Pipes, fixtures, water systems' },
  { id: 'electrical', label: 'Electrical', description: 'Wiring, panels, lighting' },
  { id: 'hvac', label: 'HVAC', description: 'Heating, ventilation, air conditioning' },
  { id: 'painting', label: 'Painting', description: 'Interior and exterior painting services' },
  { id: 'flooring', label: 'Flooring', description: 'Tile, hardwood, carpet installation' },
  { id: 'carpentry', label: 'Carpentry', description: 'Woodwork, cabinets, framing' },
  { id: 'roofing', label: 'Roofing', description: 'Roof repair and replacement' },
  { id: 'landscaping', label: 'Landscaping', description: 'Lawn care, irrigation, outdoor design' },
  { id: 'cleaning', label: 'Cleaning', description: 'Professional cleaning services' },
  { id: 'general_contracting', label: 'General Contracting', description: 'Full-service construction management' },
  { id: 'renovation', label: 'Renovation', description: 'Remodeling and upgrades' },
  { id: 'installations', label: 'Installations', description: 'Appliance and fixture installations' },
  { id: 'appliance_repair', label: 'Appliance Repair', description: 'Repair of household appliances' },
  { id: 'pest_control', label: 'Pest Control', description: 'Extermination and prevention' },
  { id: 'security', label: 'Security', description: 'Security systems and monitoring' },
  { id: 'moving', label: 'Moving', description: 'Relocation and moving services' },
  { id: 'general_maintenance', label: 'General Maintenance', description: 'Routine upkeep and repairs' },
  { id: 'emergency', label: 'Emergency Repair', description: 'Urgent repair services' },
];

/**
 * Get category labels as a simple string array (for legacy components)
 */
export const SERVICE_CATEGORY_LABELS = SERVICE_CATEGORIES.map(c => c.label);

/**
 * Get category IDs as a simple string array (for database/form values)
 */
export const SERVICE_CATEGORY_IDS = SERVICE_CATEGORIES.map(c => c.id);

/**
 * Lookup label by ID
 */
export const getCategoryLabel = (id: string): string => {
  const category = SERVICE_CATEGORIES.find(c => c.id === id.toLowerCase());
  return category?.label || id;
};

/**
 * Lookup ID by label (case-insensitive)
 */
export const getCategoryId = (label: string): string => {
  const category = SERVICE_CATEGORIES.find(
    c => c.label.toLowerCase() === label.toLowerCase()
  );
  return category?.id || label.toLowerCase().replace(/\s+/g, '_');
};

/**
 * Categories suitable for RFQ creation (excludes emergency which is typically not RFQ-based)
 */
export const RFQ_CATEGORIES = SERVICE_CATEGORIES.filter(c => c.id !== 'emergency');

/**
 * Categories for maintenance requests (subset of critical services)
 */
export const MAINTENANCE_CATEGORIES = SERVICE_CATEGORIES.filter(c => 
  ['plumbing', 'electrical', 'hvac', 'general_maintenance', 'emergency'].includes(c.id)
);

export default SERVICE_CATEGORIES;

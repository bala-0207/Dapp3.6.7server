/**
 * GLEIF Field Indices for Merkle Tree Structure
 * This defines the standardized field positions for GLEIF data in merkle trees
 */

export const GLEIF_FIELD_INDICES = {
  // Core compliance fields (0-9)
  legalName: 0,
  lei: 1,
  entityStatus: 2,
  entity_status: 2, // alias for consistency
  legalForm: 3,
  jurisdiction: 4,
  legalAddress: 5,
  legalCity: 6,
  legalCountry: 7,
  registrationAuthority: 8,
  entityCategory: 9,
  
  // Extended GLEIF fields (10-19)
  businessRegisterEntityId: 10,
  leiStatus: 11,
  initialRegistrationDate: 12,
  lastUpdateDate: 13,
  nextRenewalDate: 14,
  registration_status: 15,
  conformity_flag: 16,
  conformityFlag: 16, // alias for camelCase consistency
  bic_codes: 17,
  mic_codes: 18,
  managingLou: 19,
  
  // Additional fields for extended verification (20-29)
  headquartersAddress: 20,
  headquartersCity: 21,
  headquartersCountry: 22,
  otherNames: 23,
  subCategory: 24,
  corroborationLevel: 25,
  validationSources: 26,
  
  // Reserved for future use (27-255)
  reserved_27: 27,
  reserved_28: 28,
  reserved_29: 29
} as const;

// Type for field indices
export type GLEIFFieldIndex = typeof GLEIF_FIELD_INDICES[keyof typeof GLEIF_FIELD_INDICES];

// Validation function
export function isValidGLEIFFieldIndex(index: number): boolean {
  return Object.values(GLEIF_FIELD_INDICES).includes(index as GLEIFFieldIndex);
}

// Helper function to get field name by index
export function getGLEIFFieldName(index: number): string | undefined {
  const entry = Object.entries(GLEIF_FIELD_INDICES).find(([_, value]) => value === index);
  return entry ? entry[0] : undefined;
}

// Export default for easy import
export default GLEIF_FIELD_INDICES;

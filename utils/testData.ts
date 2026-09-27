/**
 * Shared test data for the openIMIS suite.
 *
 * The public demo at https://demo.openimis.org ships with a single
 * administrator account hard-coded by the openIMIS maintainers:
 *   - Admin / admin123
 *
 * For tests that need to create new entities we generate unique IDs
 * (UUIDs, CHF IDs, receipt numbers) so consecutive test runs do not
 * collide on the shared demo database.
 */

import { randomUUID } from 'crypto';

/* ---------------------------------------------------------------------------
 * Demo credentials
 * ------------------------------------------------------------------------- */

export const DemoCredentials = {
  username: process.env.OPENIMIS_USERNAME ?? 'Admin',
  password: process.env.OPENIMIS_PASSWORD ?? 'admin123',
} as const;

/* ---------------------------------------------------------------------------
 * Insuree (individual / family member)
 * ------------------------------------------------------------------------- */

export interface InsureeInput {
  chfId: string;
  lastName: string;
  otherNames: string;
  dob: string; // YYYY-MM-DD
  gender: 'M' | 'F';
  marital?: 'S' | 'M' | 'D' | 'W' | '';
  phone?: string;
  email?: string;
  currentAddress?: string;
  /** ISO date string for the card-issued date, if any. */
  cardIssued?: boolean;
}

export function generateInsuree(prefix = 'qa'): InsureeInput {
  const suffix = randomUUID().slice(0, 8);
  return {
    chfId: `CHF-${prefix.toUpperCase()}-${suffix}`,
    lastName: `Tester${suffix}`,
    otherNames: `Auto${suffix}`,
    dob: '1990-01-01',
    gender: 'M',
    marital: 'S',
    phone: '5551234567',
    email: `${prefix}.${suffix}@example.com`,
    currentAddress: `${suffix} Automation Lane`,
    cardIssued: false,
  };
}

/* ---------------------------------------------------------------------------
 * Family (a group of insurees sharing a policy)
 * ------------------------------------------------------------------------- */

export interface FamilyInput {
  /** Head-insuree chfId. */
  headChfId: string;
  /** Optional family-level fields. */
  poverty?: boolean;
  confirmationNo?: string;
  address?: string;
}

export function generateFamily(headChfId: string): FamilyInput {
  return {
    headChfId,
    poverty: false,
    confirmationNo: '',
    address: '123 Family Way',
  };
}

/* ---------------------------------------------------------------------------
 * Policy
 * ------------------------------------------------------------------------- */

export interface PolicyInput {
  productCode: string;
  productId: number;
  familyId: number;
  officerId: number;
  enrollDate: string;     // YYYY-MM-DD
  startDate: string;
  expiryDate: string;
  value: string;
}

export function generatePolicy(
  productId: number,
  familyId: number,
  officerId: number,
  productCode = 'TEST',
): PolicyInput {
  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    productCode,
    productId,
    familyId,
    officerId,
    enrollDate: fmt(today),
    startDate: fmt(today),
    expiryDate: fmt(nextYear),
    value: '1200.00',
  };
}

/* ---------------------------------------------------------------------------
 * Claim
 * ------------------------------------------------------------------------- */

export interface ClaimInput {
  insureeId: number;
  healthFacilityId: number;
  adminId: number;
  icdId: number;
  dateFrom: string;
  dateClaimed: string;
  visitType?: 'E' | 'R' | '';
  careType?: 'IPD' | 'OPD';
  claimed?: string;
}

export function generateClaim(
  insureeId: number,
  healthFacilityId: number,
  adminId: number,
  icdId: number,
): ClaimInput {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    insureeId,
    healthFacilityId,
    adminId,
    icdId,
    dateFrom: fmt(today),
    dateClaimed: fmt(today),
    visitType: 'E',
    careType: 'OPD',
    claimed: '100.00',
  };
}

/* ---------------------------------------------------------------------------
 * Premium / Contribution
 * ------------------------------------------------------------------------- */

export interface PremiumInput {
  policyUuid: string;
  receipt: string;
  payDate: string;
  amount: string;
  payType: 'C' | 'B' | 'M'; // cash / bank / mobile
  payerUuid?: string;
}

export function generatePremium(policyUuid: string, amount = '1200.00'): PremiumInput {
  const suffix = randomUUID().slice(0, 8);
  return {
    policyUuid,
    receipt: `RCP-${suffix}`,
    payDate: new Date().toISOString().slice(0, 10),
    amount,
    payType: 'C',
  };
}

/* ---------------------------------------------------------------------------
 * Product
 * ------------------------------------------------------------------------- */

export interface ProductInput {
  code: string;
  name: string;
  maxMembers?: number;
  ageMin?: number;
  ageMax?: number;
}

export function generateProduct(prefix = 'qa'): ProductInput {
  const suffix = randomUUID().slice(0, 8);
  return {
    code: `PROD-${prefix.toUpperCase()}-${suffix}`,
    name: `Test Product ${suffix}`,
    maxMembers: 6,
    ageMin: 18,
    ageMax: 65,
  };
}

/* ---------------------------------------------------------------------------
 * Health Facility
 * ------------------------------------------------------------------------- */

export interface HealthFacilityInput {
  code: string;
  name: string;
  level: 'D' | 'C' | 'B' | 'A' | 'S'; // dispensary / centre / ...
  careType: 'IPD' | 'OPD' | 'BOTH';
  legalFormCode?: string;
  locationUuid: string;
  phone?: string;
}

export function generateHealthFacility(locationUuid: string, prefix = 'qa'): HealthFacilityInput {
  const suffix = randomUUID().slice(0, 8);
  return {
    code: `HF-${prefix.toUpperCase()}-${suffix}`,
    name: `Test Health Facility ${suffix}`,
    level: 'C',
    careType: 'BOTH',
    legalFormCode: 'GOV',
    locationUuid,
    phone: '5551234567',
  };
}

/* ---------------------------------------------------------------------------
 * User
 * ------------------------------------------------------------------------- */

export interface UserInput {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** A list of role names to assign. */
  roles?: string[];
}

export function generateUser(prefix = 'qa'): UserInput {
  const suffix = randomUUID().slice(0, 8);
  return {
    username: `${prefix}_${suffix}`,
    email: `${prefix}.${suffix}@example.com`,
    firstName: 'Auto',
    lastName: `Tester${suffix}`,
    roles: [],
  };
}

/* ---------------------------------------------------------------------------
 * FHIR Patient (for FHIR API tests)
 * ------------------------------------------------------------------------- */

export function generateFhirPatient() {
  const suffix = randomUUID().slice(0, 8);
  return {
    resourceType: 'Patient',
    active: true,
    name: [{ use: 'official', family: `Tester${suffix}`, given: ['Auto'] }],
    gender: 'male',
    birthDate: '1990-01-01',
    identifier: [{ system: 'urn:openimis:chf-id', value: `CHF-FHIR-${suffix}` }],
  };
}

/* ---------------------------------------------------------------------------
 * Status enums mirrored from openIMIS frontend constants.js
 * ------------------------------------------------------------------------- */

export const POLICY_STATUS = {
  IDLE: 1,
  READY: 16,
  ACTIVE: 2,
  SUSPENDED: 4,
  EXPIRED: 8,
} as const;

export const POLICY_STAGE = {
  NEW: 'N',
  RENEW: 'R',
} as const;

export const CLAIM_STATUS = {
  REJECTED: 1,
  ENTERED: 2,
  CHECKED: 4,
  PROCESSED: 8,
  VALUATED: 16,
} as const;

export const INSUREE_STATUS = {
  ACTIVE: 'AC',
  INACTIVE: 'IN',
  DEAD: 'DE',
} as const;

export const PATIENT_CONDITION = ['H', 'D', 'E', 'R'] as const;
export const CARE_TYPE = ['IPD', 'OPD'] as const;
export const VISIT_TYPE = ['E', 'R', ''] as const;
export const GENDERS = ['M', 'F'] as const;
export const PAY_TYPE = ['C', 'B', 'M'] as const;
export const HF_LEVELS = ['D', 'C', 'B', 'A', 'S'] as const;
export const HF_CARE_TYPES = ['IPD', 'OPD', 'BOTH'] as const;
export const LOCATION_TYPES = ['R', 'D', 'W', 'V'] as const; // Region, District, Ward, Village
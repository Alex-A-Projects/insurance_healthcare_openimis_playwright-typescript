import { query, queryOne, countRows, exists } from './pgClient';

/**
 * Typed query helpers for the openIMIS Django ORM schema.
 *
 * openIMIS convention: every table starts with `tbl` (PascalCase entity
 * name). openIMIS uses the legacy SQL Server mixed-case column conventions
 * (e.g. `InsureeID`, `CHFID`, `PolicyStatus`, `HfID` — yes, lowercase 'f').
 *
 * **Important casing notes (from the schema):**
 *
 *   - `tblHF.HfID` (lowercase 'f'), not `HFID`
 *   - `tblPolicy.PolicyUUID` (not `UUID`)
 *   - `tblInsuree.InsureeUUID` (not `UUID`)
 *   - `tblPremium.PremiumId` (not `PremiumID`)
 *   - `tblInsuree.IsHead` (not `head`)
 *
 * Audit / history: every "versioned" table inherits `VersionedModel`,
 * which adds three columns: `ValidityFrom`, `ValidityTo`, `LegacyID`.
 * The current state of a row has `ValidityTo IS NULL`; previous
 * revisions have a `ValidityTo` set in the past. There are no separate
 * `*Audit` or `*History` tables for legacy modules — history lives in the
 * same table, distinguished by `ValidityTo` and `LegacyID`.
 *
 * `MutationLog` (table `core_Mutation_Log`) tracks every API mutation
 * request. Each module also has a `*Mutation` join table linking a
 * domain object to its mutation log entries.
 *
 * Lookups (gender / marital / profession / etc.) live in dedicated
 * `tbl<LookupName>` tables (e.g. `tblGender`, `tblProfessions`,
 * `tblEducations`).
 */

/* ---------------------------------------------------------------------------
 * Row types — column names match the openIMIS Django models exactly.
 * ------------------------------------------------------------------------- */

export interface InsureeRow {
  InsureeID: number;
  InsureeUUID?: string;
  CHFID: string;
  LastName: string;
  OtherNames: string;
  DOB: Date | string | null;
  Gender?: string;
  Phone?: string;
  EmailId?: string;
  CurrentAddress?: string;
  Marital?: string;
  IsHead: boolean;
  CardIssued?: boolean;
  Status: string; // AC | IN | DE
  StatusDate?: string | null;
  FamilyID?: number | null;
  PhotoID?: number | null;
  CurrentVillage?: number | null;
  HFID?: number | null;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
  AuditUserID?: number;
}

export interface FamilyRow {
  FamilyID: number;
  FamilyUUID?: string;
  InsureeID?: number | null; // head-insuree
  LocationId?: number | null;
  Poverty?: boolean;
  ConfirmationNo?: string;
  FamilyAddress?: string;
  FamilyType?: string;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
  AuditUserID?: number;
}

export interface InsureePolicyRow {
  InsureePolicyID: number;
  InsureeID: number;
  PolicyId: number;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
  AuditUserID?: number;
}

export interface PolicyRow {
  PolicyID: number;
  PolicyUUID?: string;
  ProdID: number;
  FamilyID: number;
  OfficerID?: number | null;
  PolicyStage: 'N' | 'R';
  PolicyStatus: number; // smallint: 1=idle, 2=active, 4=suspended, 8=expired, 16=ready
  PolicyValue: string | number;
  EnrollDate: Date | string;
  StartDate: Date | string;
  EffectiveDate?: Date | string | null;
  ExpiryDate?: Date | string | null;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
  AuditUserID?: number;
}

export interface PolicyRenewalRow {
  PolicyRenewalID: number;
  PolicyID: number;
  NewPolicyID?: number | null;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
}

export interface ClaimRow {
  ClaimID: number;
  ClaimUUID?: string;
  ClaimCode: string;
  InsureeID: number;
  HFID?: number;
  ClaimAdminId?: number | null;
  ICDID?: number;
  DateClaimed: Date | string;
  DateFrom: Date | string | null;
  DateTo?: Date | string | null;
  Claimed: string | number;
  Approved: string | number | null;
  ClaimStatus: number; // 1=rejected, 2=entered, 4=checked, 8=processed, 16=valuated
  FeedbackStatus: number;
  ReviewStatus: number;
  VisitType?: string;
  CareType?: string;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
  AuditUserID?: number;
}

export interface ClaimItemRow {
  ClaimItemID: number;
  ClaimID: number;
  ItemID: number;
  ProdID?: number;
  ClaimItemStatus: number;
  QtyProvided?: string | number;
  QtyApproved?: string | number;
  PriceAsked?: string | number;
  PriceAdjusted?: string | number;
  PriceApproved?: string | number;
  PriceValuated?: string | number;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
}

export interface ClaimServiceRow {
  ClaimServiceID: number;
  ClaimID: number;
  ServiceID: number;
  ProdID?: number;
  ClaimServiceStatus: number;
  QtyProvided?: string | number;
  QtyApproved?: string | number;
  PriceAsked?: string | number;
  PriceAdjusted?: string | number;
  PriceApproved?: string | number;
  PriceValuated?: string | number;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
}

export interface PremiumRow {
  PremiumId: number;
  PremiumUUID?: string;
  PolicyID: number;
  PayerID?: number | null;
  Amount: string | number;
  Receipt: string;
  PayDate: Date | string;
  PayType: string; // B=Bank, C=Cash, M=Mobile, F=Funding
  isPhotoFee: boolean;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
  AuditUserID?: number;
  CreatedDate?: Date | string | null;
}

export interface ProductRow {
  ProdID: number;
  ProdUUID?: string;
  ProductCode: string;
  ProductName: string;
  LocationId?: number | null;
  DateFrom?: Date | string | null;
  DateTo?: Date | string | null;
  InsurancePeriod?: number | null;
  MemberCount?: number | null;
  MaxInstallments?: number | null;
  PremiumAdult?: string | number;
  PremiumChild?: string | number;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
}

export interface HealthFacilityRow {
  HfID: number;
  HfUUID?: string;
  HFCode: string;
  HFName: string;
  AccCode?: string;
  LegalForm?: string;
  HFLevel?: string; // C=health-centre, D=dispensary, H=hospital
  HFSublevel?: string;
  LocationId?: number | null;
  HFAddress?: string;
  Phone?: string;
  Fax?: string;
  eMail?: string;
  HFCareType?: string; // I=in-patient, O=out-patient, B=both
  PLServiceID?: number | null;
  PLItemID?: number | null;
  ContractStartDate?: Date | string | null;
  ContractEndDate?: Date | string | null;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
}

export interface LocationRow {
  LocationId: number;
  LocationUUID?: string;
  LocationCode: string;
  LocationName: string;
  LocationType: 'R' | 'D' | 'W' | 'V';
  ParentLocationId?: number | null;
  MalePopulation?: number;
  FemalePopulation?: number;
  OtherPopulation?: number;
  Families?: number;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
}

export interface UserRow {
  UserID: number;
  UserUUID?: string;
  LoginName: string;
  UserName?: string;
  LastName?: string;
  OtherNames?: string;
  Phone?: string;
  EmailId?: string;
  RoleID?: number;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
  LegacyID?: number | null;
}

export interface OfficerRow {
  OfficerID: number;
  OfficerUUID?: string;
  Code: string;
  LastName: string;
  OtherNames: string;
  Phone?: string;
  LocationId?: number | null;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
}

export interface RoleRow {
  RoleID: number;
  RoleUUID?: string;
  RoleName: string;
  IsSystem?: boolean;
  IsBlocked?: boolean;
  ValidityFrom: Date | string | null;
  ValidityTo: Date | string | null;
}

export interface MutationLogRow {
  id: string;
  request_date_time: Date | string;
  client_mutation_id?: string;
  client_mutation_label?: string;
  client_mutation_details?: string;
  status: number; // 0=Received, 1=Error, 2=Success
  error?: string;
  user_id?: number;
}

export interface FeedbackRow {
  FeedbackID: number;
  FeedbackUUID?: string;
  ClaimID: number;
  CareRendered?: boolean;
  PaymentAsked?: boolean;
  DrugPrescribed?: boolean;
  DrugReceived?: boolean;
  Asessment?: number;
  FeedbackDate?: Date | string | null;
}

/* ---------------------------------------------------------------------------
 * Generic helpers
 * ------------------------------------------------------------------------- */

/**
 * Run an arbitrary query but only against rows that are "current"
 * (`ValidityTo IS NULL`). Use the table name without quotes; it gets
 * quoted safely.
 */
export function current<T extends object>(
  table: string,
  extraWhere = '',
  params: unknown[] = [],
): Promise<T[]> {
  const sql = `SELECT * FROM "${table}" WHERE "ValidityTo" IS NULL ${extraWhere ? 'AND ' + extraWhere : ''}`;
  return query<T>(sql, params);
}

/** Count of current rows (ValidityTo IS NULL). */
export async function currentCount(table: string): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "${table}" WHERE "ValidityTo" IS NULL`);
}

/** Has any row in the table? */
export async function tableNotEmpty(table: string): Promise<boolean> {
  return exists(`SELECT EXISTS(SELECT 1 FROM "${table}") AS exists`);
}

/** Has any current row (ValidityTo IS NULL) in the table? */
export async function currentExists(table: string): Promise<boolean> {
  return exists(`SELECT EXISTS(SELECT 1 FROM "${table}" WHERE "ValidityTo" IS NULL) AS exists`);
}

/* ---------------------------------------------------------------------------
 * Insuree
 * ------------------------------------------------------------------------- */

export async function getInsureeByChfId(chfId: string): Promise<InsureeRow | null> {
  return queryOne<InsureeRow>(
    `SELECT * FROM "tblInsuree" WHERE "CHFID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [chfId],
  ) as Promise<InsureeRow | null>;
}

export async function getInsureeByUuid(uuid: string): Promise<InsureeRow | null> {
  return queryOne<InsureeRow>(
    `SELECT * FROM "tblInsuree" WHERE "InsureeUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  ) as Promise<InsureeRow | null>;
}

export async function getInsureeById(id: number): Promise<InsureeRow | null> {
  return queryOne<InsureeRow>(
    `SELECT * FROM "tblInsuree" WHERE "InsureeID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  ) as Promise<InsureeRow | null>;
}

export async function countInsurees(): Promise<number> {
  return currentCount('tblInsuree');
}

export async function countActiveInsurees(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "Status" = 'AC'`,
  );
}

export async function countDeadInsurees(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "Status" = 'DE'`,
  );
}

export async function countInactiveInsurees(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "Status" = 'IN'`,
  );
}

export async function countInsureesByGender(gender: 'M' | 'F'): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "Gender" = $1`,
    [gender],
  );
}

export async function countInsureesByFamily(familyId: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "FamilyID" = $1`,
    [familyId],
  );
}

export async function countFamilyHeads(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "IsHead" = TRUE`,
  );
}

export async function insureeHistoryCount(chfId: string): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "CHFID" = $1`, [chfId]);
}

export async function getInsureeHistory(insureeId: number): Promise<InsureeRow[]> {
  return query<InsureeRow>(
    `SELECT * FROM "tblInsuree"
     WHERE "InsureeID" = $1 OR "LegacyID" = $1
     ORDER BY "ValidityFrom"`,
    [insureeId],
  );
}

/* ---------------------------------------------------------------------------
 * Family
 * ------------------------------------------------------------------------- */

export async function getFamilyById(id: number): Promise<FamilyRow | null> {
  return queryOne<FamilyRow>(
    `SELECT * FROM "tblFamilies" WHERE "FamilyID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getFamilyByUuid(uuid: string): Promise<FamilyRow | null> {
  return queryOne<FamilyRow>(
    `SELECT * FROM "tblFamilies" WHERE "FamilyUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  );
}

export async function countFamilies(): Promise<number> {
  return currentCount('tblFamilies');
}

export async function countFamilyMembers(familyId: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblInsuree" WHERE "ValidityTo" IS NULL AND "FamilyID" = $1`,
    [familyId],
  );
}

/* ---------------------------------------------------------------------------
 * Insuree ↔ Policy link
 * ------------------------------------------------------------------------- */

export async function getInsureePolicies(insureeId: number): Promise<InsureePolicyRow[]> {
  return query<InsureePolicyRow>(
    `SELECT * FROM "tblInsureePolicy" WHERE "InsureeID" = $1 AND "ValidityTo" IS NULL`,
    [insureeId],
  );
}

export async function getPolicyInsurees(policyId: number): Promise<InsureePolicyRow[]> {
  return query<InsureePolicyRow>(
    `SELECT * FROM "tblInsureePolicy" WHERE "PolicyId" = $1 AND "ValidityTo" IS NULL`,
    [policyId],
  );
}

/* ---------------------------------------------------------------------------
 * Policy
 * ------------------------------------------------------------------------- */

export async function getPolicyById(id: number): Promise<PolicyRow | null> {
  return queryOne<PolicyRow>(
    `SELECT * FROM "tblPolicy" WHERE "PolicyID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getPolicyByUuid(uuid: string): Promise<PolicyRow | null> {
  return queryOne<PolicyRow>(
    `SELECT * FROM "tblPolicy" WHERE "PolicyUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  );
}

export async function getPoliciesByFamily(familyId: number): Promise<PolicyRow[]> {
  return query<PolicyRow>(
    `SELECT * FROM "tblPolicy" WHERE "FamilyID" = $1 AND "ValidityTo" IS NULL`,
    [familyId],
  );
}

export async function countPolicies(): Promise<number> {
  return currentCount('tblPolicy');
}

export async function countActivePolicies(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStatus" = 2`,
  );
}

export async function countIdlePolicies(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStatus" = 1`,
  );
}

export async function countReadyPolicies(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStatus" = 16`,
  );
}

export async function countSuspendedPolicies(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStatus" = 4`,
  );
}

export async function countExpiredPolicies(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStatus" = 8`,
  );
}

export async function countPoliciesByStatus(status: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStatus" = $1`,
    [status],
  );
}

export async function countPoliciesByProduct(productId: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "ProdID" = $1`,
    [productId],
  );
}

export async function countRenewedPolicies(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPolicy" WHERE "ValidityTo" IS NULL AND "PolicyStage" = 'R'`,
  );
}

/* ---------------------------------------------------------------------------
 * Claim
 * ------------------------------------------------------------------------- */

export async function getClaimById(id: number): Promise<ClaimRow | null> {
  return queryOne<ClaimRow>(
    `SELECT * FROM "tblClaim" WHERE "ClaimID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getClaimByUuid(uuid: string): Promise<ClaimRow | null> {
  return queryOne<ClaimRow>(
    `SELECT * FROM "tblClaim" WHERE "ClaimUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  );
}

export async function getClaimByCode(code: string): Promise<ClaimRow | null> {
  return queryOne<ClaimRow>(
    `SELECT * FROM "tblClaim" WHERE "ClaimCode" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [code],
  );
}

export async function countClaims(): Promise<number> {
  return currentCount('tblClaim');
}

export async function countClaimsByStatus(status: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "ClaimStatus" = $1`,
    [status],
  );
}

export async function countEnteredClaims(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "ClaimStatus" = 2`,
  );
}

export async function countCheckedClaims(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "ClaimStatus" = 4`,
  );
}

export async function countProcessedClaims(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "ClaimStatus" = 8`,
  );
}

export async function countValuatedClaims(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "ClaimStatus" = 16`,
  );
}

export async function countRejectedClaims(): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "ClaimStatus" = 1`,
  );
}

export async function countClaimsForInsuree(insureeId: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "InsureeID" = $1`,
    [insureeId],
  );
}

export async function countClaimsForHF(hfId: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "HFID" = $1`,
    [hfId],
  );
}

export async function countClaimServices(): Promise<number> {
  return currentCount('tblClaimServices');
}

export async function countClaimItems(): Promise<number> {
  return currentCount('tblClaimItems');
}

export async function getClaimServicesForClaim(claimId: number): Promise<ClaimServiceRow[]> {
  return query<ClaimServiceRow>(
    `SELECT * FROM "tblClaimServices" WHERE "ClaimID" = $1 AND "ValidityTo" IS NULL`,
    [claimId],
  );
}

export async function getClaimItemsForClaim(claimId: number): Promise<ClaimItemRow[]> {
  return query<ClaimItemRow>(
    `SELECT * FROM "tblClaimItems" WHERE "ClaimID" = $1 AND "ValidityTo" IS NULL`,
    [claimId],
  );
}

export async function totalClaimedForInsuree(insureeId: number): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM("Claimed"), 0)::text AS total FROM "tblClaim" WHERE "ValidityTo" IS NULL AND "InsureeID" = $1`,
    [insureeId],
  );
  return Number(row?.total ?? 0);
}

/* ---------------------------------------------------------------------------
 * Premium / Contribution
 * ------------------------------------------------------------------------- */

export async function getPremiumById(id: number): Promise<PremiumRow | null> {
  return queryOne<PremiumRow>(
    `SELECT * FROM "tblPremium" WHERE "PremiumId" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getPremiumsByPolicy(policyId: number): Promise<PremiumRow[]> {
  return query<PremiumRow>(
    `SELECT * FROM "tblPremium" WHERE "PolicyID" = $1 AND "ValidityTo" IS NULL`,
    [policyId],
  );
}

export async function getPremiumByReceipt(receipt: string): Promise<PremiumRow | null> {
  return queryOne<PremiumRow>(
    `SELECT * FROM "tblPremium" WHERE "Receipt" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [receipt],
  );
}

export async function countPremiums(): Promise<number> {
  return currentCount('tblPremium');
}

export async function totalPremiumsForPolicy(policyId: number): Promise<number> {
  return countRows(
    `SELECT COALESCE(SUM("Amount"), 0)::numeric AS c FROM "tblPremium" WHERE "PolicyID" = $1 AND "ValidityTo" IS NULL`,
    [policyId],
  );
}

export async function countPremiumsByPolicy(policyId: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblPremium" WHERE "PolicyID" = $1 AND "ValidityTo" IS NULL`,
    [policyId],
  );
}

/* ---------------------------------------------------------------------------
 * Product
 * ------------------------------------------------------------------------- */

export async function getProductById(id: number): Promise<ProductRow | null> {
  return queryOne<ProductRow>(
    `SELECT * FROM "tblProduct" WHERE "ProdID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getProductByCode(code: string): Promise<ProductRow | null> {
  return queryOne<ProductRow>(
    `SELECT * FROM "tblProduct" WHERE "ProductCode" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [code],
  );
}

export async function getProductByUuid(uuid: string): Promise<ProductRow | null> {
  return queryOne<ProductRow>(
    `SELECT * FROM "tblProduct" WHERE "ProdUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  );
}

export async function countProducts(): Promise<number> {
  return currentCount('tblProduct');
}

/* ---------------------------------------------------------------------------
 * Health Facility
 * ------------------------------------------------------------------------- */

export async function getHealthFacilityById(id: number): Promise<HealthFacilityRow | null> {
  return queryOne<HealthFacilityRow>(
    `SELECT * FROM "tblHF" WHERE "HfID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getHealthFacilityByCode(code: string): Promise<HealthFacilityRow | null> {
  return queryOne<HealthFacilityRow>(
    `SELECT * FROM "tblHF" WHERE "HFCode" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [code],
  );
}

export async function getHealthFacilityByUuid(uuid: string): Promise<HealthFacilityRow | null> {
  return queryOne<HealthFacilityRow>(
    `SELECT * FROM "tblHF" WHERE "HfUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  );
}

export async function countHealthFacilities(): Promise<number> {
  return currentCount('tblHF');
}

export async function countHealthFacilitiesByLevel(level: string): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblHF" WHERE "ValidityTo" IS NULL AND "HFLevel" = $1`,
    [level],
  );
}

/* ---------------------------------------------------------------------------
 * Location
 * ------------------------------------------------------------------------- */

export async function getLocationById(id: number): Promise<LocationRow | null> {
  return queryOne<LocationRow>(
    `SELECT * FROM "tblLocations" WHERE "LocationId" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [id],
  );
}

export async function getLocationByUuid(uuid: string): Promise<LocationRow | null> {
  return queryOne<LocationRow>(
    `SELECT * FROM "tblLocations" WHERE "LocationUUID" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [uuid],
  );
}

export async function countLocations(): Promise<number> {
  return currentCount('tblLocations');
}

export async function countLocationsByType(type: 'R' | 'D' | 'W' | 'V'): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "tblLocations" WHERE "ValidityTo" IS NULL AND "LocationType" = $1`,
    [type],
  );
}

/* ---------------------------------------------------------------------------
 * Users / Officers / Roles
 * ------------------------------------------------------------------------- */

export async function getUserByLoginName(login: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT * FROM "tblUsers" WHERE "LoginName" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [login],
  );
}

export async function countUsers(): Promise<number> {
  return currentCount('tblUsers');
}

export async function countOfficers(): Promise<number> {
  return currentCount('tblOfficer');
}

export async function countRoles(): Promise<number> {
  return currentCount('tblRole');
}

export async function getRoleByName(name: string): Promise<RoleRow | null> {
  return queryOne<RoleRow>(
    `SELECT * FROM "tblRole" WHERE "RoleName" = $1 AND "ValidityTo" IS NULL LIMIT 1`,
    [name],
  );
}

/* ---------------------------------------------------------------------------
 * Mutation Log (API audit trail)
 * ------------------------------------------------------------------------- */

export async function countMutationLogs(): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "core_Mutation_Log"`);
}

export async function countSuccessfulMutations(): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "core_Mutation_Log" WHERE status = 2`);
}

export async function countFailedMutations(): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "core_Mutation_Log" WHERE status = 1`);
}

export async function getMutationLogById(clientMutationId: string): Promise<MutationLogRow | null> {
  return queryOne<MutationLogRow>(
    `SELECT * FROM "core_Mutation_Log" WHERE "client_mutation_id" = $1 LIMIT 1`,
    [clientMutationId],
  );
}

export async function getRecentMutations(limit = 50): Promise<MutationLogRow[]> {
  return query<MutationLogRow>(
    `SELECT * FROM "core_Mutation_Log" ORDER BY "request_date_time" DESC LIMIT $1`,
    [limit],
  );
}

/* ---------------------------------------------------------------------------
 * Referential-integrity probes
 * ------------------------------------------------------------------------- */

/** Is there at least one policy linked to this family? */
export async function familyHasPolicy(familyId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblPolicy" WHERE "FamilyID" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [familyId],
  );
}

/** Is there at least one active insuree linked to this family? */
export async function familyHasInsurees(familyId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblInsuree" WHERE "FamilyID" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [familyId],
  );
}

/** Is there at least one claim linked to this insuree? */
export async function insureeHasClaims(insureeId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblClaim" WHERE "InsureeID" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [insureeId],
  );
}

/** Is there at least one premium linked to this policy? */
export async function policyHasPremiums(policyId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblPremium" WHERE "PolicyID" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [policyId],
  );
}

/** Is there at least one claim linked to this health facility? */
export async function healthFacilityHasClaims(hfId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblClaim" WHERE "HFID" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [hfId],
  );
}

/** Is there at least one claim linked to this product? */
export async function productHasPolicies(productId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblPolicy" WHERE "ProdID" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [productId],
  );
}

/** Is there at least one insuree-policy link for this policy? */
export async function policyHasInsurees(policyId: number): Promise<boolean> {
  return exists(
    `SELECT EXISTS(SELECT 1 FROM "tblInsureePolicy" WHERE "PolicyId" = $1 AND "ValidityTo" IS NULL) AS exists`,
    [policyId],
  );
}

/* ---------------------------------------------------------------------------
 * History (VersionedModel)
 * ------------------------------------------------------------------------- */

/** Count of historical versions of a row (ValidityTo IS NOT NULL). */
export async function historyCount(table: string, pkCol: string, pk: number): Promise<number> {
  return countRows(
    `SELECT COUNT(*)::int AS c FROM "${table}" WHERE "${pkCol}" = $1 AND "ValidityTo" IS NOT NULL`,
    [pk],
  );
}

/** Count rows with LegacyID set (the row has a predecessor). */
export async function legacyCount(table: string): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "${table}" WHERE "LegacyID" IS NOT NULL`);
}

/* ---------------------------------------------------------------------------
 * ICD / Items / Services (medical reference data)
 * ------------------------------------------------------------------------- */

export async function countDiagnoses(): Promise<number> {
  return countRows(`SELECT COUNT(*)::int AS c FROM "tblICDCodes"`);
}

export async function countMedicalItems(): Promise<number> {
  return currentCount('tblItems');
}

export async function countMedicalServices(): Promise<number> {
  return currentCount('tblServices');
}

/** Look up an ICD code by its code value. */
export async function getDiagnosisByCode(code: string): Promise<{ ICDID: number; ICDCode: string; ICDName: string } | null> {
  return queryOne<{ ICDID: number; ICDCode: string; ICDName: string }>(
    `SELECT "ICDID", "ICDCode", "ICDName" FROM "tblICDCodes" WHERE "ICDCode" = $1 LIMIT 1`,
    [code],
  );
}
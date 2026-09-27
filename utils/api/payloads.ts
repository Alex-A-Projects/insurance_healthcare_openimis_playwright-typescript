import { randomUUID } from 'crypto';

/**
 * Payload builders for the most common openIMIS mutations.
 *
 * Each builder returns the exact `input` object accepted by the GraphQL
 * mutation of the same name. UUIDs are generated fresh so consecutive
 * test runs don't collide on the shared demo database.
 *
 * The conventions (Django-style lookup suffixes, `clientMutationLabel`,
 * `clientMutationId`) mirror the openIMIS frontend. Mutations return
 * only `clientMutationId, internalId`; resolve the created UUID via the
 * `mutationLogs` query (`utils/api/graphqlClient.ts#waitForMutationLogs`).
 */

export function mutationLabel(label: string): { clientMutationId: string; clientMutationLabel: string } {
  return {
    clientMutationId: randomUUID(),
    clientMutationLabel: label,
  };
}

/* ---------------------------------------------------------------------------
 * Insuree
 * ------------------------------------------------------------------------- */

export function buildCreateInsuree(input: {
  chfId: string;
  lastName: string;
  otherNames: string;
  genderCode: string;
  dob: string;
  head?: boolean;
  marital?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  familyUuid?: string;
}): Record<string, unknown> {
  const base = mutationLabel('Create Insuree');
  return {
    ...base,
    chfId: input.chfId,
    lastName: input.lastName,
    otherNames: input.otherNames,
    genderCode: input.genderCode,
    dob: input.dob,
    head: input.head ?? false,
    marital: input.marital ?? '',
    phone: input.phone ?? '',
    email: input.email ?? '',
    currentAddress: input.currentAddress ?? '',
    familyUuid: input.familyUuid ?? null,
  };
}

export function buildUpdateInsuree(input: {
  uuid: string;
  chfId?: string;
  lastName?: string;
  otherNames?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  marital?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Insuree'),
    uuid: input.uuid,
    ...(input.chfId !== undefined ? { chfId: input.chfId } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.otherNames !== undefined ? { otherNames: input.otherNames } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.currentAddress !== undefined ? { currentAddress: input.currentAddress } : {}),
    ...(input.marital !== undefined ? { marital: input.marital } : {}),
  };
}

export function buildDeleteInsurees(uuids: string[], familyUuid?: string): Record<string, unknown> {
  return {
    ...mutationLabel('Delete Insurees'),
    uuids,
    ...(familyUuid ? { uuid: familyUuid } : {}),
  };
}

/* ---------------------------------------------------------------------------
 * Family
 * ------------------------------------------------------------------------- */

export function buildCreateFamily(input: {
  headInsuree: {
    chfId: string;
    lastName: string;
    otherNames: string;
    genderCode: string;
    dob: string;
  };
  locationId?: number;
  poverty?: boolean;
  address?: string;
  familyTypeId?: number;
  confirmationTypeId?: number;
  confirmationNo?: string;
}): Record<string, unknown> {
  const base = mutationLabel('Create Family');
  return {
    ...base,
    headInsuree: {
      ...base,
      chfId: input.headInsuree.chfId,
      lastName: input.headInsuree.lastName,
      otherNames: input.headInsuree.otherNames,
      genderCode: input.headInsuree.genderCode,
      dob: input.headInsuree.dob,
    },
    ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
    ...(input.poverty !== undefined ? { poverty: input.poverty } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.familyTypeId !== undefined ? { familyTypeId: input.familyTypeId } : {}),
    ...(input.confirmationTypeId !== undefined ? { confirmationTypeId: input.confirmationTypeId } : {}),
    ...(input.confirmationNo !== undefined ? { confirmationNo: input.confirmationNo } : {}),
  };
}

export function buildUpdateFamily(input: {
  uuid: string;
  poverty?: boolean;
  address?: string;
  confirmationNo?: string;
  locationId?: number;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Family'),
    uuid: input.uuid,
    ...(input.poverty !== undefined ? { poverty: input.poverty } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.confirmationNo !== undefined ? { confirmationNo: input.confirmationNo } : {}),
    ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
  };
}

export function buildDeleteFamilies(uuids: string[], deleteMembers = false): Record<string, unknown> {
  return {
    ...mutationLabel('Delete Families'),
    uuids,
    deleteMembers,
  };
}

/* ---------------------------------------------------------------------------
 * Policy
 * ------------------------------------------------------------------------- */

export function buildCreatePolicy(input: {
  productId: number | string;
  familyId: number | string;
  officerId: number | string;
  enrollDate: string;
  startDate: string;
  expiryDate: string;
  value: string | number;
  receipt?: string;
  isPaid?: boolean;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create Policy'),
    productId: input.productId,
    familyId: input.familyId,
    officerId: input.officerId,
    enrollDate: input.enrollDate,
    startDate: input.startDate,
    expiryDate: input.expiryDate,
    value: String(input.value),
    ...(input.receipt !== undefined ? { receipt: input.receipt } : {}),
    ...(input.isPaid !== undefined ? { isPaid: input.isPaid } : {}),
  };
}

export function buildUpdatePolicy(input: {
  uuid: string;
  productId?: number | string;
  officerId?: number | string;
  enrollDate?: string;
  startDate?: string;
  expiryDate?: string;
  value?: string | number;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Policy'),
    uuid: input.uuid,
    ...(input.productId !== undefined ? { productId: input.productId } : {}),
    ...(input.officerId !== undefined ? { officerId: input.officerId } : {}),
    ...(input.enrollDate !== undefined ? { enrollDate: input.enrollDate } : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
    ...(input.value !== undefined ? { value: String(input.value) } : {}),
  };
}

export function buildDeletePolicies(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Delete Policies'), uuids };
}

export function buildSuspendPolicies(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Suspend Policies'), uuids };
}

export function buildRenewPolicy(input: {
  uuid: string;
  productId: number | string;
  familyId: number | string;
  officerId: number | string;
  enrollDate: string;
  startDate: string;
  expiryDate: string;
  value: string | number;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Renew Policy'),
    uuid: input.uuid,
    productId: input.productId,
    familyId: input.familyId,
    officerId: input.officerId,
    enrollDate: input.enrollDate,
    startDate: input.startDate,
    expiryDate: input.expiryDate,
    value: String(input.value),
  };
}

/* ---------------------------------------------------------------------------
 * Claim
 * ------------------------------------------------------------------------- */

export function buildCreateClaim(input: {
  insureeId: number | string;
  adminId: number | string;
  healthFacilityId: number | string;
  icdId: number | string;
  dateFrom: string;
  dateClaimed: string;
  dateTo?: string;
  visitType?: string;
  careType?: string;
  claimed?: string | number;
  preAuthorization?: boolean;
  explanation?: string;
  patientCondition?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create Claim'),
    insureeId: input.insureeId,
    adminId: input.adminId,
    healthFacilityId: input.healthFacilityId,
    icdId: input.icdId,
    dateFrom: input.dateFrom,
    ...(input.dateTo ? { dateTo: input.dateTo } : {}),
    dateClaimed: input.dateClaimed,
    ...(input.visitType ? { visitType: input.visitType } : {}),
    ...(input.careType ? { careType: input.careType } : {}),
    ...(input.claimed !== undefined ? { claimed: String(input.claimed) } : {}),
    ...(input.preAuthorization !== undefined ? { preAuthorization: input.preAuthorization } : {}),
    ...(input.explanation ? { explanation: input.explanation } : {}),
    ...(input.patientCondition ? { patientCondition: input.patientCondition } : {}),
  };
}

export function buildUpdateClaim(input: {
  uuid: string;
  dateFrom?: string;
  dateTo?: string;
  explanation?: string;
  adjustment?: string;
  patientCondition?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Claim'),
    uuid: input.uuid,
    ...(input.dateFrom ? { dateFrom: input.dateFrom } : {}),
    ...(input.dateTo ? { dateTo: input.dateTo } : {}),
    ...(input.explanation ? { explanation: input.explanation } : {}),
    ...(input.adjustment ? { adjustment: input.adjustment } : {}),
    ...(input.patientCondition ? { patientCondition: input.patientCondition } : {}),
  };
}

export function buildSubmitClaims(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Submit Claims'), uuids };
}

export function buildDeleteClaims(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Delete Claims'), uuids };
}

export function buildSelectClaimsForFeedback(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Select Claims For Feedback'), uuids };
}

export function buildSkipClaimsFeedback(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Skip Claims Feedback'), uuids };
}

export function buildBypassClaimsFeedback(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Bypass Claims Feedback'), uuids };
}

export function buildSelectClaimsForReview(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Select Claims For Review'), uuids };
}

export function buildSkipClaimsReview(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Skip Claims Review'), uuids };
}

export function buildBypassClaimsReview(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Bypass Claims Review'), uuids };
}

export function buildDeliverClaimsReview(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Deliver Claims Review'), uuids };
}

export function buildProcessClaims(uuids: string[]): Record<string, unknown> {
  return { ...mutationLabel('Process Claims'), uuids };
}

export function buildDeliverClaimFeedback(input: {
  claimUuid: string;
  feedbackDate: string;
  officerId: number | string;
  careRendered?: boolean;
  paymentAsked?: boolean;
  drugPrescribed?: boolean;
  drugReceived?: boolean;
  asessment?: number;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Deliver Claim Feedback'),
    claimUuid: input.claimUuid,
    feedback: {
      feedbackDate: input.feedbackDate,
      officerId: input.officerId,
      careRendered: input.careRendered ?? true,
      paymentAsked: input.paymentAsked ?? true,
      drugPrescribed: input.drugPrescribed ?? true,
      drugReceived: input.drugReceived ?? true,
      asessment: input.asessment ?? 0,
    },
  };
}

/* ---------------------------------------------------------------------------
 * Premium / Contribution
 * ------------------------------------------------------------------------- */

export function buildCreatePremium(input: {
  policyUuid: string;
  receipt: string;
  payDate: string;
  amount: string | number;
  payType?: 'C' | 'B' | 'M';
  isPhotoFee?: boolean;
  payerUuid?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create Premium'),
    policyUuid: input.policyUuid,
    receipt: input.receipt,
    payDate: input.payDate,
    amount: String(input.amount),
    payType: input.payType ?? 'C',
    ...(input.isPhotoFee !== undefined ? { isPhotoFee: input.isPhotoFee } : {}),
    ...(input.payerUuid ? { payerUuid: input.payerUuid } : {}),
  };
}

export function buildUpdatePremium(input: {
  uuid: string;
  receipt?: string;
  payDate?: string;
  amount?: string | number;
  payType?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Premium'),
    uuid: input.uuid,
    ...(input.receipt ? { receipt: input.receipt } : {}),
    ...(input.payDate ? { payDate: input.payDate } : {}),
    ...(input.amount !== undefined ? { amount: String(input.amount) } : {}),
    ...(input.payType ? { payType: input.payType } : {}),
  };
}

export function buildDeletePremium(uuid: string): Record<string, unknown> {
  return { ...mutationLabel('Delete Premium'), uuids: [uuid] };
}

/* ---------------------------------------------------------------------------
 * Product
 * ------------------------------------------------------------------------- */

export function buildCreateProduct(input: {
  code: string;
  name: string;
  maxMembers?: number;
  ageMin?: number;
  ageMax?: number;
  dateFrom?: string;
  dateTo?: string;
  premiumAdult?: string;
  premiumChild?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create Product'),
    code: input.code,
    name: input.name,
    ...(input.maxMembers !== undefined ? { maxMembers: input.maxMembers } : {}),
    ...(input.ageMin !== undefined ? { ageMinimal: input.ageMin } : {}),
    ...(input.ageMax !== undefined ? { ageMaximal: input.ageMax } : {}),
    ...(input.dateFrom ? { dateFrom: input.dateFrom } : {}),
    ...(input.dateTo ? { dateTo: input.dateTo } : {}),
    ...(input.premiumAdult ? { premiumAdult: input.premiumAdult } : {}),
    ...(input.premiumChild ? { premiumChild: input.premiumChild } : {}),
  };
}

export function buildUpdateProduct(input: {
  uuid: string;
  name?: string;
  maxMembers?: number;
  ageMin?: number;
  ageMax?: number;
  premiumAdult?: string;
  premiumChild?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Product'),
    uuid: input.uuid,
    ...(input.name ? { name: input.name } : {}),
    ...(input.maxMembers !== undefined ? { maxMembers: input.maxMembers } : {}),
    ...(input.ageMin !== undefined ? { ageMinimal: input.ageMin } : {}),
    ...(input.ageMax !== undefined ? { ageMaximal: input.ageMax } : {}),
    ...(input.premiumAdult ? { premiumAdult: input.premiumAdult } : {}),
    ...(input.premiumChild ? { premiumChild: input.premiumChild } : {}),
  };
}

export function buildDeleteProduct(uuid: string): Record<string, unknown> {
  return { ...mutationLabel('Delete Product'), uuids: [uuid] };
}

export function buildDuplicateProduct(uuid: string): Record<string, unknown> {
  return { ...mutationLabel('Duplicate Product'), uuids: [uuid] };
}

/* ---------------------------------------------------------------------------
 * Health Facility
 * ------------------------------------------------------------------------- */

export function buildCreateHealthFacility(input: {
  code: string;
  name: string;
  level: string;
  careType: string;
  legalFormCode?: string;
  locationId: number | string;
  phone?: string;
  email?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create Health Facility'),
    code: input.code,
    name: input.name,
    level: input.level,
    careType: input.careType,
    ...(input.legalFormCode ? { legalFormId: input.legalFormCode } : {}),
    locationId: input.locationId,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.contractStartDate ? { contractStartDate: input.contractStartDate } : {}),
    ...(input.contractEndDate ? { contractEndDate: input.contractEndDate } : {}),
  };
}

export function buildUpdateHealthFacility(input: {
  uuid: string;
  name?: string;
  level?: string;
  careType?: string;
  phone?: string;
  email?: string;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Health Facility'),
    uuid: input.uuid,
    ...(input.name ? { name: input.name } : {}),
    ...(input.level ? { level: input.level } : {}),
    ...(input.careType ? { careType: input.careType } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.email ? { email: input.email } : {}),
  };
}

export function buildDeleteHealthFacility(uuid: string): Record<string, unknown> {
  return { ...mutationLabel('Delete Health Facility'), uuid };
}

/* ---------------------------------------------------------------------------
 * Location
 * ------------------------------------------------------------------------- */

export function buildCreateLocation(input: {
  code: string;
  name: string;
  type: 'R' | 'D' | 'W' | 'V';
  parentUuid?: string;
  malePopulation?: number;
  femalePopulation?: number;
  otherPopulation?: number;
  families?: number;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create Location'),
    code: input.code,
    name: input.name,
    type: input.type,
    ...(input.parentUuid ? { parentUuid: input.parentUuid } : {}),
    ...(input.malePopulation !== undefined ? { malePopulation: input.malePopulation } : {}),
    ...(input.femalePopulation !== undefined ? { femalePopulation: input.femalePopulation } : {}),
    ...(input.otherPopulation !== undefined ? { otherPopulation: input.otherPopulation } : {}),
    ...(input.families !== undefined ? { families: input.families } : {}),
  };
}

export function buildUpdateLocation(input: {
  uuid: string;
  name?: string;
  malePopulation?: number;
  femalePopulation?: number;
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update Location'),
    uuid: input.uuid,
    ...(input.name ? { name: input.name } : {}),
    ...(input.malePopulation !== undefined ? { malePopulation: input.malePopulation } : {}),
    ...(input.femalePopulation !== undefined ? { femalePopulation: input.femalePopulation } : {}),
  };
}

export function buildDeleteLocation(uuid: string, code: string, newParentUuid?: string): Record<string, unknown> {
  return {
    ...mutationLabel('Delete Location'),
    uuid,
    code,
    ...(newParentUuid ? { newParentUuid } : {}),
  };
}

/* ---------------------------------------------------------------------------
 * User
 * ------------------------------------------------------------------------- */

export function buildCreateUser(input: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles?: string[];
}): Record<string, unknown> {
  return {
    ...mutationLabel('Create User'),
    username: input.username,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    password: input.password,
    ...(input.roles && input.roles.length ? { roles: input.roles } : {}),
  };
}

export function buildUpdateUser(input: {
  uuid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: string[];
}): Record<string, unknown> {
  return {
    ...mutationLabel('Update User'),
    uuid: input.uuid,
    ...(input.email ? { email: input.email } : {}),
    ...(input.firstName ? { firstName: input.firstName } : {}),
    ...(input.lastName ? { lastName: input.lastName } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.roles && input.roles.length ? { roles: input.roles } : {}),
  };
}

export function buildDeleteUser(uuid: string): Record<string, unknown> {
  return { ...mutationLabel('Delete User'), uuids: [uuid] };
}
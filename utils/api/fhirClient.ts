import { APIRequestContext } from '@playwright/test';
import { fhirBaseURL } from '../helpers';
import { AuthResult } from './auth';
import { buildHeaders } from './graphqlClient';

/**
 * FHIR R4 client for the openIMIS FHIR module
 * (`openimis-be-api_fhir_r4_py`).
 *
 * The FHIR module exposes the standard HL7 R4 REST API at `/api/fhir/*`.
 * Each resource (Patient, Group, Coverage, Claim, …) accepts the usual
 * FHIR search parameters (`_id`, `identifier`, `name`, `birthdate`, …).
 *
 * Auth is the same `Authorization: JWT <token>` header used everywhere
 * else; CSRF is not required for FHIR reads.
 *
 * Resource inventory (the most-used subset):
 *
 *   - Patient        → insuree
 *   - Group          → family (via `Group.member` referencing insurees)
 *   - Contract       → policy
 *   - Coverage       → active coverage for an insuree
 *   - CoverageEligibilityRequest → enquiry
 *   - Claim          → medical claim
 *   - ClaimResponse  → adjudication result
 *   - Practitioner   → claim admin / officer
 *   - Organization   → health facility
 *   - Location       → region / district / ward / village
 *   - InsurancePlan  → product
 *   - ActivityDefinition, Medication, CodeSystem, ValueSet → reference data
 */

export interface FhirBundle<T = Record<string, unknown>> {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{ fullUrl?: string; resource: T }>;
}

export interface FhirOperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{ severity: string; code: string; diagnostics?: string }>;
}

export function fhirUrl(path = ''): string {
  return `${fhirBaseURL()}${path.startsWith('/') ? path : '/' + path}`;
}

function fhirHeaders(auth: AuthResult | null): Record<string, string> {
  return buildHeaders(auth, false, {
    Accept: 'application/fhir+json',
  });
}

export async function fhirGet<T = Record<string, unknown>>(
  ctx: APIRequestContext,
  resourcePath: string,
  auth: AuthResult | null,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(fhirUrl(resourcePath));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await ctx.get(url.toString(), { headers: fhirHeaders(auth) });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`FHIR GET ${resourcePath} failed: ${res.status()} — ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function fhirPost<T = Record<string, unknown>>(
  ctx: APIRequestContext,
  resourcePath: string,
  auth: AuthResult | null,
  body: Record<string, unknown>,
): Promise<T> {
  const url = fhirUrl(resourcePath);
  const res = await ctx.post(url, {
    headers: fhirHeaders(auth),
    data: body,
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`FHIR POST ${resourcePath} failed: ${res.status()} — ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function fhirPut<T = Record<string, unknown>>(
  ctx: APIRequestContext,
  resourcePath: string,
  auth: AuthResult | null,
  body: Record<string, unknown>,
): Promise<T> {
  const url = fhirUrl(resourcePath);
  const res = await ctx.put(url, {
    headers: fhirHeaders(auth),
    data: body,
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`FHIR PUT ${resourcePath} failed: ${res.status()} — ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function fhirDelete(
  ctx: APIRequestContext,
  resourcePath: string,
  auth: AuthResult | null,
): Promise<boolean> {
  const url = fhirUrl(resourcePath);
  const res = await ctx.delete(url, { headers: fhirHeaders(auth) });
  return res.ok();
}

/* ---------------------------------------------------------------------------
 * Convenience wrappers
 * ------------------------------------------------------------------------- */

export async function searchPatients(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { identifier?: string; family?: string; given?: string; birthdate?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'Patient', auth, params);
}

export async function getPatientById(
  ctx: APIRequestContext,
  auth: AuthResult,
  fhirId: string,
): Promise<Record<string, unknown>> {
  return fhirGet(ctx, `Patient/${encodeURIComponent(fhirId)}`, auth);
}

export async function createPatient(
  ctx: APIRequestContext,
  auth: AuthResult,
  patient: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return fhirPost(ctx, 'Patient', auth, patient);
}

export async function searchCoverage(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { patient?: string; beneficiary?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'Coverage', auth, params);
}

export async function createCoverage(
  ctx: APIRequestContext,
  auth: AuthResult,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return fhirPost(ctx, 'Coverage', auth, body);
}

export async function searchClaims(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { patient?: string; status?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'Claim', auth, params);
}

export async function createClaim(
  ctx: APIRequestContext,
  auth: AuthResult,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return fhirPost(ctx, 'Claim', auth, body);
}

export async function searchOrganizations(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { name?: string; identifier?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'Organization', auth, params);
}

export async function searchLocations(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { name?: string; addressCountry?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'Location', auth, params);
}

export async function searchPractitioners(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { family?: string; given?: string; identifier?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'Practitioner', auth, params);
}

export async function searchInsurancePlans(
  ctx: APIRequestContext,
  auth: AuthResult,
  params: { name?: string; identifier?: string } = {},
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'InsurancePlan', auth, params);
}

export async function searchCodeSystems(
  ctx: APIRequestContext,
  auth: AuthResult,
  url: string,
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'CodeSystem', auth, { url });
}

export async function searchValueSets(
  ctx: APIRequestContext,
  auth: AuthResult,
  url: string,
): Promise<FhirBundle> {
  return fhirGet<FhirBundle>(ctx, 'ValueSet', auth, { url });
}

export async function eligibilityRequest(
  ctx: APIRequestContext,
  auth: AuthResult,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return fhirPost(ctx, 'CoverageEligibilityRequest', auth, body);
}
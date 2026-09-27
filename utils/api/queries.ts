/**
 * Centralised catalogue of openIMIS GraphQL operations.
 *
 * Every operation here is the literal string sent to `/api/graphql`. The
 * operations were transcribed from the openIMIS frontend modules
 * (`openimis-fe-*_js`, branch `develop`) and the backend schema files
 * (`openimis-be-*_py`, branch `develop`).
 *
 * Operations are organised by domain entity and exposed as exported string
 * constants so tests can `import { QUERY_INSURANCES_PAGE } from
 * '../utils/api/queries'`. The wrappers in `graphqlClient.ts` add the
 * `Authorization: JWT <token>` header and CSRF handling — these raw strings
 * are deliberately inert.
 */

/* ---------------------------------------------------------------------------
 * Authentication
 * ------------------------------------------------------------------------- */

export const MUTATION_TOKEN_AUTH = `mutation authenticate($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    refreshExpiresIn
    payload
    token
  }
}`;

export const MUTATION_REFRESH_TOKEN = `mutation { refreshToken { token refreshExpiresIn } }`;

export const MUTATION_VERIFY_TOKEN = `mutation { verifyToken { payload } }`;

export const MUTATION_DELETE_TOKEN_COOKIES = `mutation {
  deleteTokenCookie { deleted }
  deleteRefreshTokenCookie { deleted }
}`;

/* ---------------------------------------------------------------------------
 * Current user probe
 * ------------------------------------------------------------------------- */

export const QUERY_CURRENT_USER = `query {
  user { username email }
}`;

/* ---------------------------------------------------------------------------
 * Insuree
 * ------------------------------------------------------------------------- */

export const QUERY_INSURANCES_PAGE = `
query GetInsurees($first: Int, $after: String, $search: String, $showHistory: Boolean) {
  insurees(first: $first, after: $after, search: $search, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges {
      cursor
      node {
        id uuid chfId lastName otherNames dob age
        gender { code gender altLanguage }
        phone email currentAddress
        status statusDate statusReason { code insureeStatusReason }
        head marital cardIssued
        validityFrom validityTo
        family { id uuid poverty familyType { code } headInsuree { id uuid chfId lastName otherNames } location { id uuid code name type } }
        currentVillage { id uuid code name type parent { id uuid code name } }
        healthFacility { id uuid code name level }
      }
    }
  }
}`;

export const QUERY_INSURANCE_BY_UUID = `
query GetInsuree($uuid: String!) {
  insurees(uuid: $uuid, showHistory: true) {
    edges { node {
      id uuid chfId lastName otherNames dob age phone email currentAddress
      gender { code gender altLanguage } marital cardIssued
      status statusDate statusReason { code insureeStatusReason }
      validityFrom validityTo
      family { id uuid poverty address familyType { code } confirmationType { code } confirmationNo headInsuree { id uuid chfId lastName otherNames dob phone email } location { id uuid code name type parent { id uuid code name } } }
      currentVillage { id uuid code name type parent { id uuid code name } }
      healthFacility { id uuid code name level careType }
      photo { id uuid date folder filename photo officerId }
      profession { id code profession } education { id code education }
      typeOfId { code identificationType }
      relationship { id code relation }
    } }
  }
}`;

export const QUERY_INSURANCE_BY_CHFID = `
query GetInsureeByChfId($chfId: String!) {
  insurees(chfId: $chfId, ignoreLocation: true) {
    edges { node { id uuid chfId lastName otherNames dob age status family { id uuid headInsuree { chfId } } } }
  }
}`;

export const MUTATION_CREATE_INSURANCE = `
mutation CreateInsuree($input: CreateInsureeMutationInput!) {
  createInsuree(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_INSURANCE = `
mutation UpdateInsuree($input: UpdateInsureeMutationInput!) {
  updateInsuree(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_INSURANCES = `
mutation DeleteInsurees($input: DeleteInsureesMutationInput!) {
  deleteInsurees(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_REMOVE_INSURANCES_FROM_FAMILY = `
mutation RemoveInsurees($input: RemoveInsureesMutationInput!) {
  removeInsurees(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SET_FAMILY_HEAD = `
mutation SetFamilyHead($input: SetFamilyHeadMutationInput!) {
  setFamilyHead(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_CHANGE_INSURANCE_FAMILY = `
mutation ChangeInsureeFamily($input: ChangeInsureeFamilyMutationInput!) {
  changeInsureeFamily(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * Family
 * ------------------------------------------------------------------------- */

export const QUERY_FAMILIES_PAGE = `
query GetFamilies($first: Int, $after: String, $search: String, $showHistory: Boolean) {
  families(first: $first, after: $after, search: $search, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      id uuid poverty address confirmationNo
      familyType { code familyType }
      confirmationType { code confirmationType }
      headInsuree { id uuid chfId lastName otherNames dob phone email }
      location { id uuid code name type parent { id uuid code name } }
      validityFrom validityTo
    } }
  }
}`;

export const QUERY_FAMILY_BY_UUID = `
query GetFamily($uuid: String) {
  families(uuid: $uuid, showHistory: true) {
    edges { node {
      id uuid poverty address confirmationNo
      familyType { code familyType }
      confirmationType { code confirmationType }
      parent { id uuid code name }
      headInsuree { id uuid chfId lastName otherNames dob phone email status }
      location { id uuid code name type parent { id uuid code name } }
      members { edges { node { id uuid chfId lastName otherNames dob gender { code } relationship { code } head } } }
      validityFrom validityTo
    } }
  }
}`;

export const MUTATION_CREATE_FAMILY = `
mutation CreateFamily($input: CreateFamilyMutationInput!) {
  createFamily(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_FAMILY = `
mutation UpdateFamily($input: UpdateFamilyMutationInput!) {
  updateFamily(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_FAMILIES = `
mutation DeleteFamilies($input: DeleteFamiliesMutationInput!) {
  deleteFamilies(input: $input) {
    clientMutationId internalId
  }
}`;

export const QUERY_FAMILY_MEMBERS = `
query GetFamilyMembers($family_Uuid: String!) {
  familyMembers(family_Uuid: $family_Uuid) {
    edges { node {
      id uuid chfId lastName otherNames dob phone gender { code } head cardIssued relationship { code }
    } }
  }
}`;

export const QUERY_CAN_ADD_INSURANCE = `query CanAdd($familyId: Int!) { canAddInsuree(familyId: $familyId) }`;

/* ---------------------------------------------------------------------------
 * Policy
 * ------------------------------------------------------------------------- */

export const QUERY_POLICIES_PAGE = `
query GetPolicies($first: Int, $after: String, $showHistory: Boolean) {
  policies(first: $first, after: $after, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      uuid stage status enrollDate effectiveDate startDate expiryDate value sumPremiums
      product { id uuid code name }
      officer { id uuid code lastName otherNames }
      family { id uuid headInsuree { uuid chfId lastName otherNames } }
    } }
  }
}`;

export const QUERY_POLICY_BY_UUID = `
query GetPolicy($uuid: String!) {
  policies(uuid: $uuid, showHistory: true) {
    edges { node {
      uuid stage status enrollDate effectiveDate startDate expiryDate value sumPremiums
      product { id uuid code name }
      officer { id uuid code lastName otherNames }
      family { id uuid headInsuree { uuid chfId lastName otherNames } location { id uuid code name } }
      claimDedRems { edges { node { dedG dedIp dedOp remG remIp remOp } } }
      validityFrom validityTo
    } }
  }
}`;

export const QUERY_POLICIES_BY_INSURANCE = `
query PoliciesByInsuree($insureeId: Int!) {
  policiesByInsuree(insureeId: $insureeId) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { node {
      policyUuid productCode productName officerCode officerName
      enrollDate effectiveDate startDate expiryDate status policyValue balance
      ded dedInPatient dedOutPatient ceiling ceilingInPatient ceilingOutPatient
    } }
  }
}`;

export const QUERY_POLICIES_BY_FAMILY = `
query PoliciesByFamily($familyId: Int!) {
  policiesByFamily(familyId: $familyId) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { node {
      policyUuid productCode productName officerCode officerName
      enrollDate effectiveDate startDate expiryDate status policyValue balance
      ded dedInPatient dedOutPatient ceiling ceilingInPatient ceilingOutPatient
    } }
  }
}`;

export const QUERY_POLICY_VALUES = `
query PolicyValues($stage: String!, $enrollDate: Date!, $productId: Int!, $familyId: Int!, $prevUuid: String) {
  policyValues(stage: $stage, enrollDate: $enrollDate, productId: $productId, familyId: $familyId, prevUuid: $prevUuid) {
    policy { startDate expiryDate value }
    warnings
  }
}`;

export const MUTATION_CREATE_POLICY = `
mutation CreatePolicy($input: CreatePolicyMutationInput!) {
  createPolicy(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_POLICY = `
mutation UpdatePolicy($input: UpdatePolicyMutationInput!) {
  updatePolicy(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_POLICIES = `
mutation DeletePolicies($input: DeletePoliciesMutationInput!) {
  deletePolicies(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SUSPEND_POLICIES = `
mutation SuspendPolicies($input: SuspendPoliciesMutationInput!) {
  suspendPolicies(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_RENEW_POLICY = `
mutation RenewPolicy($input: RenewPolicyMutationInput!) {
  renewPolicy(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * Claim
 * ------------------------------------------------------------------------- */

export const QUERY_CLAIMS_PAGE = `
query GetClaims($first: Int, $after: String, $status: Int, $showHistory: Boolean) {
  claims(first: $first, after: $after, status: $status, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      uuid code dateClaimed dateProcessed feedbackStatus reviewStatus claimed approved
      status restoreId attachmentsCount
      healthFacility { id uuid name code }
      insuree { id uuid chfId lastName otherNames dob }
    } }
  }
}`;

export const QUERY_CLAIM_BY_UUID = `
query GetClaim($uuid: String!) {
  claim(uuid: $uuid) {
    uuid code dateFrom dateTo dateClaimed claimed approved valuated status
    feedbackStatus reviewStatus guaranteeId explanation adjustment
    attachmentsCount careType preAuthorization
    healthFacility { id uuid code name }
    referFrom { id uuid code name } referTo { id uuid code name }
    insuree { id uuid chfId lastName otherNames dob }
    visitType { code visitType } admin { id uuid code lastName otherNames }
    icd { code name } icd1 { code } icd2 { code } icd3 { code } icd4 { code }
    patientCondition referralCode restore { uuid code }
    services { id serviceId qtyProvided priceAsked qtyApproved priceApproved priceValuated priceAdjusted status explanation justification rejectionReason service { id code name price } }
    items { id itemId qtyProvided priceAsked qtyApproved priceApproved priceValuated priceAdjusted status explanation justification rejectionReason item { id code name price } }
    feedback { id careRendered paymentAsked drugPrescribed drugReceived asessment feedbackDate officerId }
  }
}`;

export const MUTATION_CREATE_CLAIM = `
mutation CreateClaim($input: CreateClaimMutationInput!) {
  createClaim(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_CLAIM = `
mutation UpdateClaim($input: UpdateClaimMutationInput!) {
  updateClaim(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SUBMIT_CLAIMS = `
mutation SubmitClaims($input: SubmitClaimsMutationInput!) {
  submitClaims(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_CLAIMS = `
mutation DeleteClaims($input: DeleteClaimsMutationInput!) {
  deleteClaims(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SELECT_CLAIMS_FOR_FEEDBACK = `
mutation SelectClaimsForFeedback($input: SelectClaimsForFeedbackMutationInput!) {
  selectClaimsForFeedback(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SKIP_CLAIMS_FEEDBACK = `
mutation SkipClaimsFeedback($input: SkipClaimsFeedbackMutationInput!) {
  skipClaimsFeedback(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_BYPASS_CLAIMS_FEEDBACK = `
mutation BypassClaimsFeedback($input: BypassClaimsFeedbackMutationInput!) {
  bypassClaimsFeedback(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SELECT_CLAIMS_FOR_REVIEW = `
mutation SelectClaimsForReview($input: SelectClaimsForReviewMutationInput!) {
  selectClaimsForReview(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SKIP_CLAIMS_REVIEW = `
mutation SkipClaimsReview($input: SkipClaimsReviewMutationInput!) {
  skipClaimsReview(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_BYPASS_CLAIMS_REVIEW = `
mutation BypassClaimsReview($input: BypassClaimsReviewMutationInput!) {
  bypassClaimsReview(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_SAVE_CLAIMS_REVIEW = `
mutation SaveClaimsReview($input: SaveClaimsReviewMutationInput!) {
  saveClaimsReview(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELIVER_CLAIMS_REVIEW = `
mutation DeliverClaimsReview($input: DeliverClaimsReviewMutationInput!) {
  deliverClaimsReview(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELIVER_CLAIM_FEEDBACK = `
mutation DeliverClaimFeedback($input: DeliverClaimFeedbackMutationInput!) {
  deliverClaimFeedback(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_PROCESS_CLAIMS = `
mutation ProcessClaims($input: ProcessClaimsMutationInput!) {
  processClaims(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * Premium / Contribution
 * ------------------------------------------------------------------------- */

export const QUERY_PREMIUMS_PAGE = `
query GetPremiums($first: Int, $after: String, $showHistory: Boolean) {
  premiums(first: $first, after: $after, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      uuid amount payDate payType receipt isPhotoFee validityFrom validityTo
      payer { id uuid code lastName otherNames }
      policy { uuid product { code name } family { uuid headInsuree { chfId lastName otherNames } } }
    } }
  }
}`;

export const QUERY_PREMIUM_BY_POLICY = `
query GetPremiumsByPolicy($uuid: String!) {
  premiumsByPolicies(uuid: $uuid) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { node {
      uuid amount payDate payType receipt isPhotoFee
      payer { id uuid code lastName otherNames }
    } }
  }
}`;

export const MUTATION_CREATE_PREMIUM = `
mutation CreatePremium($input: CreatePremiumMutationInput!) {
  createPremium(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_PREMIUM = `
mutation UpdatePremium($input: UpdatePremiumMutationInput!) {
  updatePremium(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_PREMIUM = `
mutation DeletePremium($input: DeletePremiumMutationInput!) {
  deletePremium(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * Product
 * ------------------------------------------------------------------------- */

export const QUERY_PRODUCTS_PAGE = `
query GetProducts($first: Int, $after: String, $showHistory: Boolean) {
  products(first: $first, after: $after, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      id uuid code name maxMembers ageMinimal ageMaximal
      dateFrom dateTo premiumAdult premiumChild
      location { id uuid code name } validityFrom validityTo
    } }
  }
}`;

export const QUERY_PRODUCT_BY_UUID = `
query GetProduct($uuid: String!) {
  product(uuid: $uuid) {
    id uuid code name maxMembers ageMinimal ageMaximal
    dateFrom dateTo premiumAdult premiumChild
    location { id uuid code name }
    threshold recurrence insurancePeriod lumpSum
    maxInstallments registrationLumpSum registrationFee
    generalAssemblyLumpSum generalAssemblyFee
    ceiling ceilingInPatient ceilingOutPatient
    deductible deductibleInPatient deductibleOutPatient
    maxNoConsultation maxNoSurgery maxNoDelivery maxNoHospitalization maxNoVisits maxNoAntenatal
    maxAmountConsultation maxAmountSurgery maxAmountDelivery maxAmountHospitalization maxAmountAntenatal
    validityFrom validityTo
  }
}`;

export const MUTATION_CREATE_PRODUCT = `
mutation CreateProduct($input: CreateProductMutationInput!) {
  createProduct(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_PRODUCT = `
mutation UpdateProduct($input: UpdateProductMutationInput!) {
  updateProduct(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_PRODUCT = `
mutation DeleteProduct($input: DeleteProductMutationInput!) {
  deleteProduct(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DUPLICATE_PRODUCT = `
mutation DuplicateProduct($input: DuplicateProductMutationInput!) {
  duplicateProduct(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * Location & Health Facility
 * ------------------------------------------------------------------------- */

export const QUERY_LOCATIONS_PAGE = `
query GetLocations($first: Int, $after: String, $type: String, $showHistory: Boolean) {
  locations(first: $first, after: $after, type: $type, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      id uuid code name type malePopulation femalePopulation otherPopulation families
      parent { id uuid code name type parent { id uuid code name } }
      validityFrom validityTo
    } }
  }
}`;

export const QUERY_ALL_REGIONS = `
query GetAllRegions {
  locations(type: "R") {
    edges { node { id uuid code name } }
  }
}`;

export const QUERY_HEALTH_FACILITIES_PAGE = `
query GetHealthFacilities($first: Int, $after: String, $showHistory: Boolean) {
  healthFacilities(first: $first, after: $after, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      id uuid code name level careType phone fax email accCode
      legalForm { code legalForm } subLevel { code healthFacilitySubLevel }
      location { id uuid code name parent { id uuid code name } }
      servicesPricelist { id uuid name }
      itemsPricelist { id uuid name }
      contractStartDate contractEndDate status
      validityFrom validityTo
    } }
  }
}`;

export const QUERY_HEALTH_FACILITY_BY_UUID = `
query GetHealthFacility($uuid: String) {
  healthFacilities(uuid: $uuid, showHistory: true) {
    edges { node {
      id uuid code name level careType phone fax email accCode
      legalForm { code legalForm } subLevel { code healthFacilitySubLevel }
      location { id uuid code name parent { id uuid code name } }
      servicesPricelist { id uuid name } itemsPricelist { id uuid name }
      catchments { id catchment location { id uuid code name } }
      contractStartDate contractEndDate status validityFrom validityTo
    } }
  }
}`;

export const MUTATION_CREATE_HEALTH_FACILITY = `
mutation CreateHealthFacility($input: CreateHealthFacilityMutationInput!) {
  createHealthFacility(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_HEALTH_FACILITY = `
mutation UpdateHealthFacility($input: UpdateHealthFacilityMutationInput!) {
  updateHealthFacility(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_HEALTH_FACILITY = `
mutation DeleteHealthFacility($input: DeleteHealthFacilityMutationInput!) {
  deleteHealthFacility(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_CREATE_LOCATION = `
mutation CreateLocation($input: CreateLocationMutationInput!) {
  createLocation(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_LOCATION = `
mutation UpdateLocation($input: UpdateLocationMutationInput!) {
  updateLocation(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_LOCATION = `
mutation DeleteLocation($input: DeleteLocationMutationInput!) {
  deleteLocation(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_MOVE_LOCATION = `
mutation MoveLocation($input: MoveLocationMutationInput!) {
  moveLocation(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * User / role administration
 * ------------------------------------------------------------------------- */

export const QUERY_USERS_PAGE = `
query GetUsers($first: Int, $after: String, $showHistory: Boolean) {
  users(first: $first, after: $after, showHistory: $showHistory) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node {
      id username email firstName lastName isActive dateJoined lastLogin
      iUser { id uuid code lastName otherNames phone email dob gender { code } }
      roles { id name } rights { edges { node { id rightId description } } }
    } }
  }
}`;

export const QUERY_USER_BY_USERNAME = `
query GetUser($username: String!) {
  users(username: $username, showHistory: true) {
    edges { node {
      id username email firstName lastName isActive
      iUser { id uuid code lastName otherNames phone email dob gender { code } }
      roles { id name }
    } }
  }
}`;

export const QUERY_ROLES_PAGE = `
query GetRoles($first: Int, $after: String) {
  roles(first: $first, after: $after) {
    totalCount
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    edges { cursor node { id name isSystem assignedToUsers { id username } } }
  }
}`;

export const MUTATION_CREATE_USER = `
mutation CreateUser($input: CreateUserMutationInput!) {
  createUser(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_UPDATE_USER = `
mutation UpdateUser($input: UpdateUserMutationInput!) {
  updateUser(input: $input) {
    clientMutationId internalId
  }
}`;

export const MUTATION_DELETE_USER = `
mutation DeleteUser($input: DeleteUserMutationInput!) {
  deleteUser(input: $input) {
    clientMutationId internalId
  }
}`;

/* ---------------------------------------------------------------------------
 * Medical reference data
 * ------------------------------------------------------------------------- */

export const QUERY_DIAGNOSES = `
query GetDiagnoses($search: String, $first: Int) {
  diagnoses(search: $search, first: $first) {
    edges { node { id code name } }
  }
}`;

export const QUERY_MEDICAL_SERVICES = `
query GetMedicalServices($search: String, $first: Int) {
  medicalServices(search: $search, first: $first) {
    edges { node { id code name price maximumAmount packagetype } }
  }
}`;

export const QUERY_MEDICAL_ITEMS = `
query GetMedicalItems($search: String, $first: Int) {
  medicalItems(search: $search, first: $first) {
    edges { node { id code name price maximumAmount } }
  }
}`;

export const QUERY_GENDERS = `query { genders { edges { node { code gender altLanguage } } } }`;
export const QUERY_IDENTIFICATION_TYPES = `query { identificationTypes { edges { node { code identificationType } } } }`;
export const QUERY_EDUCATIONS = `query { educations { edges { node { id code education } } } }`;
export const QUERY_PROFESSIONS = `query { professions { edges { node { id code profession } } } }`;
export const QUERY_FAMILY_TYPES = `query { familyTypes { edges { node { code familyType } } } }`;
export const QUERY_CONFIRMATION_TYPES = `query { confirmationTypes { edges { node { code confirmationType isConfirmationNumberRequired } } } }`;
export const QUERY_RELATIONS = `query { relations { edges { node { id code relation } } } }`;
export const QUERY_VISIT_TYPES = `query { visitTypes { edges { node { code visitType } } } }`;
export const QUERY_CLAIM_ADMINS = `query { claimAdmins { edges { node { id uuid code lastName otherNames phone email } } } }`;
export const QUERY_ENROLMENT_OFFICERS = `query { enrolmentOfficers { edges { node { id uuid code lastName otherNames } } } }`;
export const QUERY_PAYER_TYPES = `query { payerTypes { edges { node { id code payerType } } } }`;

/* ---------------------------------------------------------------------------
 * Mutation logs (resolve clientMutationId -> created UUIDs)
 * ------------------------------------------------------------------------- */

export const QUERY_MUTATION_LOGS = `
query GetMutationLogs($clientMutationId: String!) {
  mutationLogs(clientMutationId: $clientMutationId) {
    edges { node {
      id status
      insurees { insuree { uuid } family { uuid } }
      policies { policy { uuid } family { uuid } }
      claims { claim { uuid } }
      premiums { premium { uuid } }
      users { user { username } }
    } }
  }
}`;
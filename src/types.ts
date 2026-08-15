export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: PaginationMeta;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface Customer {
  id: string;
  externalCode: string | null;
  legalName: string;
  displayName: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  globalSuspension: boolean;
  globalSuspensionReason: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  code: string;
  name: string;
  description: string | null;
  modules: Record<string, unknown>[];
  status: string;
  createdAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface Plan {
  id: string;
  applicationId: string;
  code: string;
  name: string;
  description: string | null;
  price: string;
  currencyId: string;
  currencyCode: string;
  frequency: string;
  gracePeriodDays: number;
  suspensionAfterDueDays: number;
  penaltyType: string;
  penaltyValue: string;
  status: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  applicationId: string;
  applicationCode: string;
  applicationName: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string | null;
  nextBillingDate: string;
  billingDay: number;
  status: string;
  autoRenew: boolean;
  administrativeSuspension: boolean;
  administrativeSuspensionReason: string | null;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  applicationCode: string;
  invoiceNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  issueDate: string;
  dueDate: string;
  currencyCode: string;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  currencyId: string;
  currencyCode: string;
  amount: string;
  unappliedAmount: string;
  status: string;
  paidAt: string | null;
  receivedAt: string;
  notes: string | null;
}

export interface PenaltyRule {
  id: string;
  code: string;
  name: string;
  penaltyType: string;
  penaltyValue: string;
  status: string;
}

export interface Penalty {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  penaltyRuleId: string;
  penaltyRuleName: string;
  amount: string;
  status: string;
  appliedAt: string;
}

export interface SubscriptionExtension {
  id: string;
  subscriptionId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  customerId: string;
  customerName: string;
  originalDueDate: string;
  extendedDueDate: string;
  reason: string;
  status: string;
}

export interface EntitlementResult {
  allowed: boolean;
  customerId: string;
  applicationCode: string;
  applicationId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  validUntil: string | null;
  reason: string | null;
  gracePeriodEnd: string | null;
  outstandingBalance: string | null;
  daysOverdue: number;
  warningCode: string | null;
  allowedModules: string[];
  blockedModules: string[];
}

export interface ServiceToken {
  id: string;
  applicationId: string | null;
  applicationCode: string | null;
  applicationName: string | null;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  status: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedServiceToken {
  token: string;
  serviceToken: ServiceToken;
}

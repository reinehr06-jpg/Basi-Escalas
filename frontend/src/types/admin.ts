export type PeriodFilter =
  | "today"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "3m"
  | "12m"
  | "custom";

export type MessagePeriodFilter = "today" | "7d" | "30d" | "all";

export type ChurchStatus =
  | "active"
  | "inactive"
  | "trial"
  | "overdue"
  | "cancelled";

export interface AdminKpis {
  // Clients
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  trialAccounts: number;
  overdueAccounts: number;
  newAccountsPeriod: number;
  accountsGrowthPerc: number;

  // Revenue
  monthRevenue: number;
  netRevenue: number;
  recurringRevenue: number; // MRR
  revenueGrowthPerc: number;
  revenueByPlan: {
    plan: string;
    revenue: number;
    clients: number;
    averageTicket: number;
    color: string;
  }[];

  // Churn
  monthlyChurn: number;
  last3MonthsChurn: number;
  last12MonthsChurn: number;
  cancelledClients: number;
  churnGrowthPerc: number;

  // Messages
  messages: {
    period: MessagePeriodFilter;
    sent: number;
    received: number;
    automatic: number;
    manual: number;
    totalProcessed: number;
  };
}

export interface ChurchAccount {
  id: string;
  name: string;
  document?: string;
  email: string;
  phone: string;
  pastor: string;
  planId: string;
  planName: string;
  monthlyValue: number;
  status: ChurchStatus;
  registrationDate: string;
  lastAccess: string;
  daysWithoutAccess: number;
  timeAsClient: string;
  address?: {
    city: string;
    state: string;
  };
  usage: {
    messagesSent: number;
    messagesReceived: number;
    totalMembers: number;
    totalUsers: number;
    totalBranches: number;
    storageGb: number;
    storageLimitGb: number;
    activeIntegrations: string[];
    usedFeatures: string[];
  };
  financial: {
    plan: string;
    value: number;
    subscriptionDate: string;
    nextBilling: string;
    financialStatus:
      | "up_to_date"
      | "overdue"
      | "exempt"
      | "cancelled";
    paymentMethod: string;
    paymentHistory: {
      id: string;
      date: string;
      value: number;
      status: "paid" | "pending" | "failed" | "refunded";
      invoiceNumber: string;
      receiptUrl?: string;
    }[];
    invoices: Invoice[];
  };
  billing?: ChurchAccount["financial"];
  history: AuditLog[];
}

export interface ChurchAnalytics {
  id: string;
  churchId: string;
  name: string;
  plan: string;
  status: ChurchStatus;
  engagement: number;
  messagesSent: number;
  messagesReceived: number;
  members: number;
  users: number;
  registrationDate: string;
  timeAsClient: string;
  lastAccess: string;
  revenueGenerated: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  value: number;
  status: "issued" | "cancelled" | "processing";
  viewUrl?: string;
  downloadUrl?: string;
}

export interface AuditLog {
  id: string;
  date: string;
  responsibleUser: string;
  type: string;
  description: string;
  origin: string;
  additionalData?: Record<string, any>;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  periodicity: "monthly" | "yearly";
  status: "active" | "inactive";
  clientsCount: number;
  createdAt: string;
  limits: {
    maxMembers: number;
    maxUsers: number;
    maxMessagesPerMonth: number;
    storageGb: number;
    availableFeatures: string[];
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usageLimit: number;
  usages: number;
  startDate: string;
  expirationDate: string;
  allowedPlans: string[];
  status: "active" | "expired" | "depleted" | "inactive";
  usageHistory?: CouponUsage[];
}

export interface CouponUsage {
  id: string;
  churchId: string;
  churchName: string;
  acquiredPlan: string;
  originalValue: number;
  discount: number;
  finalValue: number;
  usageDate: string;
}

export type AffiliatePartnershipType = "commission" | "plan_discount";

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  partnershipType?: AffiliatePartnershipType;
  code: string;
  couponCode: string;
  registrationLink: string;
  referredClients: number;
  conversions: number;
  revenueGenerated: number;
  commissionPercentage: number;
  planDiscountPercentage?: number;
  linkedChurchId?: string;
  linkedChurchName?: string;
  commissionAmount: number;
  status: "active" | "inactive" | "pending";
  registrationDate: string;
  pixKey?: string;
  referralHistory?: {
    churchName: string;
    plan: string;
    date: string;
    value: number;
    commission: number;
    status: "active" | "canceled";
  }[];
}

export interface CommercialMetrics {
  kpis: {
    activeClients: number;
    newClientsMonth: number;
    cancellationsMonth: number;
    totalRevenue: number;
    netRevenue: number;
    averageTicket: number;
    ltv?: number;
    averageCac?: number;
    mrr: number;
    arr?: number;
    churnPerc: number;
    conversionRatePerc: number;
    clientsByPlan: { planName: string; count: number; revenue: number }[];
    clientsByCoupon: { coupon: string; count: number; revenue: number }[];
  };
  metricsByPlan?: any[];
  metricsByCoupon?: any[];
}

export interface AdminSettings {
  account: {
    name: string;
    email: string;
    phone: string;
    role: string;
    avatarUrl?: string;
  };
  preferences: {
    notifNewClients: boolean;
    notifOverdue: boolean;
    notifCancellations: boolean;
    notifHighUsage: boolean;
    defaultLanguage: string;
    tableDensity: "compact" | "normal";
  };
  security: {
    mfaActive: boolean;
    sessionExpirationMinutes: number;
    activeSessions: {
      id: string;
      ip: string;
      device: string;
      location: string;
      dateTime: string;
      current: boolean;
    }[];
  };
  system: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    paymentGateway: string;
    whatsappApiStatus: "online" | "unstable" | "offline";
    aiProviderStatus: "online" | "unstable" | "offline";
  };
  integrations?: {
    zapiDefaultInstance?: string;
    zapiDefaultToken?: string;
    asaasEnvironment?: string;
    asaasApiKey?: string;
    awsS3Bucket?: string;
    awsS3Region?: string;
  };
}

export type AutoMessagePurpose =
  | "onboarding"
  | "financial"
  | "engagement"
  | "marketing"
  | "support"
  | "custom";

export type AutoMessageFinalidade = AutoMessagePurpose;

export type AutoMessageTrigger =
  | "plan_purchase"
  | "trial_start"
  | "invoice_generated"
  | "payment_confirmed"
  | "invoice_overdue"
  | "inactivity_alert"
  | "trial_expiring"
  | "welcome"
  | "church_anniversary"
  | "plan_upgrade"
  | "custom_webhook"
  | string;

export interface AutoMessageFlow {
  id: string;
  trigger: AutoMessageTrigger;
  triggerName: string;
  purpose?: AutoMessagePurpose;
  purposeName?: string;
  description: string;
  channel: "whatsapp" | "in_app" | "both";
  dispatchDelay?: string;
  delayMinutes?: number;
  subject?: string;
  messageTemplate: string;
  availableVariables: string[];
  status: "active" | "inactive";
  lastUpdated: string;
}

export type BroadcastChannel = "whatsapp" | "in_app_banner" | "in_app_popup" | "all";

export type BroadcastTarget =
  | "all"
  | "active"
  | "trial"
  | "overdue"
  | "pro_plan"
  | "premium_plan";

export interface BroadcastCampaign {
  id: string;
  title: string;
  channel: BroadcastChannel;
  targetAudience: BroadcastTarget;
  message: string;
  actionLink?: string;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  deliveryRatePerc: number;
  status: "sent" | "scheduled" | "draft";
  author: string;
}

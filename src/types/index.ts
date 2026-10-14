/**
 * FreshPulse AI — Type Definitions
 * Strict Zero-Prefill: Only user-provided inputs are processed.
 */

export type POStatus = 'Delivered' | 'On Time' | 'Pending' | 'Delayed' | 'Critical Delay' | 'Cancelled';

export interface StoreRecord {
  storeId: string;
  storeName: string;
  location: string;
  analysisDate: string;
  totalSales: number;
  transactions: number;
  footfall: number;
  inventoryAvailable: number;
  inventorySold: number;
  wastageQuantity: number;
  purchaseOrderStatus: POStatus;
  staffCount: number;
  complianceScore: number;
  // Optional raw fields
  notes?: string;
}

export interface ProductRecord {
  storeId: string;
  productId: string;
  productName: string;
  category: string;
  stockAvailable: number;
  stockSold: number;
  wastageQuantity: number;
  unitPrice: number;
  reorderPoint?: number;
  expiryDays?: number; // Days until batch expiry
  supplierStatus?: POStatus;
}

export interface ComputedMetrics {
  averageBasketSize: number; // totalSales / transactions
  conversionRate: number; // (transactions / footfall) * 100
  sellThroughRate: number; // (inventorySold / (inventoryAvailable + inventorySold)) * 100
  wastageRate: number; // (wastageQuantity / (inventorySold + wastageQuantity)) * 100
  salesPerStaff: number; // totalSales / staffCount
  stockToSalesRatio: number; // inventoryAvailable / inventorySold
  inventoryHealthScore: number; // 0-100 derived sub-metric
}

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RiskCategory = 'inventory' | 'wastage' | 'sales' | 'supply_chain' | 'operations';

export interface RiskAlert {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  description: string;
  observedEvidence: string;
  potentialCause: string;
  falsificationEvidence: string; // What would disprove this
  recommendedActionHint: string;
  metricImpact: string;
}

export interface PriorityScoreBreakdown {
  inventoryRiskPoints: number; // max 30
  wastageRiskPoints: number; // max 25
  salesConversionPoints: number; // max 20
  supplyChainPoints: number; // max 15
  compliancePoints: number; // max 10
  totalScore: number; // 0-100
  dominantRiskFactor: string;
}

export interface StoreInvestigation {
  storeId: string;
  storeName: string;
  whereSummary: string;
  whyEvidence: string[];
  whatNextActions: string[];
  whatIfWrongFalsification: string[];
  missingInformation: string[];
  limitations: string[];
}

export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'executed';
export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ActionItem {
  id: string;
  storeId: string;
  storeName: string;
  productId?: string;
  title: string;
  description: string;
  priority: ActionPriority;
  category: RiskCategory;
  status: ActionStatus;
  supportingEvidence: string;
  rationale: string;
  requiredAssumptions: string[];
  missingInformation: string[];
  createdAt: string;
  reviewedAt?: string;
  // Simulated scenario impact
  simulatedImpact?: {
    currentScore: number;
    projectedScore: number;
    estimatedRevenueAtRisk: number | null; // null if uncalculable
    riskReductionDetails: string;
  };
  // Decision-First Enhancements
  concreteFirstStep?: string;
  expectedOutcome?: string;
  monitoringMetrics?: string[];
  feasibilityCheck?: string;
}

export interface StockTransferProposal {
  id: string;
  sourceStoreId: string;
  sourceStoreName: string;
  destStoreId: string;
  destStoreName: string;
  productId: string;
  productName: string;
  destShortage: number;
  sourceSurplus: number;
  proposedTransferQuantity: number;
  evidence: string;
  constraints: string[];
  missingInformation: string[];
  rationale: string;
  status: 'recommended' | 'reviewed' | 'executed' | 'dismissed';
}

export type HypothesisResultStatus = 'supported' | 'partly_supported' | 'not_supported' | 'insufficient_data';

export interface HypothesisTest {
  id: string;
  title: string;
  statement: string;
  category: string;
  comparisonMethod: string;
  recordsAnalyzed: number;
  groupA: {
    name: string;
    count: number;
    metricLabel: string;
    metricValue: number | null;
  };
  groupB: {
    name: string;
    count: number;
    metricLabel: string;
    metricValue: number | null;
  };
  resultStatus: HypothesisResultStatus;
  observedResult: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  limitations: string[];
}

export interface CoreAnswers {
  q1WhichStore: string;
  q2WhatProblem: string;
  q3WhatEvidence: string;
  q4WhyMoreUrgent: string;
  q5BusinessImpact: string;
  q6ActionFirst: string;
  q7WhatToMonitor: string;
}

export interface RootCauseAnalysis {
  mostLikelyCauses: string[];
  supportingFacts: string[];
  ruledOutCauses: string[];
  missingData: string[];
  falsificationCriteria: string[];
}

export interface BusinessImpact {
  estimatedLossAmount: number | null;
  formattedLoss: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface FirstAction {
  title: string;
  concreteStep: string;
  expectedOutcome: string;
  monitoringMetrics: string[];
  feasibilityCheck: string;
}

export interface StoreAnalysis {
  store: StoreRecord;
  metrics: ComputedMetrics;
  risks: RiskAlert[];
  priorityScore: number;
  scoreBreakdown: PriorityScoreBreakdown;
  investigation: StoreInvestigation;
  actions: ActionItem[];
  // Decision-First Prioritization properties
  rank: number;
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  mainProblem: string;
  primaryEvidence: string;
  businessImpact: BusinessImpact;
  firstAction: FirstAction;
  rankExplanation: string;
  coreAnswers: CoreAnswers;
  rootCauseAnalysis: RootCauseAnalysis;
}

export interface ValidationIssue {
  row: number;
  field: string;
  value: unknown;
  severity: 'error' | 'warning';
  message: string;
}

export interface CSVParseSummary {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  errorRows: number;
  headers: string[];
  issues: ValidationIssue[];
  duplicateStoreCount: number;
}

export interface NetworkSummary {
  totalStores: number;
  totalSales: number;
  totalTransactions: number;
  totalFootfall: number;
  totalWastageUnits: number;
  totalAvailableStock: number;
  averageConversionRate: number;
  averageComplianceScore: number;
  storesRequiringAttention: number; // priorityScore >= 50
  criticalStoresCount: number; // priorityScore >= 75
  totalOpenActions: number;
}

export interface OutcomeRecord {
  id: string;
  actionId: string;
  storeId: string;
  storeName: string;
  actionTitle: string;
  status: ActionStatus;
  preMetricName: string;
  preMetricValue: number;
  postMetricValue?: number;
  changeValue?: number;
  changePercent?: number;
  measurable: boolean;
  notes: string;
}

export interface AnalysisInput {
  stores: StoreRecord[];
  products?: ProductRecord[];
}

export interface AnalysisResult {
  analyses: StoreAnalysis[];
  networkSummary: NetworkSummary;
  analyzedAt: string;
}

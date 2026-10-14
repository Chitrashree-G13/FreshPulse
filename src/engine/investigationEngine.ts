/**
 * FreshPulse AI — Store Investigation Engine
 * Structures investigation around the 7 core executive questions and root-cause analysis:
 * 1. Which store should I investigate first?
 * 2. What is the most important problem in that store?
 * 3. What actual data supports this finding?
 * 4. Why is this problem more urgent than problems in other stores?
 * 5. What is the estimated business impact if the problem continues?
 * 6. Which action should be taken first?
 * 7. What should the manager monitor after taking that action?
 */

import {
  StoreRecord,
  ComputedMetrics,
  RiskAlert,
  StoreInvestigation,
  PriorityScoreBreakdown,
  BusinessImpact,
  FirstAction,
  CoreAnswers,
  RootCauseAnalysis,
  ActionItem
} from '../types';

export function detectMainProblemAndEvidence(
  store: StoreRecord,
  metrics: ComputedMetrics,
  risks: RiskAlert[]
): { mainProblem: string; primaryEvidence: string } {
  if (store.inventoryAvailable === 0 && store.inventorySold > 0) {
    return {
      mainProblem: 'Complete Stock Depletion — Zero shelf inventory despite active consumer demand.',
      primaryEvidence: `0 available units on hand vs ${store.inventorySold} sold units (Stock-to-sales: 0.00x). Delivery status: "${store.purchaseOrderStatus}".`
    };
  }

  if (metrics.stockToSalesRatio < 0.35 && store.inventorySold > 0) {
    return {
      mainProblem: `Critically Low Stock Buffer (${metrics.stockToSalesRatio.toFixed(2)}x) — Imminent shelf stockout.`,
      primaryEvidence: `${store.inventoryAvailable} available units remaining against ${store.inventorySold} daily sold units (${metrics.stockToSalesRatio.toFixed(2)}x coverage). Delivery status: "${store.purchaseOrderStatus}".`
    };
  }

  if (store.purchaseOrderStatus === 'Critical Delay') {
    return {
      mainProblem: 'Critical Purchase Order Delivery Delay — Supplier replenishment shipment missed.',
      primaryEvidence: `Purchase Order Status is marked "Critical Delay". Remaining stock buffer is ${store.inventoryAvailable} units.`
    };
  }

  if (metrics.wastageRate > 12) {
    return {
      mainProblem: `Severe Perishable Wastage Surge (${metrics.wastageRate.toFixed(1)}%) — Far exceeding franchise threshold (5%).`,
      primaryEvidence: `${store.wastageQuantity} units discarded against ${store.inventorySold} units sold (${metrics.wastageRate.toFixed(1)}% waste rate).`
    };
  }

  if (store.purchaseOrderStatus === 'Delayed') {
    return {
      mainProblem: `Purchase Order Logistics Delay — Replenishment order overdue.`,
      primaryEvidence: `Purchase Order Status is "Delayed" with ${store.inventoryAvailable} units in reserve.`
    };
  }

  if (metrics.wastageRate > 6) {
    return {
      mainProblem: `Elevated Perishable Spoilage Rate (${metrics.wastageRate.toFixed(1)}%) — Above operational target.`,
      primaryEvidence: `${store.wastageQuantity} units wasted against ${store.inventorySold} sold units.`
    };
  }

  if (store.footfall > 80 && metrics.conversionRate < 25) {
    return {
      mainProblem: `Customer Conversion Disparity (${metrics.conversionRate.toFixed(1)}%) — Heavy visitor footfall failing to checkout.`,
      primaryEvidence: `${store.footfall} visitors entered but only ${store.transactions} transactions recorded (${metrics.conversionRate.toFixed(1)}% conversion).`
    };
  }

  if (store.complianceScore < 60) {
    return {
      mainProblem: `Critical Operations & Compliance Deficit (${store.complianceScore}/100) — Audit failure risk.`,
      primaryEvidence: `Store audit compliance score is ${store.complianceScore}/100 (Franchise threshold: 75/100).`
    };
  }

  return {
    mainProblem: 'Operations Nominal — Store performance is within baseline franchise thresholds.',
    primaryEvidence: `Sales: $${store.totalSales.toLocaleString()}, Stock Coverage: ${metrics.stockToSalesRatio.toFixed(2)}x, Wastage: ${metrics.wastageRate.toFixed(1)}%, Compliance: ${store.complianceScore}/100.`
  };
}

export function estimateBusinessImpact(
  store: StoreRecord,
  metrics: ComputedMetrics,
  risks: RiskAlert[]
): BusinessImpact {
  if (store.inventoryAvailable === 0 && store.inventorySold > 0) {
    const loss = Number((store.inventorySold * 0.4 * Math.max(15, metrics.averageBasketSize)).toFixed(2));
    return {
      estimatedLossAmount: loss,
      formattedLoss: `~$${loss.toLocaleString()}`,
      description: `Immediate revenue loss of ~$${loss.toLocaleString()} per shift from unfulfilled shopper demand and basket abandonment.`,
      severity: 'critical'
    };
  }

  if (metrics.stockToSalesRatio < 0.35 && store.inventorySold > 0) {
    const loss = Number((store.inventorySold * 0.25 * Math.max(15, metrics.averageBasketSize)).toFixed(2));
    return {
      estimatedLossAmount: loss,
      formattedLoss: `~$${loss.toLocaleString()}`,
      description: `High probability of ~$${loss.toLocaleString()} lost sales within next operational shift as buffer runs out.`,
      severity: 'high'
    };
  }

  if (metrics.wastageRate > 6) {
    const loss = Number((store.wastageQuantity * 4.50).toFixed(2));
    return {
      estimatedLossAmount: loss,
      formattedLoss: `~$${loss.toLocaleString()}`,
      description: `Direct shrinkage write-off of ~$${loss.toLocaleString()} in spoiled fresh produce and wasted procurement spend.`,
      severity: metrics.wastageRate > 12 ? 'critical' : 'high'
    };
  }

  if (store.purchaseOrderStatus === 'Critical Delay' || store.purchaseOrderStatus === 'Delayed') {
    const loss = Number((store.totalSales * 0.15).toFixed(2));
    return {
      estimatedLossAmount: loss,
      formattedLoss: `~$${loss.toLocaleString()}`,
      description: `Compounding supply chain risk putting ~$${loss.toLocaleString()} in scheduled afternoon peak turnover at risk.`,
      severity: store.purchaseOrderStatus === 'Critical Delay' ? 'critical' : 'medium'
    };
  }

  if (store.footfall > 80 && metrics.conversionRate < 25) {
    const loss = Number((store.footfall * 0.10 * Math.max(15, metrics.averageBasketSize)).toFixed(2));
    return {
      estimatedLossAmount: loss,
      formattedLoss: `~$${loss.toLocaleString()}`,
      description: `Missed revenue opportunity of ~$${loss.toLocaleString()} due to walk-outs and queue friction.`,
      severity: 'high'
    };
  }

  return {
    estimatedLossAmount: 0,
    formattedLoss: '$0',
    description: 'No active material business or revenue loss identified under current operating parameters.',
    severity: 'low'
  };
}

export function deriveFirstAction(
  store: StoreRecord,
  actions: ActionItem[],
  risks: RiskAlert[]
): FirstAction {
  if (actions.length > 0) {
    const primary = actions[0];
    return {
      title: primary.title,
      concreteStep: primary.concreteFirstStep || `Contact regional hub and take immediate action on Store ${store.storeId}.`,
      expectedOutcome: primary.expectedOutcome || 'Stabilize store operating performance within current shift.',
      monitoringMetrics: primary.monitoringMetrics && primary.monitoringMetrics.length > 0
        ? primary.monitoringMetrics
        : ['Inventory unit count', 'Hourly checkout transactions', 'Customer feedback'],
      feasibilityCheck: primary.feasibilityCheck || 'Confirm staff availability on shift.'
    };
  }

  return {
    title: `Conduct Standard Operational Review for Store ${store.storeId}`,
    concreteStep: 'Perform routine daily floor inspection and verify upcoming PO delivery windows.',
    expectedOutcome: 'Maintain nominal operating velocity within franchise benchmarks.',
    monitoringMetrics: ['Daily sales pace', 'Inventory replenishment intake', 'End-of-day wastage tally'],
    feasibilityCheck: 'Standard daily store operational routine.'
  };
}

export function generateRootCauseAnalysis(
  store: StoreRecord,
  metrics: ComputedMetrics,
  risks: RiskAlert[]
): RootCauseAnalysis {
  const mostLikelyCauses: string[] = [];
  const supportingFacts: string[] = [];
  const ruledOutCauses: string[] = [];
  const missingData: string[] = [];
  const falsificationCriteria: string[] = [];

  // Most likely causes & supporting facts
  if (store.inventoryAvailable === 0 || metrics.stockToSalesRatio < 0.35) {
    mostLikelyCauses.push(
      `Replenishment disconnect: Inflow rate lagged behind customer sales volume (${store.inventorySold} units sold vs ${store.inventoryAvailable} units left).`
    );
    if (store.purchaseOrderStatus === 'Delayed' || store.purchaseOrderStatus === 'Critical Delay') {
      mostLikelyCauses.push(
        `Supplier delivery bottleneck: Purchase order marked "${store.purchaseOrderStatus}", leaving shelves unreplenished during peak traffic.`
      );
    }
  }

  if (metrics.wastageRate > 6) {
    mostLikelyCauses.push(
      `Cold-chain or rotation failure: Suboptimal first-in-first-out (FIFO) handling or chiller temperature fluctuation caused ${store.wastageQuantity} units (${metrics.wastageRate.toFixed(1)}%) of produce spoilage.`
    );
  }

  if (store.footfall > 80 && metrics.conversionRate < 25) {
    mostLikelyCauses.push(
      `In-store purchase friction: High visitor footfall (${store.footfall}) but shoppers left empty-handed (${metrics.conversionRate.toFixed(1)}% checkout conversion) due to stockouts of key staple items or register wait times.`
    );
  }

  if (store.complianceScore < 60) {
    mostLikelyCauses.push(
      `Supervisory process lapse: Operational audit deficit (${store.complianceScore}/100) indicates missed checklist protocols.`
    );
  }

  if (mostLikelyCauses.length === 0) {
    mostLikelyCauses.push('Balanced daily replenishment cycle aligned with customer demand.');
  }

  // Supporting Facts
  supportingFacts.push(`Total Sales: $${store.totalSales.toLocaleString()} across ${store.transactions} transactions.`);
  supportingFacts.push(`Customer Footfall: ${store.footfall} visitors (Conversion: ${metrics.conversionRate.toFixed(1)}%).`);
  supportingFacts.push(`Stock on Hand: ${store.inventoryAvailable} units vs ${store.inventorySold} sold (Coverage: ${metrics.stockToSalesRatio.toFixed(2)}x).`);
  supportingFacts.push(`Produce Wastage: ${store.wastageQuantity} units (${metrics.wastageRate.toFixed(1)}% wastage rate).`);
  supportingFacts.push(`PO Status: "${store.purchaseOrderStatus}", Staff: ${store.staffCount}, Compliance: ${store.complianceScore}/100.`);

  // Ruled-out Causes (crucial for decision intelligence)
  if (store.footfall > 150) {
    ruledOutCauses.push(`Footfall traffic collapse is RULED OUT: Store received healthy footfall of ${store.footfall} visitors.`);
  }
  if (store.staffCount >= 4) {
    ruledOutCauses.push(`Severe staff shortage is RULED OUT: Store is staffed with ${store.staffCount} team members generating $${metrics.salesPerStaff.toFixed(0)}/staff.`);
  }
  if (metrics.wastageRate <= 5) {
    ruledOutCauses.push(`Produce spoilage problem is RULED OUT: Wastage rate is well controlled at ${metrics.wastageRate.toFixed(1)}% (below 5% tolerance).`);
  }
  if (store.complianceScore >= 75) {
    ruledOutCauses.push(`Regulatory/hygiene negligence is RULED OUT: Store compliance score is solid at ${store.complianceScore}/100.`);
  }
  if (store.inventoryAvailable > 100 && metrics.stockToSalesRatio >= 1.0) {
    ruledOutCauses.push(`Inventory stockout is RULED OUT: Store maintains ${store.inventoryAvailable} available units (${metrics.stockToSalesRatio.toFixed(2)}x coverage).`);
  }

  // Missing Data
  missingData.push('SKU-level barcode velocity (aggregate store file does not separate produce from dairy/dry goods).');
  missingData.push('Hourly walk-in chiller temperature sensor telemetry.');
  missingData.push('Carrier fleet GPS telemetry to confirm exact transit distance of delayed shipments.');

  // Falsification Criteria
  falsificationCriteria.push('Finding is disproved if unrecorded physical stock is discovered in rear storage holding bays.');
  falsificationCriteria.push('Finding is disproved if supplier delivery arrives before the next scheduled peak shopping window.');
  falsificationCriteria.push('Finding is disproved if footfall counter miscounted passers-by through common mall corridors.');

  return {
    mostLikelyCauses,
    supportingFacts,
    ruledOutCauses,
    missingData,
    falsificationCriteria
  };
}

export function generateCoreAnswers(
  store: StoreRecord,
  metrics: ComputedMetrics,
  risks: RiskAlert[],
  scoring: PriorityScoreBreakdown,
  rank: number,
  totalStores: number,
  topStore: { storeId: string; storeName: string; score: number } | null,
  businessImpact: BusinessImpact,
  firstAction: FirstAction,
  mainProblem: string,
  primaryEvidence: string
): CoreAnswers {
  const isTop = rank === 1;

  // Q1: Which store should I investigate first?
  const q1WhichStore = isTop
    ? `Investigate Store ${store.storeName} (${store.storeId}) FIRST. It holds Rank #1 across all ${totalStores} stores in the franchise network with the highest risk score (${scoring.totalScore}/100).`
    : `Investigate Store ${topStore?.storeName || 'top priority'} (${topStore?.storeId || 'Rank 1'}) first. This store (${store.storeName}, ${store.storeId}) is ranked #${rank} of ${totalStores} with a priority score of ${scoring.totalScore}/100.`;

  // Q2: What is the most important problem in that store?
  const q2WhatProblem = mainProblem;

  // Q3: What actual data supports this finding?
  const q3WhatEvidence = primaryEvidence;

  // Q4: Why is this problem more urgent than problems in other stores?
  let q4WhyMoreUrgent = '';
  if (isTop) {
    if (store.inventoryAvailable === 0) {
      q4WhyMoreUrgent = `This store has ZERO stock available right now while customer traffic is active (${store.footfall} visitors). Unlike other stores with manageable buffers or delayed shipments, this store is actively losing sales every minute with empty shelves.`;
    } else if (metrics.stockToSalesRatio < 0.35) {
      q4WhyMoreUrgent = `Stock coverage has collapsed to ${metrics.stockToSalesRatio.toFixed(2)}x daily velocity compounded by PO status "${store.purchaseOrderStatus}". A complete stockout is imminent during the next traffic peak, making it more urgent than stores with higher buffers.`;
    } else if (metrics.wastageRate > 10) {
      q4WhyMoreUrgent = `Perishable wastage (${metrics.wastageRate.toFixed(1)}%) is eroding immediate daily margins far more aggressively than any other store in the network.`;
    } else {
      q4WhyMoreUrgent = `This store exhibits the highest compounding operational risk score (${scoring.totalScore}/100) across inventory, logistics, and compliance factors.`;
    }
  } else {
    q4WhyMoreUrgent = `Ranked #${rank} because its risk factors are less critical than Store ${topStore?.storeId} (${topStore?.score}/100). While attention is needed, it maintains operational continuity without immediate shelf vacancy.`;
  }

  // Q5: What is the estimated business impact if the problem continues?
  const q5BusinessImpact = businessImpact.description;

  // Q6: Which action should be taken first?
  const q6ActionFirst = `${firstAction.title}: ${firstAction.concreteStep}`;

  // Q7: What should the manager monitor after taking that action?
  const q7WhatToMonitor = firstAction.monitoringMetrics.join(' • ');

  return {
    q1WhichStore,
    q2WhatProblem,
    q3WhatEvidence,
    q4WhyMoreUrgent,
    q5BusinessImpact,
    q6ActionFirst,
    q7WhatToMonitor
  };
}

export function generateStoreInvestigation(
  store: StoreRecord,
  metrics: ComputedMetrics,
  risks: RiskAlert[],
  scoring: PriorityScoreBreakdown
): StoreInvestigation {
  // 1. WHERE
  let urgencyTier = 'Low Attention Needed';
  if (scoring.totalScore >= 75) {
    urgencyTier = 'CRITICAL IMMEDIATE INTERVENTION';
  } else if (scoring.totalScore >= 50) {
    urgencyTier = 'HIGH PRIORITY ATTENTION';
  } else if (scoring.totalScore >= 25) {
    urgencyTier = 'MODERATE OPERATIONAL REVIEW';
  }

  const whereSummary = `Store ${store.storeId} (${store.storeName}, ${store.location}) is classified as [${urgencyTier}] with a Priority Score of ${scoring.totalScore}/100. Primary driver: ${scoring.dominantRiskFactor}.`;

  // 2. WHY: Observed factual evidence
  const whyEvidence: string[] = [
    `Total Sales: $${store.totalSales.toLocaleString()} across ${store.transactions.toLocaleString()} transactions (Avg Basket: $${metrics.averageBasketSize.toFixed(2)}).`,
    `Footfall: ${store.footfall.toLocaleString()} visitors with a conversion rate of ${metrics.conversionRate.toFixed(1)}%.`,
    `Inventory Status: ${store.inventoryAvailable.toLocaleString()} units available vs ${store.inventorySold.toLocaleString()} units sold (Stock-to-Sales: ${metrics.stockToSalesRatio.toFixed(2)}x).`,
    `Wastage: ${store.wastageQuantity.toLocaleString()} units recorded (${metrics.wastageRate.toFixed(1)}% wastage rate).`,
    `Purchase Order: Status is "${store.purchaseOrderStatus}".`,
    `Operations: Staff headcount of ${store.staffCount} (Sales/Staff: $${metrics.salesPerStaff.toFixed(2)}), Compliance audit score: ${store.complianceScore}/100.`
  ];

  // 3. WHAT NEXT: Action steps derived directly from identified risks
  const whatNextActions: string[] = [];
  if (risks.length === 0) {
    whatNextActions.push('Maintain regular shift operations; conduct routine daily replenishment check.');
  } else {
    risks.forEach(r => {
      whatNextActions.push(`${r.title}: ${r.recommendedActionHint}`);
    });
  }

  // 4. WHAT IF WE ARE WRONG: Critical falsification criteria
  const whatIfWrongFalsification: string[] = [];
  if (risks.length === 0) {
    whatIfWrongFalsification.push('If unrecorded stock depletion or delayed returns are discovered during evening audit.');
  } else {
    risks.forEach(r => {
      whatIfWrongFalsification.push(`Hypothesis "${r.title}": Disproved if ${r.falsificationEvidence}`);
    });
  }

  // Missing Information & Limitations
  const missingInformation: string[] = [
    'Granular SKU-level breakdown is not in aggregate store file (requires Product CSV).',
    'Batch expiry dates and chiller temperature logs are absent from store-level records.',
    'Multi-day historical trend requires multi-date CSV upload to establish baseline seasonal velocity.'
  ];

  const limitations: string[] = [
    'Analysis reflects current snapshot input. It does not prove causal mechanisms.',
    'Priority score is a rule-based triage index calibrated on franchise thresholds, not an empirical ML probability.',
    'Zero demand or missing records are handled conservatively without synthetic imputation.'
  ];

  return {
    storeId: store.storeId,
    storeName: store.storeName,
    whereSummary,
    whyEvidence,
    whatNextActions,
    whatIfWrongFalsification,
    missingInformation,
    limitations
  };
}

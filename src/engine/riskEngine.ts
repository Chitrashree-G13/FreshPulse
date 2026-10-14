/**
 * FreshPulse AI — Risk Detection Engine
 * Deterministic rule-based evaluation.
 * Rigorously separates observed facts from possible causes and falsification criteria.
 */

import { StoreRecord, ComputedMetrics, RiskAlert } from '../types';

export function evaluateStoreRisks(store: StoreRecord, metrics: ComputedMetrics): RiskAlert[] {
  const risks: RiskAlert[] = [];

  // 1. INVENTORY: Complete Stockout or Depletion Risk
  if (store.inventoryAvailable === 0 && store.inventorySold > 0) {
    risks.push({
      id: `risk-stockout-${store.storeId}`,
      category: 'inventory',
      severity: 'critical',
      title: 'Complete Stock Depletion',
      description: 'Store has 0 available inventory units while showing recorded consumer demand.',
      observedEvidence: `Available stock = 0 units; Sold units = ${store.inventorySold} units.`,
      potentialCause: 'Sudden demand surge outstripped replenishment cycle, or delivery failed without record.',
      falsificationEvidence: 'If physical unrecorded stock is found in backroom inventory or sales continue without restock.',
      recommendedActionHint: 'Request emergency network transfer from nearest surplus store or expedite supplier order.',
      metricImpact: 'Active revenue loss from unmet shopper demand.'
    });
  } else if (metrics.stockToSalesRatio < 0.35 && store.inventorySold > 0) {
    risks.push({
      id: `risk-low-buffer-${store.storeId}`,
      category: 'inventory',
      severity: 'high',
      title: 'Critically Low Stock Buffer',
      description: 'Remaining stock coverage is less than 0.35x daily sales volume.',
      observedEvidence: `Stock-to-sales ratio is ${metrics.stockToSalesRatio.toFixed(2)}x (Available: ${store.inventoryAvailable}, Sold: ${store.inventorySold}).`,
      potentialCause: 'Inflow rate lower than daily velocity; order batch sizes insufficient.',
      falsificationEvidence: 'If customer footfall drops dramatically on subsequent day reducing run-rate.',
      recommendedActionHint: 'Confirm estimated delivery time of pending PO or rebalance stock from nearby hub.',
      metricImpact: 'High probability of stockout within next operational shift.'
    });
  }

  // 2. SUPPLY CHAIN: Purchase Order Delays
  if (store.purchaseOrderStatus === 'Critical Delay') {
    risks.push({
      id: `risk-po-crit-${store.storeId}`,
      category: 'supply_chain',
      severity: 'critical',
      title: 'Critical Purchase Order Delay',
      description: 'Supplier shipment has missed expected delivery window with critical operational flag.',
      observedEvidence: `Purchase Order Status is marked "Critical Delay". Remaining stock = ${store.inventoryAvailable} units.`,
      potentialCause: 'Supplier stockout, logistics fleet breakdown, or unacknowledged distribution center bottleneck.',
      falsificationEvidence: 'If supplier logistics tracking proves dispatch is arriving today or supplier delivery slip was missed.',
      recommendedActionHint: 'Escalate to franchise supplier coordinator and identify cross-dock transfer options.',
      metricImpact: 'Compounding inventory depletion and risk of empty shelves.'
    });
  } else if (store.purchaseOrderStatus === 'Delayed') {
    risks.push({
      id: `risk-po-delayed-${store.storeId}`,
      category: 'supply_chain',
      severity: 'medium',
      title: 'Purchase Order Logistics Delay',
      description: 'Replenishment order is delayed against expected schedule.',
      observedEvidence: `Purchase Order Status is "Delayed". Available stock: ${store.inventoryAvailable} units.`,
      potentialCause: 'Transit congestion or delayed warehouse picking.',
      falsificationEvidence: 'If delivery arrives during morning receiving hours.',
      recommendedActionHint: 'Check revised ETA with dispatch and monitor buffer.',
      metricImpact: 'Potential buffer erosion if replenishment cycle slips further.'
    });
  }

  // 3. WASTAGE: Spoilage / Shrinkage Surge
  if (metrics.wastageRate > 12) {
    risks.push({
      id: `risk-waste-crit-${store.storeId}`,
      category: 'wastage',
      severity: 'critical',
      title: 'Severe Wastage Surge',
      description: `Wastage represents ${metrics.wastageRate.toFixed(1)}% of total consumed items, far exceeding franchise threshold (5%).`,
      observedEvidence: `Wastage quantity is ${store.wastageQuantity} units vs ${store.inventorySold} sold units (${metrics.wastageRate.toFixed(1)}% wastage rate).`,
      potentialCause: 'Cold-chain refrigeration failure, over-ordering perishable produce, or batch expiration.',
      falsificationEvidence: 'If waste audit reveals data entry error (e.g. damaged transit carton marked twice) rather than floor loss.',
      recommendedActionHint: 'Inspect store chillers immediately, review freshness audit, and discount nearing-expiry items.',
      metricImpact: 'Direct margin loss and wasted purchasing capital.'
    });
  } else if (metrics.wastageRate > 6) {
    risks.push({
      id: `risk-waste-high-${store.storeId}`,
      category: 'wastage',
      severity: 'high',
      title: 'Elevated Wastage Rate',
      description: `Wastage rate of ${metrics.wastageRate.toFixed(1)}% is above target operational tolerance.`,
      observedEvidence: `Recorded ${store.wastageQuantity} waste units against ${store.inventorySold} sold.`,
      potentialCause: 'Suboptimal rotation (FIFO failure), minor temperature variation, or over-ordering.',
      falsificationEvidence: 'If customer returns of non-spoiled goods were miscategorized as waste.',
      recommendedActionHint: 'Reinforce rotation protocols with floor staff and adjust order quantities.',
      metricImpact: 'Unnecessary cost drag on daily store profitability.'
    });
  }

  // 4. SALES & CONVERSION: Footfall Conversion Anomaly
  if (store.footfall > 80 && metrics.conversionRate < 25) {
    risks.push({
      id: `risk-conversion-${store.storeId}`,
      category: 'sales',
      severity: 'high',
      title: 'Low Customer Conversion Disparity',
      description: 'High footfall traffic entering store is not translating to checkout transactions.',
      observedEvidence: `Footfall is ${store.footfall} visitors, but only ${store.transactions} transactions recorded (${metrics.conversionRate.toFixed(1)}% conversion).`,
      potentialCause: 'Shoppers left without purchasing due to missing key items (stockouts), long queues, or uncompetitive pricing.',
      falsificationEvidence: 'If pedestrian sensor miscounted passers-by through door or mall event skewed doorway footfall.',
      recommendedActionHint: 'Check shelf availability in high-velocity categories and verify POS queue wait times.',
      metricImpact: 'Lost basket revenue from qualified in-store footfall.'
    });
  } else if (store.footfall > 0 && store.transactions === 0) {
    risks.push({
      id: `risk-zero-tx-${store.storeId}`,
      category: 'sales',
      severity: 'critical',
      title: 'Zero Transactions Despite Footfall',
      description: 'Footfall was recorded but zero sales transactions occurred.',
      observedEvidence: `Footfall = ${store.footfall}, Transactions = 0, Total Sales = $0.`,
      potentialCause: 'POS terminal failure, network outage, or store was closed for walk-in shopping.',
      falsificationEvidence: 'If offline transactions are pending upload in local register cache.',
      recommendedActionHint: 'Perform immediate technical check on POS system and network connectivity.',
      metricImpact: 'Complete revenue loss during operating hours.'
    });
  }

  // 5. OPERATIONS & COMPLIANCE: Audit & Staffing Pressures
  if (store.complianceScore < 60) {
    risks.push({
      id: `risk-compliance-crit-${store.storeId}`,
      category: 'operations',
      severity: 'critical',
      title: 'Critical Compliance / Audit Deficit',
      description: `Store compliance score of ${store.complianceScore}/100 indicates significant regulatory or operational risk.`,
      observedEvidence: `Compliance score = ${store.complianceScore}/100 (Threshold: 75).`,
      potentialCause: 'Food safety lapse, hygiene standard violation, or skipped operational checklist items.',
      falsificationEvidence: 'If audit date was recorded incorrectly or remedial inspection has not yet been synced.',
      recommendedActionHint: 'Schedule immediate regional supervisor audit and dispatch compliance checklist.',
      metricImpact: 'Brand damage risk, potential municipal fines, or health inspection closure.'
    });
  } else if (store.complianceScore < 75) {
    risks.push({
      id: `risk-compliance-med-${store.storeId}`,
      category: 'operations',
      severity: 'medium',
      title: 'Sub-Standard Compliance Score',
      description: `Compliance score of ${store.complianceScore}/100 is below target benchmark (75).`,
      observedEvidence: `Recorded compliance score is ${store.complianceScore}/100.`,
      potentialCause: 'Staff turnover, lack of training, or backlog of operational logging.',
      falsificationEvidence: 'If pending corrective actions were closed after audit timestamp.',
      recommendedActionHint: 'Issue standard remediation notice to store manager.',
      metricImpact: 'Operational friction and increased likelihood of inventory mismanagement.'
    });
  }

  // Understaffing strain
  if (store.staffCount > 0 && store.footfall / store.staffCount > 150) {
    risks.push({
      id: `risk-understaffed-${store.storeId}`,
      category: 'operations',
      severity: 'medium',
      title: 'Staffing Capacity Strain',
      description: `High customer-to-staff ratio (${(store.footfall / store.staffCount).toFixed(0)} visitors per staff member) may compromise service quality and inventory management.`,
      observedEvidence: `Footfall = ${store.footfall}, Staff = ${store.staffCount} (${(store.footfall / store.staffCount).toFixed(0)}:1 ratio).`,
      potentialCause: 'Unplanned staff absence or shift scheduling mismatch with peak shopping hours.',
      falsificationEvidence: 'If automated self-checkout kiosks processed the majority of traffic.',
      recommendedActionHint: 'Reassign floater staff or adjust peak-hour shift schedule.',
      metricImpact: 'Elevated queue times, missed shelf replenishment, and increased wastage.'
    });
  }

  return risks;
}

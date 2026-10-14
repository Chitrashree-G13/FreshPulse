/**
 * FreshPulse AI — Retail Hypothesis Tester
 * Evaluates operational claims empirically using the user's active dataset.
 * Distinguishes observed statistical differences from proven causation.
 */

import { StoreAnalysis, HypothesisTest } from '../types';

export function runHypothesisTests(analyses: StoreAnalysis[]): HypothesisTest[] {
  const tests: HypothesisTest[] = [];

  // If no data or 1 record: Insufficient data
  if (analyses.length < 2) {
    const insufficientMessage = analyses.length === 1
      ? 'Only 1 store record available in active dataset. Cross-store comparison requires at least 2 distinct store records.'
      : 'No dataset loaded. Please upload or enter store records to evaluate retail hypotheses.';

    tests.push({
      id: 'hypo-po-stockout',
      title: 'Supplier Delays vs Inventory Depletion',
      statement: 'Stores with delayed Purchase Orders have significantly lower stock buffers than stores with on-time or delivered POs.',
      category: 'Supply Chain',
      comparisonMethod: 'Compare average stock-to-sales ratio between Delayed/Critical PO stores and On-Time/Delivered PO stores.',
      recordsAnalyzed: analyses.length,
      groupA: { name: 'Delayed / Critical PO Stores', count: 0, metricLabel: 'Avg Stock-to-Sales', metricValue: null },
      groupB: { name: 'On-Time / Delivered PO Stores', count: 0, metricLabel: 'Avg Stock-to-Sales', metricValue: null },
      resultStatus: 'insufficient_data',
      observedResult: insufficientMessage,
      supportingEvidence: [],
      contradictingEvidence: [],
      limitations: ['Cannot perform statistical comparison with fewer than 2 store records.']
    });

    tests.push({
      id: 'hypo-stock-conversion',
      title: 'Stock Depletion vs Conversion Failure',
      statement: 'Stores experiencing inventory depletion exhibit lower customer conversion rates despite incoming footfall.',
      category: 'Sales & Inventory',
      comparisonMethod: 'Compare average conversion rate between Low Stock stores (stock-to-sales < 0.5x) and Adequate Stock stores (>= 0.5x).',
      recordsAnalyzed: analyses.length,
      groupA: { name: 'Low Stock Stores (<0.5x)', count: 0, metricLabel: 'Avg Conversion Rate', metricValue: null },
      groupB: { name: 'Adequate Stock Stores (>=0.5x)', count: 0, metricLabel: 'Avg Conversion Rate', metricValue: null },
      resultStatus: 'insufficient_data',
      observedResult: insufficientMessage,
      supportingEvidence: [],
      contradictingEvidence: [],
      limitations: ['Requires multiple stores with contrasting stock availability.']
    });

    tests.push({
      id: 'hypo-compliance-waste',
      title: 'Operational Compliance vs Perishable Wastage',
      statement: 'Stores with compliance scores below 75 suffer higher wastage rates due to handling or rotation deficits.',
      category: 'Operations & Wastage',
      comparisonMethod: 'Compare average wastage rate between Sub-75 Compliance stores and 75+ Compliance stores.',
      recordsAnalyzed: analyses.length,
      groupA: { name: 'Compliance < 75', count: 0, metricLabel: 'Avg Wastage Rate', metricValue: null },
      groupB: { name: 'Compliance >= 75', count: 0, metricLabel: 'Avg Wastage Rate', metricValue: null },
      resultStatus: 'insufficient_data',
      observedResult: insufficientMessage,
      supportingEvidence: [],
      contradictingEvidence: [],
      limitations: ['Requires sample of stores with varying compliance scores.']
    });

    return tests;
  }

  // --- TEST 1: PO Delay vs Stock Buffer ---
  const delayedStores = analyses.filter(
    a => a.store.purchaseOrderStatus === 'Delayed' || a.store.purchaseOrderStatus === 'Critical Delay'
  );
  const onTimeStores = analyses.filter(
    a => a.store.purchaseOrderStatus === 'On Time' || a.store.purchaseOrderStatus === 'Delivered'
  );

  let hypo1Status: HypothesisTest['resultStatus'] = 'insufficient_data';
  let hypo1Observed = '';
  const hypo1Support: string[] = [];
  const hypo1Contradict: string[] = [];
  let avgRatioDelayed: number | null = null;
  let avgRatioOnTime: number | null = null;

  if (delayedStores.length > 0 && onTimeStores.length > 0) {
    const sumDelayed = delayedStores.reduce((acc, s) => acc + s.metrics.stockToSalesRatio, 0);
    const sumOnTime = onTimeStores.reduce((acc, s) => acc + s.metrics.stockToSalesRatio, 0);
    avgRatioDelayed = Number((sumDelayed / delayedStores.length).toFixed(2));
    avgRatioOnTime = Number((sumOnTime / onTimeStores.length).toFixed(2));

    if (avgRatioDelayed < avgRatioOnTime) {
      hypo1Status = avgRatioDelayed < avgRatioOnTime * 0.7 ? 'supported' : 'partly_supported';
      hypo1Observed = `Delayed PO stores average ${avgRatioDelayed}x stock-to-sales coverage, compared to ${avgRatioOnTime}x for On-Time stores.`;
      hypo1Support.push(`Stores with delayed shipments maintain ${(avgRatioOnTime - avgRatioDelayed).toFixed(2)}x less buffer coverage.`);
      delayedStores.forEach(s => hypo1Support.push(`${s.store.storeName} (${s.store.purchaseOrderStatus}): ratio is ${s.metrics.stockToSalesRatio.toFixed(2)}x.`));
    } else {
      hypo1Status = 'not_supported';
      hypo1Observed = `Delayed PO stores actually maintain higher or equal coverage (${avgRatioDelayed}x) vs on-time stores (${avgRatioOnTime}x).`;
      hypo1Contradict.push(`Stores with delayed POs still have adequate stock on shelf, suggesting previous safety buffer mitigated immediate stockout.`);
    }
  } else {
    hypo1Observed = `Dataset contains ${delayedStores.length} delayed store(s) and ${onTimeStores.length} on-time store(s). Need at least 1 in each group to compare.`;
  }

  tests.push({
    id: 'hypo-po-stockout',
    title: 'Supplier Delays vs Inventory Depletion',
    statement: 'Stores with delayed Purchase Orders have significantly lower stock buffers than stores with on-time or delivered POs.',
    category: 'Supply Chain',
    comparisonMethod: 'Compare average stock-to-sales ratio between Delayed/Critical PO stores and On-Time/Delivered PO stores.',
    recordsAnalyzed: analyses.length,
    groupA: {
      name: 'Delayed / Critical PO Stores',
      count: delayedStores.length,
      metricLabel: 'Avg Stock-to-Sales',
      metricValue: avgRatioDelayed
    },
    groupB: {
      name: 'On-Time / Delivered PO Stores',
      count: onTimeStores.length,
      metricLabel: 'Avg Stock-to-Sales',
      metricValue: avgRatioOnTime
    },
    resultStatus: hypo1Status,
    observedResult: hypo1Observed,
    supportingEvidence: hypo1Support,
    contradictingEvidence: hypo1Contradict,
    limitations: [
      'Correlation does not prove causation: delayed shipments might be caused by suppliers rationing scarce SKUs that were already in deficit.',
      'Small sample size in uploaded dataset may increase variance.'
    ]
  });

  // --- TEST 2: Stock Depletion vs Conversion ---
  const lowStockStores = analyses.filter(a => a.metrics.stockToSalesRatio < 0.5);
  const okStockStores = analyses.filter(a => a.metrics.stockToSalesRatio >= 0.5);

  let hypo2Status: HypothesisTest['resultStatus'] = 'insufficient_data';
  let hypo2Observed = '';
  const hypo2Support: string[] = [];
  const hypo2Contradict: string[] = [];
  let avgConvLow: number | null = null;
  let avgConvOk: number | null = null;

  if (lowStockStores.length > 0 && okStockStores.length > 0) {
    const sumLow = lowStockStores.reduce((acc, s) => acc + s.metrics.conversionRate, 0);
    const sumOk = okStockStores.reduce((acc, s) => acc + s.metrics.conversionRate, 0);
    avgConvLow = Number((sumLow / lowStockStores.length).toFixed(1));
    avgConvOk = Number((sumOk / okStockStores.length).toFixed(1));

    if (avgConvLow < avgConvOk) {
      hypo2Status = avgConvLow < avgConvOk * 0.75 ? 'supported' : 'partly_supported';
      hypo2Observed = `Low-stock stores convert at ${avgConvLow}%, while adequate-stock stores convert at ${avgConvOk}%.`;
      hypo2Support.push(`Stores with depleted stock convert ${(avgConvOk - avgConvLow).toFixed(1)} percentage points lower on incoming footfall.`);
    } else {
      hypo2Status = 'not_supported';
      hypo2Observed = `Low-stock stores convert at ${avgConvLow}%, which is comparable or higher than adequate-stock stores (${avgConvOk}%).`;
      hypo2Contradict.push(`Shoppers at low-stock stores still completed purchases, suggesting depleted SKUs were non-essential or high sell-through was concentrated in remaining stock.`);
    }
  } else {
    hypo2Observed = `Dataset contains ${lowStockStores.length} low-stock store(s) and ${okStockStores.length} adequate-stock store(s). Need records in both categories to compare.`;
  }

  tests.push({
    id: 'hypo-stock-conversion',
    title: 'Stock Depletion vs Conversion Failure',
    statement: 'Stores experiencing inventory depletion exhibit lower customer conversion rates despite incoming footfall.',
    category: 'Sales & Inventory',
    comparisonMethod: 'Compare average conversion rate between Low Stock stores (stock-to-sales < 0.5x) and Adequate Stock stores (>= 0.5x).',
    recordsAnalyzed: analyses.length,
    groupA: {
      name: 'Low Stock Stores (<0.5x)',
      count: lowStockStores.length,
      metricLabel: 'Avg Conversion Rate (%)',
      metricValue: avgConvLow
    },
    groupB: {
      name: 'Adequate Stock Stores (>=0.5x)',
      count: okStockStores.length,
      metricLabel: 'Avg Conversion Rate (%)',
      metricValue: avgConvOk
    },
    resultStatus: hypo2Status,
    observedResult: hypo2Observed,
    supportingEvidence: hypo2Support,
    contradictingEvidence: hypo2Contradict,
    limitations: [
      'Customer footfall sensors may count non-shopping entries (e.g. companion shoppers, mall transit).',
      'Unobserved factors like local promotions or queue wait times could influence conversion.'
    ]
  });

  // --- TEST 3: Compliance vs Wastage ---
  const lowComplianceStores = analyses.filter(a => a.store.complianceScore < 75);
  const highComplianceStores = analyses.filter(a => a.store.complianceScore >= 75);

  let hypo3Status: HypothesisTest['resultStatus'] = 'insufficient_data';
  let hypo3Observed = '';
  const hypo3Support: string[] = [];
  const hypo3Contradict: string[] = [];
  let avgWasteLowComp: number | null = null;
  let avgWasteHighComp: number | null = null;

  if (lowComplianceStores.length > 0 && highComplianceStores.length > 0) {
    const sumLowComp = lowComplianceStores.reduce((acc, s) => acc + s.metrics.wastageRate, 0);
    const sumHighComp = highComplianceStores.reduce((acc, s) => acc + s.metrics.wastageRate, 0);
    avgWasteLowComp = Number((sumLowComp / lowComplianceStores.length).toFixed(1));
    avgWasteHighComp = Number((sumHighComp / highComplianceStores.length).toFixed(1));

    if (avgWasteLowComp > avgWasteHighComp) {
      hypo3Status = avgWasteLowComp > avgWasteHighComp * 1.5 ? 'supported' : 'partly_supported';
      hypo3Observed = `Stores with compliance < 75 average ${avgWasteLowComp}% wastage rate, versus ${avgWasteHighComp}% for compliant stores.`;
      hypo3Support.push(`Non-compliant stores experience ${(avgWasteLowComp - avgWasteHighComp).toFixed(1)} percentage points higher spoilage.`);
    } else {
      hypo3Status = 'not_supported';
      hypo3Observed = `Non-compliant stores average ${avgWasteLowComp}% wastage, which is not higher than compliant stores (${avgWasteHighComp}%).`;
      hypo3Contradict.push(`Stores with lower compliance scores did not show elevated spoilage in this snapshot, indicating compliance issues may be non-perishable (e.g. signage, dress code).`);
    }
  } else {
    hypo3Observed = `Dataset contains ${lowComplianceStores.length} low-compliance store(s) and ${highComplianceStores.length} compliant store(s). Need both groups to test.`;
  }

  tests.push({
    id: 'hypo-compliance-waste',
    title: 'Operational Compliance vs Perishable Wastage',
    statement: 'Stores with compliance scores below 75 suffer higher wastage rates due to handling or rotation deficits.',
    category: 'Operations & Wastage',
    comparisonMethod: 'Compare average wastage rate between Sub-75 Compliance stores and 75+ Compliance stores.',
    recordsAnalyzed: analyses.length,
    groupA: {
      name: 'Compliance < 75',
      count: lowComplianceStores.length,
      metricLabel: 'Avg Wastage Rate (%)',
      metricValue: avgWasteLowComp
    },
    groupB: {
      name: 'Compliance >= 75',
      count: highComplianceStores.length,
      metricLabel: 'Avg Wastage Rate (%)',
      metricValue: avgWasteHighComp
    },
    resultStatus: hypo3Status,
    observedResult: hypo3Observed,
    supportingEvidence: hypo3Support,
    contradictingEvidence: hypo3Contradict,
    limitations: [
      'Compliance score aggregates multiple criteria; specific food safety rotation sub-scores are not isolated.',
      'Seasonal weather and chiller equipment age may drive spoilage independently of staff compliance.'
    ]
  });

  return tests;
}

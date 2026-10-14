/**
 * FreshPulse AI — Recommendation Engine
 * Generates actionable interventions linked directly to detected risks and observed metrics.
 * Precomputes simulated impact parameters for the Approval Impact Preview.
 */

import { StoreRecord, ComputedMetrics, RiskAlert, ActionItem, PriorityScoreBreakdown } from '../types';

export function generateStoreActions(
  store: StoreRecord,
  metrics: ComputedMetrics,
  risks: RiskAlert[],
  scoring: PriorityScoreBreakdown
): ActionItem[] {
  const actions: ActionItem[] = [];
  const now = new Date().toISOString();

  risks.forEach((risk, index) => {
    let actionId = `act-${store.storeId}-${risk.category}-${index}`;
    let title = '';
    let description = '';
    let priority: ActionItem['priority'] = 'medium';
    let assumptions: string[] = [];
    let missingInfo: string[] = [];
    let projectedScoreDelta = 0;
    let estimatedRevenueAtRisk: number | null = null;
    let riskReductionDetails = '';
    let concreteFirstStep = '';
    let expectedOutcome = '';
    let monitoringMetrics: string[] = [];
    let feasibilityCheck = '';

    if (risk.category === 'inventory') {
      if (store.inventoryAvailable === 0 && store.inventorySold > 0) {
        title = `Execute Emergency Stock Transfer to Store ${store.storeId}`;
        description = `Initiate immediate network rebalancing or expedite direct-store delivery to resolve complete stockout.`;
        priority = 'urgent';
        concreteFirstStep = `Contact regional operations hub to initiate immediate cross-store transfer of high-velocity fresh produce units to Store ${store.storeId}.`;
        expectedOutcome = `Restore baseline inventory buffer within 3 hours, halting active lost checkout transactions.`;
        monitoringMetrics = [
          'Immediate shelf inventory unit count',
          'Hourly checkout transaction count',
          'Customer out-of-stock complaints / lost basket incidents'
        ];
        feasibilityCheck = 'Verify nearby store surplus availability and driver route transit within 120 minutes.';
        assumptions = [
          'A nearby franchise network store possesses surplus buffer in compatible inventory.',
          'Logistics dispatch can complete transit within current operational window.'
        ];
        missingInfo = [
          'Specific SKU-level breakdown (available if product CSV is uploaded).',
          'Current supplier lead time and transit cost.'
        ];
        projectedScoreDelta = 28; // clears complete stockout penalty
        // Est revenue at risk: estimated unserved transactions
        estimatedRevenueAtRisk = Number((store.inventorySold * 0.4 * Math.max(15, metrics.averageBasketSize)).toFixed(2));
        riskReductionDetails = 'Resolves 0-stock penalty, reducing inventory priority points from 30 down to nominal buffer level.';
      } else {
        title = `Request Expedited PO Replenishment for Store ${store.storeId}`;
        description = `Buffer coverage is under 0.35x daily run rate. Contact dispatch to expedite delivery.`;
        priority = 'high';
        concreteFirstStep = `Call logistics dispatch to verify carrier location and request expedited delivery slot for Store ${store.storeId}.`;
        expectedOutcome = `Lift stock coverage from ${metrics.stockToSalesRatio.toFixed(2)}x up to target 1.5x buffer before evening traffic rush.`;
        monitoringMetrics = [
          'Stock-to-sales coverage ratio',
          'Carrier revised ETA milestone',
          'Peak hour customer footfall to order conversion'
        ];
        feasibilityCheck = 'Confirm supplier distribution center has packed pallets ready for departure.';
        assumptions = ['Supplier has dispatched or ready inventory at central distribution hub.'];
        missingInfo = ['Exact transit milestone of current carrier.'];
        projectedScoreDelta = 16;
        estimatedRevenueAtRisk = Number((store.inventorySold * 0.2 * Math.max(15, metrics.averageBasketSize)).toFixed(2));
        riskReductionDetails = 'Restores inventory buffer to safe threshold, reducing priority score by ~16 points.';
      }
    } else if (risk.category === 'supply_chain') {
      title = `Escalate PO Status "${store.purchaseOrderStatus}" to Franchise Logistics`;
      description = `Supplier replenishment order is delayed. Coordinate with central dispatch or re-route from regional warehouse.`;
      priority = risk.severity === 'critical' ? 'urgent' : 'high';
      concreteFirstStep = `Issue formal priority logistics ticket to supplier vendor desk and trigger emergency depot release.`;
      expectedOutcome = `Confirm hard delivery arrival within 180 minutes or re-route buffer stock from regional backup warehouse.`;
      monitoringMetrics = [
        'Carrier dispatch GPS status',
        'Receiving dock intake check-in time',
        'Remaining buffer depletion rate'
      ];
      feasibilityCheck = 'Check carrier SLA penalty clauses and depot inventory availability.';
      assumptions = ['Central distribution center has alternate delivery slots available today.'];
      missingInfo = ['Vendor contract SLA penalty clauses and driver route tracking.'];
      projectedScoreDelta = risk.severity === 'critical' ? 15 : 10;
      estimatedRevenueAtRisk = Number((store.totalSales * 0.15).toFixed(2));
      riskReductionDetails = 'Clears supplier delay risk points upon logistics confirmation.';
    } else if (risk.category === 'wastage') {
      title = `Implement Fresh Produce Markdown & Cold-Chain Audit`;
      description = `Immediate floor audit of refrigeration units and apply 30% markdown on nearing-expiry perishable inventory.`;
      priority = risk.severity === 'critical' ? 'urgent' : 'high';
      concreteFirstStep = `Instruct Store ${store.storeId} floor manager to inspect all walk-in chillers and affix yellow promotional discount stickers on perishable items nearing expiry.`;
      expectedOutcome = `Recover 60% of at-risk perishable margin and drop wastage rate from ${metrics.wastageRate.toFixed(1)}% toward franchise tolerance (<5%).`;
      monitoringMetrics = [
        'Daily discarded wastage units count',
        'Discounted product sell-through percentage',
        'Chiller temperature log consistency (target 2°C - 4°C)'
      ];
      feasibilityCheck = 'Ensure POS markdown barcodes are active and staff is scheduled for rotation.';
      assumptions = [
        'Markdowns stimulate impulse volume before items reach complete spoilage.',
        'Store staff execute proper shelf rotation (FIFO) following protocol.'
      ];
      missingInfo = ['Batch harvest dates and chiller hourly temperature telemetry.'];
      projectedScoreDelta = risk.severity === 'critical' ? 18 : 10;
      // Est revenue at risk: wastage items valued at avg unit price or basket proportion
      estimatedRevenueAtRisk = Number((store.wastageQuantity * 4.5).toFixed(2));
      riskReductionDetails = 'Mitigates perishable spoilage loss, lowering wastage risk score by 10-18 points.';
    } else if (risk.category === 'sales') {
      title = `Audit Shelf Availability & Optimize Checkout Queuing`;
      description = `Investigate low conversion (${metrics.conversionRate.toFixed(1)}%). Recheck shelf facings for key traffic-drivers and open auxiliary checkout counter.`;
      priority = 'high';
      concreteFirstStep = `Conduct immediate 15-minute floor walk to verify prime display facings are fully stocked and open secondary cash register.`;
      expectedOutcome = `Lift conversion rate from ${metrics.conversionRate.toFixed(1)}% toward network target (>35%), capturing $${Number((store.footfall * 0.1 * Math.max(15, metrics.averageBasketSize)).toFixed(0))} in missed sales.`;
      monitoringMetrics = [
        'Hourly visitor-to-transaction conversion rate',
        'Checkout queue length / wait time',
        'Prime shelf facings restock frequency'
      ];
      feasibilityCheck = 'Verify cross-trained staff member is present to staff auxiliary register.';
      assumptions = [
        'Customer traffic footfall counter is calibrated accurately.',
        'Shoppers did not purchase primarily due to queue friction or out-of-stock essentials.'
      ];
      missingInfo = ['Customer dwell time and shelf-level camera telemetry.'];
      projectedScoreDelta = 12;
      estimatedRevenueAtRisk = Number((store.footfall * 0.1 * Math.max(15, metrics.averageBasketSize)).toFixed(2));
      riskReductionDetails = 'Lifting conversion closer to benchmark reduces sales penalty by 11-16 points.';
    } else if (risk.category === 'operations') {
      title = `Dispatch Regional Compliance Supervisor Checklist`;
      description = `Store compliance score (${store.complianceScore}/100) indicates standard deficit. Initiate corrective audit actions.`;
      priority = store.complianceScore < 60 ? 'urgent' : 'medium';
      concreteFirstStep = `Send standardized operational hygiene and food safety checklist to store lead and require photo verification within 4 hours.`;
      expectedOutcome = `Resolve operational standard infractions and elevate store audit compliance above 80/100 threshold.`;
      monitoringMetrics = [
        'Audit checklist remediation completion rate',
        'Customer hygiene feedback score',
        'Supervisor verification sign-off'
      ];
      feasibilityCheck = 'Ensure regional supervisor is on duty to review submitted checklist photos.';
      assumptions = ['Deficits are addressable within standard supervisory shift without structural capital expenditure.'];
      missingInfo = ['Specific sub-item audit checklist infractions.'];
      projectedScoreDelta = 7;
      estimatedRevenueAtRisk = null; // Uncalculable from raw sales alone
      riskReductionDetails = 'Addresses compliance infractions, bringing score back toward 75+ baseline.';
    }

    const projectedScore = Math.max(0, scoring.totalScore - projectedScoreDelta);

    actions.push({
      id: actionId,
      storeId: store.storeId,
      storeName: store.storeName,
      title,
      description,
      priority,
      category: risk.category,
      status: 'pending',
      supportingEvidence: risk.observedEvidence,
      rationale: `${risk.description} (Potential cause: ${risk.potentialCause})`,
      requiredAssumptions: assumptions,
      missingInformation: missingInfo,
      createdAt: now,
      concreteFirstStep,
      expectedOutcome,
      monitoringMetrics,
      feasibilityCheck,
      simulatedImpact: {
        currentScore: scoring.totalScore,
        projectedScore,
        estimatedRevenueAtRisk,
        riskReductionDetails: `${riskReductionDetails} Projected score drops from ${scoring.totalScore} to ${projectedScore}.`
      }
    });
  });

  return actions;
}

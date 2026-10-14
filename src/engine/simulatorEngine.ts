/**
 * FreshPulse AI — Scenario Simulation Engine
 * Powers What-If Simulator and Approval Impact Preview.
 * Recalculates metrics and priority scores under hypothetical adjustments.
 * STRICT ISOLATION: Never mutates the source store dataset.
 */

import { StoreRecord, ComputedMetrics, PriorityScoreBreakdown, RiskAlert } from '../types';
import { calculateStoreMetrics } from './metrics';
import { evaluateStoreRisks } from './riskEngine';
import { calculatePriorityScore } from './scoringEngine';

export interface SimulationParams {
  inventoryAdjustment: number; // e.g. +50 units from transfer or delivery
  poStatusAdjustment?: StoreRecord['purchaseOrderStatus'];
  staffAdjustment: number; // e.g. +1 employee
  complianceAdjustment: number; // e.g. +10 audit points
  wastageReductionUnits: number; // e.g. -20 units saved from markdown
}

export interface SimulationResult {
  originalStore: StoreRecord;
  simulatedStore: StoreRecord;
  originalMetrics: ComputedMetrics;
  simulatedMetrics: ComputedMetrics;
  originalScore: PriorityScoreBreakdown;
  simulatedScore: PriorityScoreBreakdown;
  scoreDifference: number; // original - simulated (positive means improvement)
  eliminatedRisks: string[];
  remainingRisks: string[];
  assumptionsUsed: string[];
  caveats: string[];
}

export function simulateStoreScenario(
  store: StoreRecord,
  params: SimulationParams
): SimulationResult {
  // Compute original
  const origMetrics = calculateStoreMetrics(store);
  const origRisks = evaluateStoreRisks(store, origMetrics);
  const origScore = calculatePriorityScore(store, origMetrics);

  // Construct hypothetical store record
  const simAvailable = Math.max(0, store.inventoryAvailable + params.inventoryAdjustment);
  const simStaff = Math.max(1, store.staffCount + params.staffAdjustment);
  const simCompliance = Math.min(100, Math.max(0, store.complianceScore + params.complianceAdjustment));
  const simWastage = Math.max(0, store.wastageQuantity - params.wastageReductionUnits);
  const simPO = params.poStatusAdjustment || store.purchaseOrderStatus;

  const simulatedStore: StoreRecord = {
    ...store,
    inventoryAvailable: simAvailable,
    staffCount: simStaff,
    complianceScore: simCompliance,
    wastageQuantity: simWastage,
    purchaseOrderStatus: simPO
  };

  // Recalculate deterministic metrics & risks on hypothetical record
  const simMetrics = calculateStoreMetrics(simulatedStore);
  const simRisks = evaluateStoreRisks(simulatedStore, simMetrics);
  const simScore = calculatePriorityScore(simulatedStore, simMetrics);

  // Identify eliminated risks
  const origRiskTitles = new Set(origRisks.map(r => r.title));
  const simRiskTitles = new Set(simRisks.map(r => r.title));

  const eliminatedRisks: string[] = [];
  origRiskTitles.forEach(title => {
    if (!simRiskTitles.has(title)) {
      eliminatedRisks.push(title);
    }
  });

  const remainingRisks = simRisks.map(r => r.title);

  // Assumptions used
  const assumptionsUsed: string[] = [];
  if (params.inventoryAdjustment > 0) {
    assumptionsUsed.push(`Assumed delivery / transfer of +${params.inventoryAdjustment} units arrives and is stocked immediately.`);
  }
  if (params.poStatusAdjustment && params.poStatusAdjustment !== store.purchaseOrderStatus) {
    assumptionsUsed.push(`Assumed Purchase Order status successfully updated to "${params.poStatusAdjustment}".`);
  }
  if (params.staffAdjustment > 0) {
    assumptionsUsed.push(`Assumed +${params.staffAdjustment} staff member is rostered on active shift without onboarding friction.`);
  }
  if (params.complianceAdjustment > 0) {
    assumptionsUsed.push(`Assumed supervisor audit intervention lifts compliance by +${params.complianceAdjustment} points.`);
  }
  if (params.wastageReductionUnits > 0) {
    assumptionsUsed.push(`Assumed markdown execution saves ${params.wastageReductionUnits} units of produce from complete spoilage.`);
  }

  const caveats: string[] = [
    'Scenario estimate — not a guaranteed outcome.',
    'Assumes consumer demand remains stationary during intervention period.',
    'Does not account for logistics delay, transit costs, or staff absenteeism in real world execution.'
  ];

  return {
    originalStore: store,
    simulatedStore,
    originalMetrics: origMetrics,
    simulatedMetrics: simMetrics,
    originalScore: origScore,
    simulatedScore: simScore,
    scoreDifference: origScore.totalScore - simScore.totalScore,
    eliminatedRisks,
    remainingRisks,
    assumptionsUsed,
    caveats
  };
}

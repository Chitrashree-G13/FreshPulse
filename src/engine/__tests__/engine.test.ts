/**
 * FreshPulse AI — Unit Tests (Vitest)
 * Tests core calculation logic, validation, zero-value safety,
 * deterministic scoring, stock transfer matching, and scenario simulations.
 */

import { describe, it, expect } from 'vitest';
import { validateStoreInput, parseStoreCSV } from '../validator';
import { calculateStoreMetrics, calculateNetworkSummary } from '../metrics';
import { calculatePriorityScore } from '../scoringEngine';
import { evaluateStoreRisks } from '../riskEngine';
import { matchNetworkStockTransfers } from '../transferEngine';
import { runHypothesisTests } from '../hypothesisEngine';
import { simulateStoreScenario } from '../simulatorEngine';
import { analyzeStore } from '../pipeline';
import { StoreRecord } from '../../types';

describe('Validation Engine', () => {
  it('distinguishes valid zero values from missing or invalid fields', () => {
    const validWithZeros = {
      storeId: 'STORE-001',
      storeName: 'Test Store Alpha',
      location: 'Test Location',
      analysisDate: '2026-10-09',
      totalSales: 0, // 0 sales is valid!
      transactions: 0,
      footfall: 0,
      inventoryAvailable: 0,
      inventorySold: 0,
      wastageQuantity: 0,
      purchaseOrderStatus: 'On Time' as const,
      staffCount: 1,
      complianceScore: 80
    };

    const result = validateStoreInput(validWithZeros);
    expect(result.isValid).toBe(true);
    expect(result.record).not.toBeNull();
    expect(result.record?.totalSales).toBe(0);
    expect(result.record?.wastageQuantity).toBe(0);
  });

  it('rejects missing required fields', () => {
    const invalidInput = {
      storeId: '',
      storeName: 'Missing Fields Store'
    };

    const result = validateStoreInput(invalidInput);
    expect(result.isValid).toBe(false);
    expect(result.errors.storeId).toBeDefined();
    expect(result.errors.totalSales).toBeDefined();
  });

  it('rejects out-of-range compliance scores', () => {
    const invalidCompliance = {
      storeId: 'S-1',
      storeName: 'Store 1',
      location: 'Loc',
      analysisDate: '2026-10-09',
      totalSales: 100,
      transactions: 10,
      footfall: 20,
      inventoryAvailable: 50,
      inventorySold: 10,
      wastageQuantity: 2,
      purchaseOrderStatus: 'On Time' as const,
      staffCount: 2,
      complianceScore: 150 // Invalid: > 100
    };

    const result = validateStoreInput(invalidCompliance);
    expect(result.isValid).toBe(false);
    expect(result.errors.complianceScore).toBeDefined();
  });

  it('parses CSV content and detects headers properly', () => {
    const csv = `store_id,store_name,location,analysis_date,total_sales,transactions,footfall,inventory_available,inventory_sold,wastage_quantity,purchase_order_status,staff_count,compliance_score
FB-901,Highland Store,North Zone,2026-10-09,5400,220,400,350,180,12,On Time,5,88`;

    const { records, summary } = parseStoreCSV(csv);
    expect(records.length).toBe(1);
    expect(records[0].storeId).toBe('FB-901');
    expect(records[0].totalSales).toBe(5400);
    expect(summary.validRows).toBe(1);
  });
});

describe('Metrics Engine', () => {
  it('safely handles zero footfall and zero transactions without NaN', () => {
    const store: StoreRecord = {
      storeId: 'S-ZERO',
      storeName: 'Zero Traffic Store',
      location: 'Quiet Mall',
      analysisDate: '2026-10-09',
      totalSales: 0,
      transactions: 0,
      footfall: 0,
      inventoryAvailable: 100,
      inventorySold: 0,
      wastageQuantity: 0,
      purchaseOrderStatus: 'Delivered',
      staffCount: 2,
      complianceScore: 90
    };

    const metrics = calculateStoreMetrics(store);
    expect(metrics.averageBasketSize).toBe(0);
    expect(metrics.conversionRate).toBe(0);
    expect(metrics.sellThroughRate).toBe(0);
    expect(metrics.wastageRate).toBe(0);
    expect(isNaN(metrics.conversionRate)).toBe(false);
  });

  it('accurately calculates basket size and conversion rate', () => {
    const store: StoreRecord = {
      storeId: 'S-NORMAL',
      storeName: 'Normal Store',
      location: 'Central Plaza',
      analysisDate: '2026-10-09',
      totalSales: 5000,
      transactions: 200,
      footfall: 500,
      inventoryAvailable: 300,
      inventorySold: 150,
      wastageQuantity: 10,
      purchaseOrderStatus: 'On Time',
      staffCount: 4,
      complianceScore: 85
    };

    const metrics = calculateStoreMetrics(store);
    expect(metrics.averageBasketSize).toBe(25); // 5000 / 200
    expect(metrics.conversionRate).toBe(40); // 200 / 500 = 40%
    expect(metrics.stockToSalesRatio).toBe(2); // 300 / 150
  });
});

describe('Priority Scoring & Determinism', () => {
  const storeA: StoreRecord = {
    storeId: 'S-CRIT',
    storeName: 'Crisis Store',
    location: 'Westside',
    analysisDate: '2026-10-09',
    totalSales: 800,
    transactions: 20,
    footfall: 200, // low conversion
    inventoryAvailable: 0, // complete stockout
    inventorySold: 120,
    wastageQuantity: 45, // high wastage
    purchaseOrderStatus: 'Critical Delay',
    staffCount: 1,
    complianceScore: 40 // severe audit failure
  };

  it('produces identical deterministic scores for identical inputs', () => {
    const metrics1 = calculateStoreMetrics(storeA);
    const score1 = calculatePriorityScore(storeA, metrics1);

    const metrics2 = calculateStoreMetrics(storeA);
    const score2 = calculatePriorityScore(storeA, metrics2);

    expect(score1.totalScore).toBe(score2.totalScore);
    expect(score1.inventoryRiskPoints).toBe(score2.inventoryRiskPoints);
    expect(score1.totalScore).toBeGreaterThanOrEqual(75); // Critical urgency
  });

  it('clamps scores between 0 and 100', () => {
    const metrics = calculateStoreMetrics(storeA);
    const score = calculatePriorityScore(storeA, metrics);
    expect(score.totalScore).toBeLessThanOrEqual(100);
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Stock Transfer Matcher', () => {
  it('returns empty with clear diagnostic when only 1 store is uploaded', () => {
    const singleStore: StoreRecord = {
      storeId: 'STORE-SOLO',
      storeName: 'Solo Store',
      location: 'Suburbs',
      analysisDate: '2026-10-09',
      totalSales: 2000,
      transactions: 100,
      footfall: 250,
      inventoryAvailable: 10,
      inventorySold: 80,
      wastageQuantity: 5,
      purchaseOrderStatus: 'Delayed',
      staffCount: 3,
      complianceScore: 80
    };

    const analysis = analyzeStore(singleStore);
    const { proposals, diagnosticMessage } = matchNetworkStockTransfers([analysis]);

    expect(proposals.length).toBe(0);
    expect(diagnosticMessage).toContain('requires at least 2 stores');
  });

  it('matches receiving shortage store with surplus source store', () => {
    const receivingStore: StoreRecord = {
      storeId: 'S-SHORT',
      storeName: 'Deficit Store',
      location: 'North Zone',
      analysisDate: '2026-10-09',
      totalSales: 3000,
      transactions: 120,
      footfall: 300,
      inventoryAvailable: 0, // stockout
      inventorySold: 100,
      wastageQuantity: 2,
      purchaseOrderStatus: 'Delayed',
      staffCount: 4,
      complianceScore: 90
    };

    const surplusStore: StoreRecord = {
      storeId: 'S-SURPLUS',
      storeName: 'Surplus Store',
      location: 'South Zone',
      analysisDate: '2026-10-09',
      totalSales: 4000,
      transactions: 150,
      footfall: 350,
      inventoryAvailable: 400, // surplus coverage
      inventorySold: 100,
      wastageQuantity: 4,
      purchaseOrderStatus: 'Delivered',
      staffCount: 4,
      complianceScore: 92
    };

    const analyses = [analyzeStore(receivingStore), analyzeStore(surplusStore)];
    const { proposals } = matchNetworkStockTransfers(analyses);

    expect(proposals.length).toBeGreaterThanOrEqual(1);
    expect(proposals[0].sourceStoreId).toBe('S-SURPLUS');
    expect(proposals[0].destStoreId).toBe('S-SHORT');
    expect(proposals[0].proposedTransferQuantity).toBeGreaterThan(0);
  });
});

describe('What-If Scenario Simulation', () => {
  it('does not mutate original store record during simulation', () => {
    const original: StoreRecord = {
      storeId: 'S-SIM',
      storeName: 'Sim Store',
      location: 'Plaza',
      analysisDate: '2026-10-09',
      totalSales: 2000,
      transactions: 80,
      footfall: 200,
      inventoryAvailable: 5, // low stock
      inventorySold: 50,
      wastageQuantity: 20, // high waste
      purchaseOrderStatus: 'Critical Delay',
      staffCount: 1,
      complianceScore: 60
    };

    const initialAvailable = original.inventoryAvailable;
    const initialPO = original.purchaseOrderStatus;

    const result = simulateStoreScenario(original, {
      inventoryAdjustment: 50,
      poStatusAdjustment: 'Delivered',
      staffAdjustment: 1,
      complianceAdjustment: 20,
      wastageReductionUnits: 15
    });

    // Original must remain untouched!
    expect(original.inventoryAvailable).toBe(initialAvailable);
    expect(original.purchaseOrderStatus).toBe(initialPO);

    // Simulated score should show improvement
    expect(result.simulatedScore.totalScore).toBeLessThan(result.originalScore.totalScore);
    expect(result.scoreDifference).toBeGreaterThan(0);
    expect(result.caveats[0]).toContain('Scenario estimate');
  });
});

describe('Store Storage Utility & Analysis Contract', () => {
  it('saves, updates, and deletes stores without duplicates', async () => {
    const { getSavedStores, saveStore, updateStore, deleteStore, clearStorageKey, SAVED_STORES_STORAGE_KEY } = await import('../../store/storeStore');
    const { analyzeAll } = await import('../pipeline');

    // Clean initial
    clearStorageKey(SAVED_STORES_STORAGE_KEY);
    expect(getSavedStores().length).toBe(0);

    const testStore: StoreRecord = {
      storeId: 'FP-TEST-01',
      storeName: 'Test Market',
      location: 'Downtown',
      analysisDate: '2026-10-09',
      totalSales: 3500,
      transactions: 140,
      footfall: 350,
      inventoryAvailable: 200,
      inventorySold: 120,
      wastageQuantity: 10,
      purchaseOrderStatus: 'On Time',
      staffCount: 4,
      complianceScore: 88
    };

    // 1. Save store
    const saveRes = saveStore(testStore);
    expect(saveRes.success).toBe(true);
    expect(getSavedStores().length).toBe(1);

    // 2. Prevent duplicate storeId
    const dupRes = saveStore(testStore);
    expect(dupRes.success).toBe(false);
    expect(dupRes.isDuplicate).toBe(true);
    expect(getSavedStores().length).toBe(1);

    // 3. Update store
    const updatedStore = { ...testStore, storeName: 'Updated Test Market', totalSales: 4200 };
    const updateRes = updateStore(updatedStore);
    expect(updateRes.success).toBe(true);
    const saved = getSavedStores();
    expect(saved[0].storeName).toBe('Updated Test Market');
    expect(saved[0].totalSales).toBe(4200);

    // 4. Run analyzeAll contract
    const analysisRes = await analyzeAll({ stores: [updatedStore] });
    expect(analysisRes.analyses.length).toBe(1);
    expect(analysisRes.analyses[0].store.storeId).toBe('FP-TEST-01');
    expect(analysisRes.networkSummary.totalSales).toBe(4200);

    // 5. Delete store
    const delRes = deleteStore('FP-TEST-01');
    expect(delRes.success).toBe(true);
    expect(getSavedStores().length).toBe(0);
  });
});

describe('Decision-First Retail Prioritization & 7 Questions', () => {
  it('automatically ranks stores by highest business risk and answers the 7 core questions', async () => {
    const { runFullPipeline } = await import('../pipeline');

    const criticalStore: StoreRecord = {
      storeId: 'FP-CRIT',
      storeName: 'Emergency Depleted Hub',
      location: 'Central Concourse',
      analysisDate: '2026-10-09',
      totalSales: 4000,
      transactions: 160,
      footfall: 400,
      inventoryAvailable: 0, // 0 stock = severe stockout
      inventorySold: 150,
      wastageQuantity: 5,
      purchaseOrderStatus: 'Critical Delay',
      staffCount: 5,
      complianceScore: 82
    };

    const healthyStore: StoreRecord = {
      storeId: 'FP-HEALTHY',
      storeName: 'Balanced Operations Store',
      location: 'Suburban Plaza',
      analysisDate: '2026-10-09',
      totalSales: 5000,
      transactions: 200,
      footfall: 450,
      inventoryAvailable: 300,
      inventorySold: 150,
      wastageQuantity: 4,
      purchaseOrderStatus: 'Delivered',
      staffCount: 5,
      complianceScore: 92
    };

    const results = runFullPipeline([healthyStore, criticalStore]);

    // 1. Critical store must rank #1 even if passed second in the array
    expect(results[0].store.storeId).toBe('FP-CRIT');
    expect(results[0].rank).toBe(1);
    expect(results[0].urgencyLevel).toBe('Critical');
    expect(results[0].priorityScore).toBeGreaterThan(results[1].priorityScore);

    // 2. Healthy store must rank #2
    expect(results[1].store.storeId).toBe('FP-HEALTHY');
    expect(results[1].rank).toBe(2);

    // 3. 7 Core Questions answered with actual data
    const top = results[0];
    expect(top.coreAnswers.q1WhichStore).toContain('FP-CRIT');
    expect(top.coreAnswers.q1WhichStore).toContain('FIRST');
    expect(top.coreAnswers.q2WhatProblem).toContain('Stock Depletion');
    expect(top.coreAnswers.q3WhatEvidence).toContain('0 available units');
    expect(top.coreAnswers.q4WhyMoreUrgent).toContain('ZERO stock');
    expect(top.coreAnswers.q5BusinessImpact).toContain('revenue loss');
    expect(top.coreAnswers.q6ActionFirst.length).toBeGreaterThan(10);
    expect(top.coreAnswers.q7WhatToMonitor.length).toBeGreaterThan(5);

    // 4. Root cause analysis contains ruled out causes
    expect(top.rootCauseAnalysis.ruledOutCauses.some(c => c.includes('Footfall traffic collapse is RULED OUT'))).toBe(true);
    expect(top.rootCauseAnalysis.ruledOutCauses.some(c => c.includes('Severe staff shortage is RULED OUT'))).toBe(true);

    // 5. Actions have concrete steps, expected outcomes, and monitoring metrics
    expect(top.actions.length).toBeGreaterThan(0);
    const act = top.actions[0];
    expect(act.concreteFirstStep).toBeDefined();
    expect(act.concreteFirstStep!.length).toBeGreaterThan(10);
    expect(act.expectedOutcome).toBeDefined();
    expect(act.monitoringMetrics).toBeDefined();
    expect(act.monitoringMetrics!.length).toBeGreaterThan(0);
    expect(act.feasibilityCheck).toBeDefined();
  });
});


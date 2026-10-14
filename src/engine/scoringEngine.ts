/**
 * FreshPulse AI — Transparent Priority Scoring Engine
 * Generates an explainable 0–100 Priority Score with itemized point breakdown.
 * A score is a deterministic operational priority index, NOT an uncalibrated probability.
 */

import { StoreRecord, ComputedMetrics, PriorityScoreBreakdown } from '../types';

export function calculatePriorityScore(
  store: StoreRecord,
  metrics: ComputedMetrics
): PriorityScoreBreakdown {
  // 1. Inventory Points (Max 30)
  let inventoryRiskPoints = 0;
  if (store.inventoryAvailable === 0 && store.inventorySold > 0) {
    inventoryRiskPoints = 30;
  } else if (metrics.stockToSalesRatio < 0.25 && store.inventorySold > 0) {
    inventoryRiskPoints = 24;
  } else if (metrics.stockToSalesRatio < 0.5 && store.inventorySold > 0) {
    inventoryRiskPoints = 16;
  } else if (metrics.stockToSalesRatio < 0.8 && store.inventorySold > 0) {
    inventoryRiskPoints = 8;
  } else if (store.inventoryAvailable > 500 && metrics.stockToSalesRatio > 4) {
    // Overstock risk penalty
    inventoryRiskPoints = 10;
  }

  // 2. Wastage Points (Max 25)
  let wastageRiskPoints = 0;
  if (metrics.wastageRate > 15) {
    wastageRiskPoints = 25;
  } else if (metrics.wastageRate > 10) {
    wastageRiskPoints = 18;
  } else if (metrics.wastageRate > 5) {
    wastageRiskPoints = 10;
  } else if (metrics.wastageRate > 2) {
    wastageRiskPoints = 4;
  }

  // 3. Sales & Conversion Disparity (Max 20)
  let salesConversionPoints = 0;
  if (store.footfall > 0 && store.transactions === 0) {
    salesConversionPoints = 20;
  } else if (store.footfall >= 50) {
    if (metrics.conversionRate < 15) {
      salesConversionPoints = 16;
    } else if (metrics.conversionRate < 25) {
      salesConversionPoints = 11;
    } else if (metrics.conversionRate < 35) {
      salesConversionPoints = 5;
    }
  }

  // 4. Supply Chain / PO Disruption (Max 15)
  let supplyChainPoints = 0;
  if (store.purchaseOrderStatus === 'Critical Delay') {
    supplyChainPoints = 15;
  } else if (store.purchaseOrderStatus === 'Delayed') {
    supplyChainPoints = 10;
  } else if (store.purchaseOrderStatus === 'Cancelled') {
    supplyChainPoints = 12;
  } else if (store.purchaseOrderStatus === 'Pending' && store.inventoryAvailable < 30) {
    supplyChainPoints = 6;
  }

  // 5. Compliance & Store Standards (Max 10)
  let compliancePoints = 0;
  if (store.complianceScore < 50) {
    compliancePoints = 10;
  } else if (store.complianceScore < 70) {
    compliancePoints = 7;
  } else if (store.complianceScore < 80) {
    compliancePoints = 4;
  }

  const rawTotal =
    inventoryRiskPoints +
    wastageRiskPoints +
    salesConversionPoints +
    supplyChainPoints +
    compliancePoints;

  const totalScore = Math.min(100, Math.max(0, rawTotal));

  // Determine dominant factor
  const pointCategories = [
    { name: 'Inventory Shortage / Imbalance', points: inventoryRiskPoints, weight: 30 },
    { name: 'Wastage & Spoilage Surge', points: wastageRiskPoints, weight: 25 },
    { name: 'Customer Conversion Deficit', points: salesConversionPoints, weight: 20 },
    { name: 'Supplier / PO Delivery Delays', points: supplyChainPoints, weight: 15 },
    { name: 'Operations & Compliance Deficit', points: compliancePoints, weight: 10 }
  ];

  pointCategories.sort((a, b) => (b.points / b.weight) - (a.points / a.weight));
  const dominantRiskFactor = totalScore > 0 ? pointCategories[0].name : 'Operations Nominal (Low Risk)';

  return {
    inventoryRiskPoints,
    wastageRiskPoints,
    salesConversionPoints,
    supplyChainPoints,
    compliancePoints,
    totalScore,
    dominantRiskFactor
  };
}

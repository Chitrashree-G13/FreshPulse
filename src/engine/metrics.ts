/**
 * FreshPulse AI — Metric Calculation Engine
 * Deterministic formulas for store and franchise-level metrics.
 * Safely handles zero denominators without throwing or producing NaN.
 */

import { StoreRecord, ComputedMetrics, NetworkSummary, StoreAnalysis } from '../types';

export function calculateStoreMetrics(record: StoreRecord): ComputedMetrics {
  // Basket Size ($ / txn)
  const averageBasketSize = record.transactions > 0
    ? Number((record.totalSales / record.transactions).toFixed(2))
    : 0;

  // Conversion Rate (%): transactions / footfall
  const conversionRate = record.footfall > 0
    ? Number(((record.transactions / record.footfall) * 100).toFixed(2))
    : 0;

  // Sell-Through Rate (%): sold / (sold + available)
  const totalHandledStock = record.inventorySold + record.inventoryAvailable;
  const sellThroughRate = totalHandledStock > 0
    ? Number(((record.inventorySold / totalHandledStock) * 100).toFixed(2))
    : 0;

  // Wastage Rate (%): wastage / (sold + wastage)
  const totalConsumedStock = record.inventorySold + record.wastageQuantity;
  const wastageRate = totalConsumedStock > 0
    ? Number(((record.wastageQuantity / totalConsumedStock) * 100).toFixed(2))
    : 0;

  // Sales per Staff ($ / employee)
  const salesPerStaff = record.staffCount > 0
    ? Number((record.totalSales / record.staffCount).toFixed(2))
    : 0;

  // Stock-to-Sales Ratio (available / sold)
  const stockToSalesRatio = record.inventorySold > 0
    ? Number((record.inventoryAvailable / record.inventorySold).toFixed(2))
    : record.inventoryAvailable > 0 ? 999 : 0;

  // Inventory Health Score (0-100):
  // Balances healthy sell-through (target ~50-80%), low wastage (<5%), and adequate stock buffer.
  let healthScore = 100;

  // Penalize excessive wastage: > 10% wastage deducts up to 40 pts
  if (wastageRate > 15) {
    healthScore -= 40;
  } else if (wastageRate > 8) {
    healthScore -= 25;
  } else if (wastageRate > 4) {
    healthScore -= 10;
  }

  // Penalize stock depletion (stockout danger) or extreme overstock
  if (record.inventoryAvailable === 0 && record.inventorySold > 0) {
    healthScore -= 40; // completely stocked out
  } else if (stockToSalesRatio < 0.25 && record.inventorySold > 0) {
    healthScore -= 30; // critically low buffer
  } else if (stockToSalesRatio < 0.6) {
    healthScore -= 15;
  } else if (stockToSalesRatio > 4 && record.inventoryAvailable > 100) {
    healthScore -= 20; // severe overstock
  }

  // Penalize supplier delays
  if (record.purchaseOrderStatus === 'Critical Delay') {
    healthScore -= 20;
  } else if (record.purchaseOrderStatus === 'Delayed') {
    healthScore -= 10;
  }

  const inventoryHealthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  return {
    averageBasketSize,
    conversionRate,
    sellThroughRate,
    wastageRate,
    salesPerStaff,
    stockToSalesRatio,
    inventoryHealthScore
  };
}

/**
 * Calculates aggregate network summary across all uploaded stores
 */
export function calculateNetworkSummary(analyses: StoreAnalysis[]): NetworkSummary {
  if (analyses.length === 0) {
    return {
      totalStores: 0,
      totalSales: 0,
      totalTransactions: 0,
      totalFootfall: 0,
      totalWastageUnits: 0,
      totalAvailableStock: 0,
      averageConversionRate: 0,
      averageComplianceScore: 0,
      storesRequiringAttention: 0,
      criticalStoresCount: 0,
      totalOpenActions: 0
    };
  }

  let totalSales = 0;
  let totalTransactions = 0;
  let totalFootfall = 0;
  let totalWastageUnits = 0;
  let totalAvailableStock = 0;
  let sumConversion = 0;
  let sumCompliance = 0;
  let storesRequiringAttention = 0;
  let criticalStoresCount = 0;
  let totalOpenActions = 0;

  analyses.forEach(a => {
    totalSales += a.store.totalSales;
    totalTransactions += a.store.transactions;
    totalFootfall += a.store.footfall;
    totalWastageUnits += a.store.wastageQuantity;
    totalAvailableStock += a.store.inventoryAvailable;
    sumConversion += a.metrics.conversionRate;
    sumCompliance += a.store.complianceScore;
    if (a.priorityScore >= 50) storesRequiringAttention++;
    if (a.priorityScore >= 75) criticalStoresCount++;
    totalOpenActions += a.actions.filter(act => act.status === 'pending').length;
  });

  const count = analyses.length;

  return {
    totalStores: count,
    totalSales: Number(totalSales.toFixed(2)),
    totalTransactions,
    totalFootfall,
    totalWastageUnits,
    totalAvailableStock,
    averageConversionRate: Number((sumConversion / count).toFixed(2)),
    averageComplianceScore: Number((sumCompliance / count).toFixed(1)),
    storesRequiringAttention,
    criticalStoresCount,
    totalOpenActions
  };
}

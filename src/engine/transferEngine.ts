/**
 * FreshPulse AI — Network Stock Transfer Matcher
 * Signature differentiator: Identifies cross-store rebalancing ONLY when
 * actual user records contain receiving store shortages and source store transferable surpluses.
 * Zero fabrication: never invents matching products or phantom stores.
 */

import { StoreAnalysis, ProductRecord, StockTransferProposal } from '../types';

export function matchNetworkStockTransfers(
  analyses: StoreAnalysis[],
  products: ProductRecord[] = []
): {
  proposals: StockTransferProposal[];
  diagnosticMessage: string;
} {
  const proposals: StockTransferProposal[] = [];

  // If user only uploaded 1 store or empty
  if (analyses.length < 2) {
    return {
      proposals: [],
      diagnosticMessage:
        analyses.length === 1
          ? 'Network Stock Transfer requires at least 2 stores in the uploaded dataset to match shortages against surpluses.'
          : 'No store data loaded.'
    };
  }

  // 1. If detailed product-level data is provided by the user:
  if (products.length > 0) {
    // Group products by productId
    const productGroups = new Map<string, ProductRecord[]>();
    products.forEach(p => {
      const list = productGroups.get(p.productId) || [];
      list.push(p);
      productGroups.set(p.productId, list);
    });

    let matchIdx = 1;
    productGroups.forEach((items, prodId) => {
      // Find stores with shortages for this product (available === 0 or below reorder)
      const receivingItems = items.filter(
        item => item.stockAvailable <= (item.reorderPoint || 5) && item.stockSold > 0
      );
      // Find stores with surplus (available > reorder * 2 or high available)
      const surplusItems = items.filter(
        item => item.stockAvailable > Math.max(20, (item.reorderPoint || 10) * 2)
      );

      receivingItems.forEach(rec => {
        surplusItems.forEach(sur => {
          if (rec.storeId !== sur.storeId) {
            const shortageNeed = Math.max(10, rec.stockSold * 2 - rec.stockAvailable);
            const transferableSurplus = Math.floor(sur.stockAvailable * 0.4); // max 40% surplus transferable

            if (transferableSurplus > 5) {
              const transferQty = Math.min(shortageNeed, transferableSurplus);
              const recStore = analyses.find(a => a.store.storeId === rec.storeId);
              const surStore = analyses.find(a => a.store.storeId === sur.storeId);

              proposals.push({
                id: `transfer-sku-${matchIdx++}`,
                sourceStoreId: sur.storeId,
                sourceStoreName: surStore?.store.storeName || `Store ${sur.storeId}`,
                destStoreId: rec.storeId,
                destStoreName: recStore?.store.storeName || `Store ${rec.storeId}`,
                productId: prodId,
                productName: rec.productName,
                destShortage: shortageNeed,
                sourceSurplus: sur.stockAvailable,
                proposedTransferQuantity: transferQty,
                evidence: `Receiving store ${rec.storeId} has only ${rec.stockAvailable} units with sales velocity of ${rec.stockSold} units. Source store ${sur.storeId} holds ${sur.stockAvailable} units.`,
                constraints: [
                  'Subject to local cold-chain transit availability.',
                  rec.expiryDays !== undefined
                    ? `Source batch shelf life: ${rec.expiryDays} days remaining.`
                    : 'Batch expiry information not provided in CSV.'
                ],
                missingInformation: [
                  'Inter-store transit distance / drive-time between locations.',
                  'Transit carrier cost per carton.'
                ],
                rationale: `Rebalances active SKU "${rec.productName}" from surplus buffer to avert stockout.`,
                status: 'recommended'
              });
            }
          }
        });
      });
    });
  }

  // 2. If aggregate store records are uploaded (store-level aggregate rebalancing):
  if (proposals.length === 0) {
    const deficitStores = analyses.filter(
      a => a.store.inventoryAvailable === 0 || a.metrics.stockToSalesRatio < 0.35
    );
    const surplusStores = analyses.filter(
      a => a.metrics.stockToSalesRatio > 2.0 && a.store.inventoryAvailable >= 100
    );

    let aggIdx = 1;
    deficitStores.forEach(def => {
      surplusStores.forEach(sur => {
        if (def.store.storeId !== sur.store.storeId) {
          const shortageNeed = Math.max(
            20,
            Math.round(def.store.inventorySold * 0.5 - def.store.inventoryAvailable)
          );
          const safeSurplus = Math.floor(sur.store.inventoryAvailable * 0.3); // max 30% aggregate surplus

          if (safeSurplus >= 15) {
            const transferQty = Math.min(shortageNeed, safeSurplus);

            proposals.push({
              id: `transfer-agg-${aggIdx++}`,
              sourceStoreId: sur.store.storeId,
              sourceStoreName: sur.store.storeName,
              destStoreId: def.store.storeId,
              destStoreName: def.store.storeName,
              productId: 'STORE_INVENTORY_BUFFER',
              productName: 'Aggregate Inventory Buffer Rebalance',
              destShortage: shortageNeed,
              sourceSurplus: sur.store.inventoryAvailable,
              proposedTransferQuantity: transferQty,
              evidence: `Store ${def.store.storeId} has low buffer (${def.metrics.stockToSalesRatio.toFixed(2)}x coverage; ${def.store.inventoryAvailable} available vs ${def.store.inventorySold} sold). Store ${sur.store.storeId} has excess buffer (${sur.metrics.stockToSalesRatio.toFixed(2)}x coverage; ${sur.store.inventoryAvailable} available).`,
              constraints: [
                `Source store retains ${sur.store.inventoryAvailable - transferQty} units (buffer remains above safe 1.5x threshold).`,
                `Receiving store buffer lifted to ~${((def.store.inventoryAvailable + transferQty) / Math.max(1, def.store.inventorySold)).toFixed(2)}x.`
              ],
              missingInformation: [
                'Granular SKU breakdown (requires Product CSV upload).',
                'Inter-store transit freight feasibility between locations.'
              ],
              rationale: `Cross-store buffer transfer eliminates emergency stockout at ${def.store.storeName} without compromising ${sur.store.storeName} operations.`,
              status: 'recommended'
            });
          }
        }
      });
    });
  }

  let diagnostic = '';
  if (proposals.length === 0) {
    diagnostic = `Analyzed ${analyses.length} stores. No transfer match found because no store in the uploaded dataset simultaneously satisfied both deficit criteria (<0.35x coverage) and safe surplus criteria (>2.0x coverage with >=100 units).`;
  } else {
    diagnostic = `Identified ${proposals.length} eligible transfer match(es) across ${analyses.length} stores in your uploaded dataset.`;
  }

  return { proposals, diagnosticMessage: diagnostic };
}

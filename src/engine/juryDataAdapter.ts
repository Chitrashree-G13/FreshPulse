/**
 * FreshPulse AI — Jury Multi-File CSV Data Adapter
 * Converts and normalizes the 9 jury CSV files:
 * 1. stores.csv
 * 2. products.csv
 * 3. inventory.csv
 * 4. sales.csv
 * 5. wastage.csv
 * 6. purchase_orders.csv
 * 7. customers.csv
 * 8. staff.csv
 * 9. compliance.csv
 *
 * Maps them into the standard FreshPulse StoreRecord and ProductRecord models.
 */

import { StoreRecord, ProductRecord, POStatus } from '../types';
import { JURY_DATASET_STORES, JURY_DATASET_PRODUCTS } from './juryStoresData';
import Papa from 'papaparse';
import { parseStoreCSV } from './validator';

export interface RawStoreRow {
  store: string;
  location: string;
  franchisee?: string;
  format?: string;
  operating_status?: string;
}

export interface RawProductRow {
  sku: string;
  product: string;
  category: string;
  price: string | number;
  perishability?: string;
  shelf_life_days?: string | number;
}

export interface RawInventoryRow {
  store: string;
  sku: string;
  stock: string | number;
  reorder_level?: string | number;
}

export interface RawSalesRow {
  date: string;
  store: string;
  sku: string;
  qty_sold: string | number;
  revenue: string | number;
}

export interface RawWastageRow {
  store: string;
  sku: string;
  qty_wasted: string | number;
  reason?: string;
  date?: string;
}

export interface RawPurchaseOrderRow {
  po: string;
  supplier: string;
  store: string;
  sku: string;
  qty: string | number;
  expected_date?: string;
  status: string;
}

export interface RawCustomerRow {
  store: string;
  date: string;
  footfall: string | number;
  transactions: string | number;
  avg_bill_value?: string | number;
}

export interface RawStaffRow {
  store: string;
  date: string;
  staff_present: string | number;
  staffing_level?: string;
  transactions_per_staff?: string | number;
}

export interface RawComplianceRow {
  store: string;
  inspection_date: string;
  checklist_score: string | number;
  open_issues?: string | number;
  issue_notes?: string;
}

export interface JuryCSVRaws {
  stores: RawStoreRow[];
  products?: RawProductRow[];
  inventory?: RawInventoryRow[];
  sales?: RawSalesRow[];
  wastage?: RawWastageRow[];
  purchaseOrders?: RawPurchaseOrderRow[];
  customers?: RawCustomerRow[];
  staff?: RawStaffRow[];
  compliance?: RawComplianceRow[];
}

export interface AdapterResult {
  stores: StoreRecord[];
  products: ProductRecord[];
}

/**
 * Normalizes multi-table CSV data into FreshPulse StoreRecord[] and ProductRecord[]
 */
export function adaptJuryCSVFiles(input: JuryCSVRaws): AdapterResult {
  const stores = input.stores || [];
  const products = input.products || [];
  const inventory = input.inventory || [];
  const sales = input.sales || [];
  const wastage = input.wastage || [];
  const purchaseOrders = input.purchaseOrders || [];
  const customers = input.customers || [];
  const staff = input.staff || [];
  const compliance = input.compliance || [];

  const productCatalog = new Map<string, RawProductRow>();
  products.forEach(p => productCatalog.set(p.sku, p));

  const normalizedStores: StoreRecord[] = stores.map(st => {
    const sid = st.store;
    const storeNum = sid.replace(/\D/g, '');
    const storeName = `FreshBasket Store ${storeNum || sid} (${st.location})`;

    // Sales aggregation
    const stSales = sales.filter(s => s.store === sid);
    const totalSales = Number(stSales.reduce((sum, r) => sum + Number(r.revenue || 0), 0).toFixed(2));
    const inventorySold = stSales.reduce((sum, r) => sum + Number(r.qty_sold || 0), 0);

    // Customer footfall & transactions
    const stCust = customers.filter(c => c.store === sid);
    const transactions = stCust.reduce((sum, c) => sum + Number(c.transactions || 0), 0);
    const footfall = stCust.reduce((sum, c) => sum + Number(c.footfall || 0), 0);

    // Available Inventory
    const stInv = inventory.filter(i => i.store === sid);
    const inventoryAvailable = stInv.reduce((sum, i) => sum + Number(i.stock || 0), 0);

    // Wastage
    const stWaste = wastage.filter(w => w.store === sid);
    const wastageQuantity = stWaste.reduce((sum, w) => sum + Number(w.qty_wasted || 0), 0);

    // Purchase Order Status
    const stPOs = purchaseOrders.filter(p => p.store === sid);
    let purchaseOrderStatus: POStatus = 'Delivered';
    if (stPOs.some(p => p.status.toLowerCase().includes('critical') || p.status.toLowerCase().includes('delayed – no revised date') || p.status.toLowerCase().includes('delayed - no revised date'))) {
      purchaseOrderStatus = 'Critical Delay';
    } else if (stPOs.some(p => p.status.toLowerCase().includes('delayed'))) {
      purchaseOrderStatus = 'Delayed';
    } else if (stPOs.some(p => p.status.toLowerCase().includes('scheduled') || p.status.toLowerCase().includes('pending'))) {
      purchaseOrderStatus = 'On Time';
    }

    // Staffing Count (Average staff present)
    const stStaff = staff.filter(s => s.store === sid);
    const avgStaff = stStaff.length > 0
      ? Math.round(stStaff.reduce((sum, s) => sum + Number(s.staff_present || 0), 0) / stStaff.length)
      : 5;

    // Compliance Score (Average audit score)
    const stComp = compliance.filter(c => c.store === sid);
    const avgComp = stComp.length > 0
      ? Math.round(stComp.reduce((sum, c) => sum + Number(c.checklist_score || 0), 0) / stComp.length)
      : 90;

    // Notes generated from real facts
    const notesArr: string[] = [];
    if (st.franchisee) notesArr.push(`Franchisee: ${st.franchisee} (${st.format || 'Standard'})`);
    if (st.operating_status && st.operating_status !== 'Open') notesArr.push(`Status: ${st.operating_status}`);
    if (purchaseOrderStatus === 'Critical Delay' || purchaseOrderStatus === 'Delayed') {
      const delayedSuppliers = [...new Set(stPOs.filter(p => p.status.toLowerCase().includes('delayed')).map(p => p.supplier))];
      notesArr.push(`Late POs from: ${delayedSuppliers.join(', ')}`);
    }
    const issues = stComp.map(c => c.issue_notes).filter(Boolean);
    if (issues.length > 0) {
      const uniqueIssues = [...new Set(issues)];
      notesArr.push(`Audit notes: ${uniqueIssues.join('; ')}`);
    }
    const notes = notesArr.join(' • ');

    return {
      storeId: sid,
      storeName,
      location: st.location,
      analysisDate: '2026-11-15',
      totalSales,
      transactions,
      footfall,
      inventoryAvailable,
      inventorySold,
      wastageQuantity,
      purchaseOrderStatus,
      staffCount: avgStaff,
      complianceScore: avgComp,
      notes
    };
  });

  const normalizedProducts: ProductRecord[] = [];
  inventory.forEach(inv => {
    const prod = productCatalog.get(inv.sku);
    if (prod) {
      const stSales = sales.filter(s => s.store === inv.store && s.sku === inv.sku);
      const stockSold = stSales.reduce((sum, s) => sum + Number(s.qty_sold || 0), 0);

      const stWaste = wastage.filter(w => w.store === inv.store && w.sku === inv.sku);
      const wastageQty = stWaste.reduce((sum, w) => sum + Number(w.qty_wasted || 0), 0);

      const stPOs = purchaseOrders.filter(p => p.store === inv.store && p.sku === inv.sku);
      let supplierStatus: POStatus = 'On Time';
      if (stPOs.some(p => p.status.toLowerCase().includes('delayed'))) {
        supplierStatus = 'Delayed';
      }

      normalizedProducts.push({
        storeId: inv.store,
        productId: inv.sku,
        productName: prod.product,
        category: prod.category,
        stockAvailable: Number(inv.stock || 0),
        stockSold,
        wastageQuantity: wastageQty,
        unitPrice: Number(prod.price || 0),
        reorderPoint: Number(inv.reorder_level || 0),
        expiryDays: Number(prod.shelf_life_days || 7),
        supplierStatus
      });
    }
  });

  return {
    stores: normalizedStores,
    products: normalizedProducts
  };
}

/**
 * The official processed Jury Dataset stores and products
 */
export const OFFICIAL_JURY_STORES: StoreRecord[] = JURY_DATASET_STORES;
export const OFFICIAL_JURY_PRODUCTS: ProductRecord[] = JURY_DATASET_PRODUCTS;

export interface MultiCSVParseResult {
  stores: StoreRecord[];
  products: ProductRecord[];
  fileNames: string[];
  summaryMessage: string;
  issues: string[];
}

/**
 * Dynamically parses uploaded CSV files (single or multi-file jury dataset)
 */
export async function parseUploadedCSVFiles(files: File[]): Promise<MultiCSVParseResult> {
  if (!files || files.length === 0) {
    return { stores: [], products: [], fileNames: [], summaryMessage: 'No files provided.', issues: ['No files selected.'] };
  }

  const rawTables: JuryCSVRaws = {
    stores: []
  };

  const fileNames = files.map(f => f.name);
  const issues: string[] = [];

  const readFileRows = (file: File): Promise<{ fileName: string; data: Record<string, string>[] }> => {
    return new Promise((resolve) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          resolve({ fileName: file.name, data: results.data || [] });
        },
        error: (err) => {
          issues.push(`Error reading ${file.name}: ${err.message}`);
          resolve({ fileName: file.name, data: [] });
        }
      });
    });
  };

  const fileResults = await Promise.all(files.map(readFileRows));

  for (const { fileName, data } of fileResults) {
    if (data.length === 0) continue;
    const lowerName = fileName.toLowerCase();
    const firstRow = data[0] || {};
    const normKeys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[\s\-_]+/g, ''));

    if (lowerName.includes('store') || (normKeys.includes('store') && normKeys.includes('location'))) {
      rawTables.stores = data as any[];
    } else if (lowerName.includes('product') || (normKeys.includes('sku') && normKeys.includes('product'))) {
      rawTables.products = data as any[];
    } else if (lowerName.includes('inventory') || (normKeys.includes('stock') && normKeys.includes('reorderlevel'))) {
      rawTables.inventory = data as any[];
    } else if (lowerName.includes('sale') || normKeys.includes('qtysold') || normKeys.includes('revenue')) {
      rawTables.sales = data as any[];
    } else if (lowerName.includes('waste') || normKeys.includes('qtywasted')) {
      rawTables.wastage = data as any[];
    } else if (lowerName.includes('purchase') || lowerName.includes('order') || normKeys.includes('po') || normKeys.includes('supplier')) {
      rawTables.purchaseOrders = data as any[];
    } else if (lowerName.includes('customer') || normKeys.includes('footfall') || normKeys.includes('transactions')) {
      rawTables.customers = data as any[];
    } else if (lowerName.includes('staff') || normKeys.includes('staffpresent')) {
      rawTables.staff = data as any[];
    } else if (lowerName.includes('compliance') || normKeys.includes('checklistscore')) {
      rawTables.compliance = data as any[];
    }
  }

  if (rawTables.stores && rawTables.stores.length > 0) {
    const { stores, products } = adaptJuryCSVFiles(rawTables);
    return {
      stores,
      products,
      fileNames,
      summaryMessage: `Successfully parsed ${fileNames.length} file(s) (${fileNames.join(', ')}). Extracted ${stores.length} store record(s) and ${products.length} product-inventory record(s).`,
      issues
    };
  }

  // Fallback for single store CSV file upload
  const firstFile = files[0];
  const firstText = await firstFile.text();
  const { records, summary } = parseStoreCSV(firstText);

  return {
    stores: records,
    products: [],
    fileNames,
    summaryMessage: `Processed ${firstFile.name}. Extracted ${records.length} store record(s) out of ${summary.totalRows} row(s).`,
    issues: summary.issues.map(i => `Row ${i.row}: ${i.message}`)
  };
}

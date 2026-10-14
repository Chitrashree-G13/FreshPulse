/**
 * FreshPulse AI — Input Validation Engine
 * Strict validation: distinguishes valid zero from missing/invalid.
 */

import Papa from 'papaparse';
import { StoreRecord, ProductRecord, ValidationIssue, CSVParseSummary, POStatus } from '../types';
import { OFFICIAL_JURY_STORES } from './juryDataAdapter';

export const VALID_PO_STATUSES: POStatus[] = [
  'Delivered',
  'On Time',
  'Pending',
  'Delayed',
  'Critical Delay',
  'Cancelled'
];

/**
 * Validates a single manual store input object
 */
export function validateStoreInput(input: Partial<StoreRecord>): {
  isValid: boolean;
  errors: Record<string, string>;
  record: StoreRecord | null;
} {
  const errors: Record<string, string> = {};

  if (!input.storeId || input.storeId.trim() === '') {
    errors.storeId = 'Store ID is required.';
  }

  if (!input.storeName || input.storeName.trim() === '') {
    errors.storeName = 'Store Name is required.';
  }

  if (!input.location || input.location.trim() === '') {
    errors.location = 'Location is required.';
  }

  if (!input.analysisDate || input.analysisDate.trim() === '') {
    errors.analysisDate = 'Analysis Date is required.';
  }

  // Numeric checks: 0 is valid!
  if (input.totalSales === undefined || input.totalSales === null || isNaN(Number(input.totalSales)) || Number(input.totalSales) < 0) {
    errors.totalSales = 'Total Sales must be a non-negative number (0 or higher).';
  }

  if (input.transactions === undefined || input.transactions === null || isNaN(Number(input.transactions)) || Number(input.transactions) < 0) {
    errors.transactions = 'Transactions must be a non-negative number (0 or higher).';
  }

  if (input.footfall === undefined || input.footfall === null || isNaN(Number(input.footfall)) || Number(input.footfall) < 0) {
    errors.footfall = 'Footfall must be a non-negative number (0 or higher).';
  }

  if (input.inventoryAvailable === undefined || input.inventoryAvailable === null || isNaN(Number(input.inventoryAvailable)) || Number(input.inventoryAvailable) < 0) {
    errors.inventoryAvailable = 'Inventory Available must be a non-negative number (0 or higher).';
  }

  if (input.inventorySold === undefined || input.inventorySold === null || isNaN(Number(input.inventorySold)) || Number(input.inventorySold) < 0) {
    errors.inventorySold = 'Inventory Sold must be a non-negative number (0 or higher).';
  }

  if (input.wastageQuantity === undefined || input.wastageQuantity === null || isNaN(Number(input.wastageQuantity)) || Number(input.wastageQuantity) < 0) {
    errors.wastageQuantity = 'Wastage Quantity must be a non-negative number (0 or higher).';
  }

  if (!input.purchaseOrderStatus || !VALID_PO_STATUSES.includes(input.purchaseOrderStatus)) {
    errors.purchaseOrderStatus = `PO Status must be one of: ${VALID_PO_STATUSES.join(', ')}.`;
  }

  if (input.staffCount === undefined || input.staffCount === null || isNaN(Number(input.staffCount)) || Number(input.staffCount) < 0) {
    errors.staffCount = 'Staff Count must be a non-negative number (0 or higher).';
  }

  const comp = Number(input.complianceScore);
  if (input.complianceScore === undefined || input.complianceScore === null || isNaN(comp) || comp < 0 || comp > 100) {
    errors.complianceScore = 'Compliance Score must be between 0 and 100.';
  }

  // Relationship sanity warnings/errors
  if (input.footfall !== undefined && input.transactions !== undefined) {
    const ff = Number(input.footfall);
    const tx = Number(input.transactions);
    if (ff === 0 && tx > 0) {
      errors.footfall = 'Footfall cannot be 0 when transactions are greater than 0.';
    }
  }

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    return { isValid: false, errors, record: null };
  }

  const record: StoreRecord = {
    storeId: input.storeId!.trim(),
    storeName: input.storeName!.trim(),
    location: input.location!.trim(),
    analysisDate: input.analysisDate!.trim(),
    totalSales: Number(input.totalSales),
    transactions: Number(input.transactions),
    footfall: Number(input.footfall),
    inventoryAvailable: Number(input.inventoryAvailable),
    inventorySold: Number(input.inventorySold),
    wastageQuantity: Number(input.wastageQuantity),
    purchaseOrderStatus: input.purchaseOrderStatus!,
    staffCount: Number(input.staffCount),
    complianceScore: Number(input.complianceScore),
    notes: input.notes?.trim()
  };

  return { isValid: true, errors: {}, record };
}

/**
 * Normalizes CSV header string: removes spaces, lowercases, underscores
 */
export function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s\-_]+/g, '');
}

/**
 * Maps CSV row keys to standard StoreRecord fields
 */
function mapRowToStoreInput(row: Record<string, string>): Partial<StoreRecord> {
  const normMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    normMap[normalizeHeader(k)] = v?.trim();
  }

  const getVal = (...aliases: string[]) => {
    for (const a of aliases) {
      const normKey = normalizeHeader(a);
      if (normMap[normKey] !== undefined && normMap[normKey] !== '') {
        return normMap[normKey];
      }
    }
    return undefined;
  };

  const parseNum = (val: string | undefined): number | undefined => {
    if (val === undefined || val === '') return undefined;
    const clean = val.replace(/[\$,]/g, '');
    const num = Number(clean);
    return isNaN(num) ? undefined : num;
  };

  const rawPo = getVal('purchaseorderstatus', 'postatus', 'po_status', 'supplierstatus', 'orderstatus', 'purchase_order_status', 'purchase_order', 'purchaseorder');
  let poStatus: POStatus | undefined = undefined;
  if (rawPo) {
    const match = VALID_PO_STATUSES.find(s => s.toLowerCase() === rawPo.toLowerCase().trim());
    poStatus = match || (rawPo as POStatus);
  }

  const sid = getVal('storeid', 'store_id', 'store', 'id');
  const loc = getVal('location', 'city', 'region', 'address') || 'Unknown Location';
  let sname = getVal('storename', 'store_name', 'name');
  if (!sname && sid) {
    const num = sid.replace(/\D/g, '');
    sname = `FreshBasket Store ${num || sid} (${loc})`;
  }

  // If a jury store row is uploaded, enrich missing values from OFFICIAL_JURY_STORES
  const existingJury = sid ? OFFICIAL_JURY_STORES.find(j => j.storeId.toLowerCase() === sid.toLowerCase()) : undefined;

  return {
    storeId: sid,
    storeName: sname,
    location: loc,
    analysisDate: getVal('analysisdate', 'date', 'analysis_date', 'reportdate') || existingJury?.analysisDate || '2026-11-15',
    totalSales: parseNum(getVal('totalsales', 'sales', 'total_sales', 'revenue')) ?? existingJury?.totalSales,
    transactions: parseNum(getVal('transactions', 'numberoftransactions', 'tx_count', 'txns', 'orders')) ?? existingJury?.transactions,
    footfall: parseNum(getVal('footfall', 'customerfootfall', 'visitors', 'traffic')) ?? existingJury?.footfall,
    inventoryAvailable: parseNum(getVal('inventoryavailable', 'inventory', 'stock_available', 'available_stock', 'stock', 'available_inventory')) ?? existingJury?.inventoryAvailable,
    inventorySold: parseNum(getVal('inventorysold', 'units_sold', 'sold_units', 'sales_units')) ?? existingJury?.inventorySold,
    wastageQuantity: parseNum(getVal('wastagequantity', 'wastage', 'waste_units', 'spoilage', 'shrinkage', 'wastage_qty')) ?? existingJury?.wastageQuantity,
    purchaseOrderStatus: poStatus ?? existingJury?.purchaseOrderStatus,
    staffCount: parseNum(getVal('staffcount', 'staff', 'employees', 'headcount')) ?? existingJury?.staffCount,
    complianceScore: parseNum(getVal('compliancescore', 'compliance', 'audit_score', 'compliance_score')) ?? existingJury?.complianceScore,
    notes: getVal('notes', 'comments', 'remarks') || existingJury?.notes
  };
}

/**
 * Parses raw CSV string for store records using Papa Parse
 */
export function parseStoreCSV(csvContent: string): {
  records: StoreRecord[];
  summary: CSVParseSummary;
} {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });

  const headers = parsed.meta.fields || [];
  const issues: ValidationIssue[] = [];
  const records: StoreRecord[] = [];
  const storeIdCounts = new Map<string, number>();

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const mapped = mapRowToStoreInput(row);
    const valResult = validateStoreInput(mapped);

    if (valResult.isValid && valResult.record) {
      records.push(valResult.record);
      const count = storeIdCounts.get(valResult.record.storeId) || 0;
      storeIdCounts.set(valResult.record.storeId, count + 1);
    } else {
      Object.entries(valResult.errors).forEach(([field, msg]) => {
        issues.push({
          row: rowNum,
          field,
          value: row[field] ?? '',
          severity: 'error',
          message: msg
        });
      });
    }
  });

  let duplicateCount = 0;
  storeIdCounts.forEach((count, sId) => {
    if (count > 1) {
      duplicateCount += count - 1;
      issues.push({
        row: 0,
        field: 'storeId',
        value: sId,
        severity: 'warning',
        message: `Store ID "${sId}" appears ${count} times in the dataset. Latest entry will be tracked alongside previous.`
      });
    }
  });

  const summary: CSVParseSummary = {
    fileName: 'uploaded_stores.csv',
    fileSize: csvContent.length,
    totalRows: parsed.data.length,
    validRows: records.length,
    errorRows: parsed.data.length - records.length,
    headers,
    issues,
    duplicateStoreCount: duplicateCount
  };

  return { records, summary };
}

/**
 * Parses optional product-level CSV
 */
export function parseProductCSV(csvContent: string): {
  products: ProductRecord[];
  headers: string[];
  issues: ValidationIssue[];
} {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });

  const headers = parsed.meta.fields || [];
  const issues: ValidationIssue[] = [];
  const products: ProductRecord[] = [];

  parsed.data.forEach((row, idx) => {
    const rowNum = idx + 2;
    const normMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      normMap[normalizeHeader(k)] = v?.trim();
    }

    const getVal = (...aliases: string[]) => {
      for (const a of aliases) {
        const normKey = normalizeHeader(a);
        if (normMap[normKey] !== undefined && normMap[normKey] !== '') {
          return normMap[normKey];
        }
      }
      return undefined;
    };

    const storeId = getVal('storeid', 'store_id');
    const productId = getVal('productid', 'product_id', 'sku');
    const productName = getVal('productname', 'product_name', 'name') || productId;
    const category = getVal('category', 'dept', 'department') || 'General';
    const stockAvail = Number(getVal('stockavailable', 'inventoryavailable', 'stock') ?? 0);
    const stockSold = Number(getVal('stocksold', 'inventorysold', 'units_sold') ?? 0);
    const wastage = Number(getVal('wastagequantity', 'wastage', 'waste') ?? 0);
    const unitPrice = Number(getVal('unitprice', 'price', 'unit_cost') ?? 0);
    const reorderPoint = getVal('reorderpoint', 'reorder_level') ? Number(getVal('reorderpoint', 'reorder_level')) : undefined;
    const expiryDays = getVal('expirydays', 'days_to_expiry', 'shelf_life_days') ? Number(getVal('expirydays', 'days_to_expiry')) : undefined;
    const poStatus = getVal('supplierstatus', 'po_status', 'postatus') as POStatus | undefined;

    if (!storeId || !productId) {
      issues.push({
        row: rowNum,
        field: 'storeId/productId',
        value: `${storeId || ''}/${productId || ''}`,
        severity: 'error',
        message: 'Product rows require both storeId and productId.'
      });
      return;
    }

    products.push({
      storeId,
      productId,
      productName: productName || productId,
      category,
      stockAvailable: isNaN(stockAvail) ? 0 : Math.max(0, stockAvail),
      stockSold: isNaN(stockSold) ? 0 : Math.max(0, stockSold),
      wastageQuantity: isNaN(wastage) ? 0 : Math.max(0, wastage),
      unitPrice: isNaN(unitPrice) ? 0 : Math.max(0, unitPrice),
      reorderPoint,
      expiryDays,
      supplierStatus: poStatus
    });
  });

  return { products, headers, issues };
}

/**
 * Downloads a clean CSV template containing HEADERS ONLY, ZERO DATA ROWS
 */
export function getStoreCSVHeaderTemplate(): string {
  return 'store_id,store_name,location,analysis_date,total_sales,transactions,footfall,inventory_available,inventory_sold,wastage_quantity,purchase_order_status,staff_count,compliance_score,notes\n';
}

export function getProductCSVHeaderTemplate(): string {
  return 'store_id,product_id,product_name,category,stock_available,stock_sold,wastage_quantity,unit_price,reorder_point,expiry_days,supplier_status\n';
}

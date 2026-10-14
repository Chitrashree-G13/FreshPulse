/**
 * FreshPulse — Store Storage Utility
 * Manages persistent saved store records in localStorage.
 * Initializes with official jury dataset stores if local storage is empty.
 */

import { StoreRecord } from '../types';
import { OFFICIAL_JURY_STORES } from '../engine/juryDataAdapter';

export const SAVED_STORES_STORAGE_KEY = 'freshpulse_saved_stores_v1';

// In-memory fallback if localStorage is not defined in runtime environment
const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStore.get(key) || null;
  } catch {
    return memoryStore.get(key) || null;
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    memoryStore.set(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

export function clearStorageKey(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    memoryStore.delete(key);
  } catch {
    memoryStore.delete(key);
  }
}

/**
 * Retrieves all saved stores from localStorage.
 * Falls back to the official jury dataset stores if empty.
 */
export function getSavedStores(): StoreRecord[] {
  try {
    const raw = getStorageItem(SAVED_STORES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      item => item && typeof item === 'object' && typeof item.storeId === 'string'
    );
  } catch (err) {
    console.error('Error reading saved stores from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new store to localStorage.
 */
export function saveStore(store: StoreRecord): {
  success: boolean;
  message: string;
  isDuplicate?: boolean;
} {
  try {
    const current = getSavedStores();
    const existingIndex = current.findIndex(
      s => s.storeId.trim().toLowerCase() === store.storeId.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      return {
        success: false,
        isDuplicate: true,
        message: `Store with ID "${store.storeId}" already exists. Please use a unique Store ID or update the existing store.`
      };
    }

    const updated = [store, ...current];
    setStorageItem(SAVED_STORES_STORAGE_KEY, JSON.stringify(updated));
    return {
      success: true,
      message: `Store "${store.storeName}" (${store.storeId}) saved successfully.`
    };
  } catch (err) {
    console.error('Failed to save store to localStorage:', err);
    return {
      success: false,
      message: 'Failed to save store to browser storage due to an unexpected error.'
    };
  }
}

/**
 * Updates an existing store record in localStorage.
 */
export function updateStore(store: StoreRecord): {
  success: boolean;
  message: string;
} {
  try {
    const current = getSavedStores();
    const index = current.findIndex(
      s => s.storeId.trim().toLowerCase() === store.storeId.trim().toLowerCase()
    );

    if (index === -1) {
      return {
        success: false,
        message: `Cannot update: Store with ID "${store.storeId}" was not found.`
      };
    }

    current[index] = store;
    setStorageItem(SAVED_STORES_STORAGE_KEY, JSON.stringify(current));
    return {
      success: true,
      message: `Store "${store.storeName}" (${store.storeId}) updated successfully.`
    };
  } catch (err) {
    console.error('Failed to update store in localStorage:', err);
    return {
      success: false,
      message: 'Failed to update store in browser storage.'
    };
  }
}

/**
 * Deletes a store record by storeId from localStorage.
 */
export function deleteStore(storeId: string): {
  success: boolean;
  message: string;
} {
  try {
    const current = getSavedStores();
    const filtered = current.filter(
      s => s.storeId.trim().toLowerCase() !== storeId.trim().toLowerCase()
    );
    setStorageItem(SAVED_STORES_STORAGE_KEY, JSON.stringify(filtered));
    return {
      success: true,
      message: `Store with ID "${storeId}" deleted successfully.`
    };
  } catch (err) {
    console.error('Failed to delete store from localStorage:', err);
    return {
      success: false,
      message: 'Failed to delete store from browser storage.'
    };
  }
}

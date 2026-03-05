/**
 * API helper functions that wrap the API client for use in React components.
 * Includes formatting utilities and re-exports.
 */
import {
    getGstSummary as _getGstSummary,
    listInvoices as _listInvoices,
    createInvoice as _createInvoice,
    uploadBill as _uploadBill,
    confirmBill as _confirmBill,
    recordPayment as _recordPayment,
    getCurrentUser as _getCurrentUser,
    isLoggedIn as _isLoggedIn,
    type GstSummary,
    type Invoice,
    type InvoiceListResponse,
    type OcrResult,
} from './api';

// Re-export types
export type { GstSummary, Invoice, InvoiceListResponse, OcrResult };

// Re-export functions
export const getGstSummary = _getGstSummary;
export const listInvoices = _listInvoices;
export const createInvoice = _createInvoice;
export const uploadBill = _uploadBill;
export const confirmBill = _confirmBill;
export const recordPayment = _recordPayment;
export const getCurrentUser = _getCurrentUser;
export const isLoggedIn = _isLoggedIn;

/**
 * Format paise to rupee string with Indian comma grouping.
 * Client-side version of the backend's format_paise.
 */
export function formatPaiseClient(paise: number): string {
    const rupees = Math.abs(paise) / 100;
    const isNeg = paise < 0;

    // Split into integer and decimal
    const intPart = Math.floor(rupees);
    const decPart = Math.round((rupees - intPart) * 100);

    // Indian comma grouping
    const str = String(intPart);
    let formatted: string;

    if (str.length <= 3) {
        formatted = str;
    } else {
        const lastThree = str.slice(-3);
        const rest = str.slice(0, -3);
        const groups: string[] = [];
        for (let i = rest.length; i > 0; i -= 2) {
            groups.unshift(rest.slice(Math.max(0, i - 2), i));
        }
        formatted = groups.join(',') + ',' + lastThree;
    }

    if (decPart > 0) {
        formatted += `.${String(decPart).padStart(2, '0')}`;
    }

    return isNeg ? `-${formatted}` : formatted;
}

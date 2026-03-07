/**
 * API client for the FastAPI backend.
 * All frontend pages use this to communicate with the Python backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ApiOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = typeof window !== 'undefined' ? localStorage.getItem('gst_token') : null;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    };

    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new ApiError(errorData.detail || response.statusText, response.status);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
}

// ─────────────────────────────────────────
// Auth
// ─────────────────────────────────────────

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user_id: string;
    name: string;
}

export async function register(phone: string, password: string, name: string): Promise<LoginResponse> {
    const data = await apiRequest<LoginResponse>('/auth/register', {
        method: 'POST',
        body: { phone, password, name },
    });
    localStorage.setItem('gst_token', data.access_token);
    localStorage.setItem('gst_user', JSON.stringify({ id: data.user_id, name: data.name }));
    return data;
}

export async function login(phone: string, password: string): Promise<LoginResponse> {
    const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { phone, password },
    });
    localStorage.setItem('gst_token', data.access_token);
    localStorage.setItem('gst_user', JSON.stringify({ id: data.user_id, name: data.name }));
    return data;
}

export async function setupBusiness(business: {
    name: string;
    gstin?: string;
    state_code: string;
    state_name: string;
    financial_year: string;
}): Promise<{ id: string; name: string; gstin: string }> {
    return apiRequest('/auth/setup-business', { method: 'POST', body: business });
}

// ─────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────

export interface InvoiceItem {
    description: string;
    hsn_code?: string;
    quantity: number;
    unit_price: number; // paise
    gst_rate: number;
    discount?: number;
}

export interface Invoice {
    id: string;
    invoice_type: string;
    invoice_number: string;
    invoice_date: string;
    party_name?: string;
    party_gstin?: string;
    is_inter_state: boolean;
    total_taxable_value: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    total_amount: number;
    payment_status: string;
    confidence_score: string;
    created_at: string;
}

export interface InvoiceListResponse {
    invoices: Invoice[];
    total: number;
    page: number;
    page_size: number;
}

export async function listInvoices(params: {
    invoice_type?: string;
    payment_status?: string;
    search?: string;
    page?: number;
    page_size?: number;
}): Promise<InvoiceListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.set(key, String(val));
    });
    return apiRequest(`/invoices?${query.toString()}`);
}

export async function createInvoice(data: {
    buyer_name: string;
    buyer_gstin?: string;
    buyer_state_code?: string;
    invoice_date: string;
    items: InvoiceItem[];
    notes?: string;
}): Promise<Invoice> {
    return apiRequest('/invoices', { method: 'POST', body: data });
}

// ─────────────────────────────────────────
// Bills
// ─────────────────────────────────────────

export interface OcrResult {
    fields: Record<string, unknown>;
    raw_text: string;
    confidence: number;
    confidence_score: string;
}

export async function uploadBill(file: File): Promise<OcrResult> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('gst_token');
    const response = await fetch(`${API_BASE}/bills/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new ApiError(err.detail, response.status);
    }

    return response.json();
}

export async function confirmBill(data: {
    supplier_name: string;
    supplier_gstin?: string;
    invoice_number: string;
    invoice_date: string;
    taxable_value: number;
    cgst_amount?: number;
    sgst_amount?: number;
    igst_amount?: number;
    total_amount: number;
    gst_rate?: number;
}): Promise<{ id: string; itc_status: string; confidence_score: string }> {
    return apiRequest('/bills/confirm', { method: 'POST', body: data });
}

// ─────────────────────────────────────────
// Payments
// ─────────────────────────────────────────

export async function recordPayment(data: {
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_mode: string;
    reference_number?: string;
}): Promise<{ id: string }> {
    return apiRequest('/payments', { method: 'POST', body: data });
}

// ─────────────────────────────────────────
// GST Summary
// ─────────────────────────────────────────

export interface GstBreakup {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

export interface GstSummary {
    period: string;
    output_gst: GstBreakup;
    itc: GstBreakup;
    net_payable: GstBreakup;
    itc_carryforward: number;
    sales_count: number;
    purchases_count: number;
    total_taxable_sales: number;
    total_taxable_purchases: number;
    explanation: string[];
    return_status: string;
}

export async function getGstSummary(period?: string): Promise<GstSummary> {
    const query = period ? `?period=${period}` : '';
    return apiRequest(`/gst/summary${query}`);
}

// ─────────────────────────────────────────
// Reports
// ─────────────────────────────────────────

export function getInvoicePdfUrl(invoiceId: string): string {
    return `${API_BASE}/reports/invoice-pdf/${invoiceId}`;
}

export function getSummaryPdfUrl(period: string): string {
    return `${API_BASE}/reports/summary-pdf?period=${period}`;
}

export function getCsvExportUrl(period: string, type: string = 'sale'): string {
    return `${API_BASE}/reports/csv?period=${period}&invoice_type=${type}`;
}

export function getJsonExportUrl(period: string): string {
    return `${API_BASE}/reports/json?period=${period}`;
}

// ─────────────────────────────────────────
// Utility
// ─────────────────────────────────────────

export function isLoggedIn(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem('gst_token');
}

export function logout(): void {
    localStorage.removeItem('gst_token');
    localStorage.removeItem('gst_user');
}

export function getCurrentUser(): { id: string; name: string } | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('gst_user');
    return user ? JSON.parse(user) : null;
}

/**
 * API client for the FastAPI backend.
 * All frontend pages use this to communicate with the Python backend.
 */

let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Auto-correct if the user forgot /api/v1 in their Vercel environment variable
if (API_BASE && !API_BASE.endsWith('/api/v1')) {
    API_BASE = API_BASE.replace(/\/$/, '') + '/api/v1';
}

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

export async function downloadReport(format: string): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gst_token') : null;
    const response = await fetch(`${API_BASE}/reports/${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
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

// ─────────────────────────────────────────
// Products
// ─────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    description?: string;
    hsn_code?: string;
    unit: string;
    unit_price: number;
    gst_rate: number;
    stock_quantity: number;
    low_stock_threshold: number;
    sku?: string;
    category?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductListResponse {
    products: Product[];
    total: number;
    page: number;
    page_size: number;
}

export async function listProducts(params: {
    search?: string;
    category?: string;
    page?: number;
    page_size?: number;
} = {}): Promise<ProductListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') query.set(key, String(val));
    });
    return apiRequest(`/products?${query.toString()}`);
}

export async function createProduct(data: {
    name: string;
    description?: string;
    hsn_code?: string;
    unit?: string;
    unit_price?: number;
    gst_rate?: number;
    stock_quantity?: number;
    low_stock_threshold?: number;
    sku?: string;
    category?: string;
}): Promise<Product> {
    return apiRequest('/products', { method: 'POST', body: data });
}

export async function updateProduct(id: string, data: Record<string, unknown>): Promise<Product> {
    return apiRequest(`/products/${id}`, { method: 'PUT', body: data });
}

export async function deleteProduct(id: string): Promise<void> {
    return apiRequest(`/products/${id}`, { method: 'DELETE' });
}

export async function getLowStockProducts(): Promise<ProductListResponse> {
    return apiRequest('/products/low-stock');
}

// ─────────────────────────────────────────
// AI Services
// ─────────────────────────────────────────

export interface AIChatResponse {
    response: string;
    data?: Record<string, unknown>;
}

export interface AIPrediction {
    metric: string;
    current_value: number;
    predicted_value: number;
    confidence: number;
    period: string;
}

export interface ComplianceAlert {
    severity: string;
    title: string;
    description: string;
    action?: string;
}

export async function aiChat(message: string, context?: string): Promise<AIChatResponse> {
    return apiRequest('/ai/chat', { method: 'POST', body: { message, context } });
}

export async function aiPredictions(): Promise<AIPrediction[]> {
    return apiRequest('/ai/predictions');
}

export async function aiCompliance(): Promise<ComplianceAlert[]> {
    return apiRequest('/ai/compliance');
}

// ─────────────────────────────────────────
// Business Profile
// ─────────────────────────────────────────

export interface BusinessProfile {
    id: string;
    name: string;
    gstin?: string;
    state_code: string;
    state_name: string;
    business_type: string;
    address?: string;
    phone?: string;
    email?: string;
    pan?: string;
    financial_year: string;
    invoice_prefix: string;
    created_at: string;
}

export async function getBusinessProfile(): Promise<BusinessProfile> {
    return apiRequest('/business');
}

export async function updateBusinessProfile(data: Record<string, unknown>): Promise<BusinessProfile> {
    return apiRequest('/business', { method: 'PUT', body: data });
}

// ─────────────────────────────────────────
// Documents
// ─────────────────────────────────────────

export interface DocumentItem {
    id: string;
    filename: string;
    file_url: string;
    document_type: string;
    ocr_status: string;
    ocr_confidence?: number;
    linked_invoice_id?: string;
    created_at: string;
}

export async function uploadDocument(file: File, documentType: string = 'invoice'): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('gst_token');
    const response = await fetch(`${API_BASE}/documents/upload?document_type=${documentType}`, {
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

export async function listDocuments(): Promise<DocumentItem[]> {
    return apiRequest('/documents');
}

// ─────────────────────────────────────────
// GST Center
// ─────────────────────────────────────────

export async function validateGstin(gstin: string): Promise<{ valid: boolean; details?: Record<string, unknown> }> {
    return apiRequest('/gst/validate-gstin', { method: 'POST', body: { gstin } });
}

// ─────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────

export async function getDashboardSummary(): Promise<Record<string, unknown>> {
    return apiRequest('/analytics/summary');
}

export async function getDashboardCharts(months?: number): Promise<Record<string, unknown>> {
    const q = months ? `?months=${months}` : '';
    return apiRequest(`/analytics/charts${q}`);
}

export async function getTaxFilingStatus(): Promise<Record<string, unknown>> {
    return apiRequest('/analytics/tax-filing-status');
}

export async function getRecentInvoices(limit?: number): Promise<Record<string, unknown>[]> {
    const q = limit ? `?limit=${limit}` : '';
    return apiRequest(`/analytics/recent-invoices${q}`);
}

import { z } from 'zod';

// ─────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────

export const registerSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    email: z.string().email().optional(),
});

export const loginSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    password: z.string().min(1, 'Password required'),
});

// ─────────────────────────────────────────
// Business Schemas
// ─────────────────────────────────────────

export const businessSchema = z.object({
    name: z.string().min(2).max(255),
    gstin: z.string().regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Invalid GSTIN format'
    ),
    businessType: z.enum(['regular', 'composition', 'unregistered']).default('regular'),
    address: z.string().optional(),
    pincode: z.string().regex(/^\d{6}$/, 'Must be 6 digits').optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY'),
    invoicePrefix: z.string().max(20).default('INV-'),
});

// ─────────────────────────────────────────
// Invoice Schemas
// ─────────────────────────────────────────

export const lineItemSchema = z.object({
    description: z.string().min(1).max(500),
    hsnCode: z.string().max(8).optional(),
    quantity: z.number().positive(),
    unit: z.string().max(20).default('NOS'),
    unitPrice: z.number().int().positive(), // paise
    discount: z.number().int().min(0).default(0), // paise
    gstRate: z.number().refine(v => [0, 5, 12, 18, 28].includes(v), {
        message: 'GST rate must be 0, 5, 12, 18, or 28',
    }),
});

export const createInvoiceSchema = z.object({
    invoiceType: z.enum(['sale', 'purchase']),
    invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    buyer: z.object({
        name: z.string().min(1).max(255),
        gstin: z.string().optional(),
        stateCode: z.string().length(2).optional(),
    }),
    items: z.array(lineItemSchema).min(1, 'At least one line item required'),
    notes: z.string().optional(),
});

// ─────────────────────────────────────────
// Payment Schemas
// ─────────────────────────────────────────

export const paymentSchema = z.object({
    amount: z.number().int().positive(), // paise
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other']),
    referenceNumber: z.string().max(100).optional(),
    notes: z.string().optional(),
});

// ─────────────────────────────────────────
// Bill Upload Schema
// ─────────────────────────────────────────

export const confirmBillSchema = z.object({
    supplierGstin: z.string().optional(),
    supplierName: z.string().min(1).max(255),
    invoiceNumber: z.string().min(1).max(50),
    invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    taxableValue: z.number().int().positive(), // paise
    gstRate: z.number().refine(v => [0, 5, 12, 18, 28].includes(v)),
    cgstAmount: z.number().int().min(0).optional(),
    sgstAmount: z.number().int().min(0).optional(),
    igstAmount: z.number().int().min(0).optional(),
    totalAmount: z.number().int().positive(), // paise
    itcStatus: z.enum(['eligible', 'needs_review', 'blocked']).default('eligible'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ConfirmBillInput = z.infer<typeof confirmBillSchema>;

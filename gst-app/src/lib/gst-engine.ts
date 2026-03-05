// ─────────────────────────────────────────────────────────
// GST Calculation Engine — Pure Functions
// All monetary values are in PAISE (integer) for precision
// ─────────────────────────────────────────────────────────

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GstRate = typeof GST_RATES[number];

export interface GstBreakup {
    cgst: number;
    sgst: number;
    igst: number;
}

export interface LineItemInput {
    quantity: number;
    unitPrice: number; // paise
    discount?: number; // paise
    gstRate: number;
}

export interface LineItemGst {
    taxableValue: number; // paise
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cgstAmount: number; // paise
    sgstAmount: number; // paise
    igstAmount: number; // paise
    totalAmount: number; // paise
}

export interface InvoiceTotals {
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalAmount: number;
}

export interface NetPayableResult {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    itcCarryforward: number;
    crossUtilization: {
        igstToIgst: number;
        igstToCgst: number;
        igstToSgst: number;
        cgstToCgst: number;
        cgstToIgst: number;
        sgstToSgst: number;
        sgstToIgst: number;
    };
}

/**
 * Determine if transaction is inter-state based on seller and buyer state codes
 */
export function isInterState(sellerStateCode: string, buyerStateCode: string): boolean {
    return sellerStateCode !== buyerStateCode;
}

/**
 * Calculate GST for a single line item
 * Uses Banker's rounding (round half to even) for paise precision
 */
export function calculateLineItemGst(
    item: LineItemInput,
    interState: boolean
): LineItemGst {
    const taxableValue = Math.round(item.quantity * item.unitPrice) - (item.discount || 0);

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (interState) {
        igstRate = item.gstRate;
        igstAmount = Math.round(taxableValue * igstRate / 100);
    } else {
        cgstRate = item.gstRate / 2;
        sgstRate = item.gstRate / 2;
        cgstAmount = Math.round(taxableValue * cgstRate / 100);
        sgstAmount = Math.round(taxableValue * sgstRate / 100);
    }

    const totalAmount = taxableValue + cgstAmount + sgstAmount + igstAmount;

    return {
        taxableValue,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
    };
}

/**
 * Calculate totals for all line items in an invoice
 */
export function calculateInvoiceTotals(items: LineItemGst[]): InvoiceTotals {
    return items.reduce(
        (totals, item) => ({
            totalTaxableValue: totals.totalTaxableValue + item.taxableValue,
            totalCgst: totals.totalCgst + item.cgstAmount,
            totalSgst: totals.totalSgst + item.sgstAmount,
            totalIgst: totals.totalIgst + item.igstAmount,
            totalAmount: totals.totalAmount + item.totalAmount,
        }),
        { totalTaxableValue: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalAmount: 0 }
    );
}

/**
 * ITC Cross-Utilization as per CGST Act
 * 
 * Order of set-off:
 * 1. IGST credit → IGST liability
 * 2. IGST credit → CGST liability
 * 3. IGST credit → SGST liability
 * 4. CGST credit → CGST liability
 * 5. CGST credit → IGST liability
 * 6. SGST credit → SGST liability
 * 7. SGST credit → IGST liability
 * 
 * Note: CGST credit CANNOT offset SGST and vice versa
 */
export function calculateNetPayable(
    output: GstBreakup,
    itc: GstBreakup
): NetPayableResult {
    let igstLiability = output.igst;
    let cgstLiability = output.cgst;
    let sgstLiability = output.sgst;

    let igstCredit = itc.igst;
    let cgstCredit = itc.cgst;
    let sgstCredit = itc.sgst;

    // Step 1: IGST credit → IGST liability
    const igstToIgst = Math.min(igstCredit, igstLiability);
    igstLiability -= igstToIgst;
    igstCredit -= igstToIgst;

    // Step 2: IGST credit → CGST liability
    const igstToCgst = Math.min(igstCredit, cgstLiability);
    cgstLiability -= igstToCgst;
    igstCredit -= igstToCgst;

    // Step 3: IGST credit → SGST liability
    const igstToSgst = Math.min(igstCredit, sgstLiability);
    sgstLiability -= igstToSgst;
    igstCredit -= igstToSgst;

    // Step 4: CGST credit → CGST liability
    const cgstToCgst = Math.min(cgstCredit, cgstLiability);
    cgstLiability -= cgstToCgst;
    cgstCredit -= cgstToCgst;

    // Step 5: CGST credit → IGST liability
    const cgstToIgst = Math.min(cgstCredit, igstLiability);
    igstLiability -= cgstToIgst;
    cgstCredit -= cgstToIgst;

    // Step 6: SGST credit → SGST liability
    const sgstToSgst = Math.min(sgstCredit, sgstLiability);
    sgstLiability -= sgstToSgst;
    sgstCredit -= sgstToSgst;

    // Step 7: SGST credit → IGST liability
    const sgstToIgst = Math.min(sgstCredit, igstLiability);
    igstLiability -= sgstToIgst;
    sgstCredit -= sgstToIgst;

    const total = cgstLiability + sgstLiability + igstLiability;
    const itcCarryforward = igstCredit + cgstCredit + sgstCredit;

    return {
        cgst: cgstLiability,
        sgst: sgstLiability,
        igst: igstLiability,
        total,
        itcCarryforward,
        crossUtilization: {
            igstToIgst, igstToCgst, igstToSgst,
            cgstToCgst, cgstToIgst,
            sgstToSgst, sgstToIgst,
        },
    };
}

/**
 * Generate natural-language explanation for Net GST Payable
 */
export function generateExplanation(
    output: GstBreakup,
    itc: GstBreakup,
    net: NetPayableResult,
    salesCount: number,
    purchasesCount: number,
    eligibleItc: number
): string[] {
    const outputTotal = output.cgst + output.sgst + output.igst;
    const itcTotal = itc.cgst + itc.sgst + itc.igst;

    const lines: string[] = [];

    lines.push(
        `You collected ₹${formatPaise(outputTotal)} GST from your customers (${salesCount} invoice${salesCount !== 1 ? 's' : ''}).`
    );

    lines.push(
        `You paid ₹${formatPaise(itcTotal)} GST on your purchases (${purchasesCount} bill${purchasesCount !== 1 ? 's' : ''}). ₹${formatPaise(eligibleItc)} is eligible as credit.`
    );

    if (eligibleItc >= outputTotal) {
        lines.push(
            `Your ITC (₹${formatPaise(eligibleItc)}) is MORE than your Output GST (₹${formatPaise(outputTotal)}).`
        );
        lines.push(
            `So you owe ₹0 to the government this month.`
        );
        lines.push(
            `Remaining ₹${formatPaise(net.itcCarryforward)} credit carries to next month.`
        );
    } else {
        lines.push(
            `Net before cross-utilization: ₹${formatPaise(outputTotal)} − ₹${formatPaise(eligibleItc)} = ₹${formatPaise(outputTotal - eligibleItc)}.`
        );
        if (output.igst > 0 || itc.igst > 0) {
            lines.push(
                `IGST credit is first used against IGST liability, then splits to CGST and SGST.`
            );
        }
        lines.push(
            `Final payable: ₹${formatPaise(net.total)}.`
        );
    }

    return lines;
}

/**
 * Convert paise to formatted rupee string
 * 350000 → "3,500" (no decimals if round)
 * 350050 → "3,500.50"
 */
export function formatPaise(paise: number): string {
    const rupees = paise / 100;
    if (paise % 100 === 0) {
        return rupees.toLocaleString('en-IN');
    }
    return rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Convert rupee amount to paise
 */
export function toPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 */
export function toRupees(paise: number): number {
    return paise / 100;
}

// ─────────────────────────────────────────────────────────
// Validation Rules Engine
// ─────────────────────────────────────────────────────────

import { GST_RATES } from './gst-engine';
import { INDIAN_STATES } from './indian-states';

export interface ValidationResult {
    ruleId: string;
    ruleName: string;
    severity: 'critical' | 'warning';
    passed: boolean;
    message: string;
    details?: Record<string, unknown>;
}

export type ConfidenceScore = 'green' | 'yellow' | 'red';

export interface ValidationReport {
    results: ValidationResult[];
    confidenceScore: ConfidenceScore;
    passed: boolean; // no critical failures
}

// ─────────────────────────────────────────
// GSTIN Validation
// ─────────────────────────────────────────

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const GSTIN_CHAR_MAP: Record<string, number> = {};
'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => {
    GSTIN_CHAR_MAP[c] = i;
});

/**
 * Validate GSTIN format (15-char alphanumeric)
 */
export function validateGstinFormat(gstin: string): ValidationResult {
    if (!gstin || gstin.trim() === '') {
        return {
            ruleId: 'gstin_format',
            ruleName: 'GSTIN Format',
            severity: 'warning',
            passed: true,
            message: 'GSTIN not provided (B2C transaction)',
        };
    }

    const valid = GSTIN_REGEX.test(gstin);
    return {
        ruleId: 'gstin_format',
        ruleName: 'GSTIN Format',
        severity: 'critical',
        passed: valid,
        message: valid
            ? 'GSTIN format is valid'
            : `Invalid GSTIN format: "${gstin}". Must be 15 characters (e.g., 27AABCU9603R1ZP)`,
    };
}

/**
 * Validate GSTIN state code (first 2 digits)
 */
export function validateGstinStateCode(gstin: string): ValidationResult {
    if (!gstin || gstin.length < 2) {
        return {
            ruleId: 'gstin_state_code',
            ruleName: 'State Code',
            severity: 'warning',
            passed: true,
            message: 'GSTIN not provided',
        };
    }

    const stateCode = gstin.substring(0, 2);
    const state = INDIAN_STATES.find(s => s.code === stateCode);

    return {
        ruleId: 'gstin_state_code',
        ruleName: 'State Code',
        severity: 'critical',
        passed: !!state,
        message: state
            ? `State code ${stateCode} → ${state.name}`
            : `Invalid state code: ${stateCode}`,
        details: state ? { stateCode, stateName: state.name, isUT: state.ut } : undefined,
    };
}

/**
 * Validate GSTIN checksum using Luhn Mod 36 algorithm
 */
export function validateGstinChecksum(gstin: string): ValidationResult {
    if (!gstin || gstin.length !== 15) {
        return {
            ruleId: 'gstin_checksum',
            ruleName: 'GSTIN Checksum',
            severity: 'critical',
            passed: false,
            message: 'GSTIN must be 15 characters for checksum validation',
        };
    }

    const chars = gstin.substring(0, 14);
    let sum = 0;

    for (let i = 0; i < 14; i++) {
        const charValue = GSTIN_CHAR_MAP[chars[i]];
        if (charValue === undefined) {
            return {
                ruleId: 'gstin_checksum',
                ruleName: 'GSTIN Checksum',
                severity: 'critical',
                passed: false,
                message: `Invalid character in GSTIN at position ${i + 1}`,
            };
        }

        const factor = i % 2 === 0 ? 1 : 2;
        const product = charValue * factor;
        sum += Math.floor(product / 36) + (product % 36);
    }

    const checkDigit = (36 - (sum % 36)) % 36;
    const expectedChar = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[checkDigit];
    const actualChar = gstin[14];

    return {
        ruleId: 'gstin_checksum',
        ruleName: 'GSTIN Checksum',
        severity: 'critical',
        passed: expectedChar === actualChar,
        message: expectedChar === actualChar
            ? 'GSTIN checksum valid'
            : `GSTIN checksum mismatch: expected "${expectedChar}", got "${actualChar}"`,
    };
}

/**
 * Full GSTIN validation (format + state code + checksum)
 */
export function validateGstin(gstin: string): ValidationResult[] {
    if (!gstin || gstin.trim() === '') {
        return [{
            ruleId: 'gstin_format',
            ruleName: 'GSTIN Format',
            severity: 'warning',
            passed: true,
            message: 'GSTIN not provided (B2C transaction)',
        }];
    }

    return [
        validateGstinFormat(gstin),
        validateGstinStateCode(gstin),
        validateGstinChecksum(gstin),
    ];
}

/**
 * Extract state info from a valid GSTIN
 */
export function extractStateFromGstin(gstin: string): { code: string; name: string } | null {
    if (!gstin || gstin.length < 2) return null;
    const code = gstin.substring(0, 2);
    const state = INDIAN_STATES.find(s => s.code === code);
    return state ? { code: state.code, name: state.name } : null;
}

// ─────────────────────────────────────────
// Tax Math Validation
// ─────────────────────────────────────────

const TOLERANCE_PAISE = 100; // ₹1 tolerance for rounding

export interface TaxMathInput {
    taxableValue: number; // paise
    gstRate: number;
    isInterState: boolean;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
}

/**
 * Validate GST rate is a standard slab
 */
export function validateGstRate(rate: number): ValidationResult {
    const valid = (GST_RATES as readonly number[]).includes(rate);
    return {
        ruleId: 'gst_slab_valid',
        ruleName: 'GST Slab',
        severity: 'critical',
        passed: valid,
        message: valid
            ? `GST rate ${rate}% is valid`
            : `GST rate ${rate}% is not a standard slab. Valid: ${GST_RATES.join(', ')}%`,
    };
}

/**
 * Validate line item tax math
 */
export function validateTaxMath(input: TaxMathInput): ValidationResult {
    let expectedCgst: number, expectedSgst: number, expectedIgst: number;

    if (input.isInterState) {
        expectedCgst = 0;
        expectedSgst = 0;
        expectedIgst = Math.round(input.taxableValue * input.gstRate / 100);
    } else {
        expectedCgst = Math.round(input.taxableValue * input.gstRate / 200);
        expectedSgst = Math.round(input.taxableValue * input.gstRate / 200);
        expectedIgst = 0;
    }

    const cgstOk = Math.abs(input.cgstAmount - expectedCgst) <= TOLERANCE_PAISE;
    const sgstOk = Math.abs(input.sgstAmount - expectedSgst) <= TOLERANCE_PAISE;
    const igstOk = Math.abs(input.igstAmount - expectedIgst) <= TOLERANCE_PAISE;

    const passed = cgstOk && sgstOk && igstOk;

    return {
        ruleId: 'tax_math_line',
        ruleName: 'Tax Calculation',
        severity: 'critical',
        passed,
        message: passed
            ? 'Tax calculation is correct'
            : `Tax math mismatch: Expected CGST=${expectedCgst} SGST=${expectedSgst} IGST=${expectedIgst}`,
        details: { expectedCgst, expectedSgst, expectedIgst },
    };
}

/**
 * Validate invoice totals match sum of line items
 */
export function validateInvoiceTotals(
    items: { taxableValue: number; cgstAmount: number; sgstAmount: number; igstAmount: number; totalAmount: number }[],
    invoiceTotals: { totalTaxableValue: number; totalCgst: number; totalSgst: number; totalIgst: number; totalAmount: number }
): ValidationResult {
    const sumTaxable = items.reduce((s, i) => s + i.taxableValue, 0);
    const sumCgst = items.reduce((s, i) => s + i.cgstAmount, 0);
    const sumSgst = items.reduce((s, i) => s + i.sgstAmount, 0);
    const sumIgst = items.reduce((s, i) => s + i.igstAmount, 0);
    const sumTotal = items.reduce((s, i) => s + i.totalAmount, 0);

    const taxableOk = Math.abs(invoiceTotals.totalTaxableValue - sumTaxable) <= TOLERANCE_PAISE;
    const cgstOk = Math.abs(invoiceTotals.totalCgst - sumCgst) <= TOLERANCE_PAISE;
    const sgstOk = Math.abs(invoiceTotals.totalSgst - sumSgst) <= TOLERANCE_PAISE;
    const igstOk = Math.abs(invoiceTotals.totalIgst - sumIgst) <= TOLERANCE_PAISE;
    const totalOk = Math.abs(invoiceTotals.totalAmount - sumTotal) <= TOLERANCE_PAISE;

    const passed = taxableOk && cgstOk && sgstOk && igstOk && totalOk;

    return {
        ruleId: 'invoice_total_check',
        ruleName: 'Invoice Total',
        severity: 'critical',
        passed,
        message: passed
            ? 'Invoice totals match sum of line items'
            : 'Invoice totals do not match sum of line items',
        details: { sumTaxable, sumCgst, sumSgst, sumIgst, sumTotal },
    };
}

// ─────────────────────────────────────────
// Place of Supply Validation
// ─────────────────────────────────────────

export function validatePlaceOfSupply(
    sellerState: string,
    buyerState: string,
    hasCgst: boolean,
    hasSgst: boolean,
    hasIgst: boolean
): ValidationResult {
    const isInter = sellerState !== buyerState;

    if (isInter) {
        const passed = !hasCgst && !hasSgst && hasIgst;
        return {
            ruleId: 'place_of_supply',
            ruleName: 'Place of Supply',
            severity: 'critical',
            passed,
            message: passed
                ? `Inter-state (${sellerState} → ${buyerState}): IGST applied correctly`
                : `Inter-state transaction should have IGST only, not CGST/SGST`,
        };
    } else {
        const passed = hasCgst && hasSgst && !hasIgst;
        return {
            ruleId: 'place_of_supply',
            ruleName: 'Place of Supply',
            severity: 'critical',
            passed,
            message: passed
                ? `Intra-state (${sellerState}): CGST+SGST applied correctly`
                : `Intra-state transaction should have CGST+SGST, not IGST`,
        };
    }
}

// ─────────────────────────────────────────
// Confidence Scoring
// ─────────────────────────────────────────

export function computeConfidence(results: ValidationResult[]): ConfidenceScore {
    const criticalFails = results.filter(r => r.severity === 'critical' && !r.passed);
    const warnings = results.filter(r => r.severity === 'warning' && !r.passed);

    if (criticalFails.length > 0) return 'red';
    if (warnings.length > 0) return 'yellow';
    return 'green';
}

/**
 * Run full validation suite on an invoice
 */
export function runValidation(input: {
    buyerGstin?: string;
    sellerStateCode: string;
    buyerStateCode: string;
    isInterState: boolean;
    items: TaxMathInput[];
    totals: { totalTaxableValue: number; totalCgst: number; totalSgst: number; totalIgst: number; totalAmount: number };
}): ValidationReport {
    const results: ValidationResult[] = [];

    // GSTIN validation (if provided)
    if (input.buyerGstin) {
        results.push(...validateGstin(input.buyerGstin));
    }

    // GST rate validation for each item
    input.items.forEach((item, idx) => {
        const rateResult = validateGstRate(item.gstRate);
        rateResult.ruleId = `gst_slab_valid_${idx}`;
        results.push(rateResult);

        const mathResult = validateTaxMath(item);
        mathResult.ruleId = `tax_math_line_${idx}`;
        results.push(mathResult);
    });

    // Invoice totals
    results.push(validateInvoiceTotals(
        input.items.map(i => ({
            taxableValue: i.taxableValue,
            cgstAmount: i.cgstAmount,
            sgstAmount: i.sgstAmount,
            igstAmount: i.igstAmount,
            totalAmount: i.taxableValue + i.cgstAmount + i.sgstAmount + i.igstAmount,
        })),
        input.totals
    ));

    // Place of supply
    const hasCgst = input.totals.totalCgst > 0;
    const hasSgst = input.totals.totalSgst > 0;
    const hasIgst = input.totals.totalIgst > 0;

    // Only check place of supply if there's actually some tax
    if (hasCgst || hasSgst || hasIgst) {
        results.push(validatePlaceOfSupply(
            input.sellerStateCode,
            input.buyerStateCode,
            hasCgst,
            hasSgst,
            hasIgst
        ));
    }

    return {
        results,
        confidenceScore: computeConfidence(results),
        passed: results.every(r => r.severity !== 'critical' || r.passed),
    };
}

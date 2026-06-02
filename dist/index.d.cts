import { R as ReferralSplit, a as ReferralStore, b as ReferralUsage, c as ReferralCalculation, d as ReferralCode } from './types-D0pmt9XK.cjs';

declare const DEFAULT_SPLIT: ReferralSplit;
/** Generates a short alphanumeric referral code tied to an owner. */
declare function generateCode(ownerId: string, opts?: {
    prefix?: string;
    length?: number;
}): string;
/**
 * Calculate the discount (for the new customer) and commission (for the affiliate)
 * for a given payment amount in cents.
 */
declare function calculateReferral(amountCents: number, split?: ReferralSplit): ReferralCalculation;
/**
 * Validate that a code exists and hasn't expired.
 * Returns the code record or null.
 */
declare function validateCode(code: string, store: ReferralStore, now?: Date): Promise<ReferralCode | null>;
/**
 * Record that a new user signed up via an affiliate code and is making a purchase.
 * Returns the referral usage record (caller should persist it via store.saveUsage).
 */
declare function applyReferral(opts: {
    code: string;
    newUserId: string;
    amountCents: number;
    store: ReferralStore;
    split?: ReferralSplit;
}): Promise<ReferralUsage>;
/**
 * Create and store a new referral code for a user.
 */
declare function createCode(ownerId: string, store: ReferralStore, opts?: {
    prefix?: string;
    length?: number;
    expiresAt?: Date | null;
}): Promise<ReferralCode>;
/**
 * Build the full referral URL for sharing.
 */
declare function buildReferralUrl(baseUrl: string, code: string, param?: string): string;
/**
 * Extract a referral code from a URL or query-string object.
 */
declare function extractCode(source: string | URL | Record<string, string | string[] | undefined>, param?: string): string | null;

export { DEFAULT_SPLIT, ReferralCalculation, ReferralCode, ReferralSplit, ReferralStore, ReferralUsage, applyReferral, buildReferralUrl, calculateReferral, createCode, extractCode, generateCode, validateCode };

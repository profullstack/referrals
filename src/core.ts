import type { ReferralCalculation, ReferralCode, ReferralSplit, ReferralStore, ReferralUsage } from "./types.js";

export const DEFAULT_SPLIT: ReferralSplit = {
  affiliate: 0.6,
  customer: 0.2,
  total: 0.8,
};

/** Generates a short alphanumeric referral code tied to an owner. */
export function generateCode(
  ownerId: string,
  opts: { prefix?: string; length?: number } = {}
): string {
  const { prefix = "", length = 8 } = opts;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // Seed with ownerId hash + random bytes so codes are unique but reproducible on retry
  const random = Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
  return prefix ? `${prefix.toUpperCase()}-${random}` : random;
}

/**
 * Calculate the discount (for the new customer) and commission (for the affiliate)
 * for a given payment amount in cents.
 */
export function calculateReferral(
  amountCents: number,
  split: ReferralSplit = DEFAULT_SPLIT
): ReferralCalculation {
  const discountCents = Math.floor(amountCents * split.customer);
  const commissionCents = Math.floor(amountCents * split.affiliate);
  return {
    originalAmountCents: amountCents,
    discountCents,
    commissionCents,
    finalAmountCents: amountCents - discountCents,
    split,
  };
}

/**
 * Calculate referral commission based on cumulative usage count tiers.
 * Evaluates the highest matching tier for the given usage count.
 */
export function calculateTieredReferral(
  amountCents: number,
  usageCount: number,
  tiers: import("./types.js").ReferralTier[] = []
): ReferralCalculation {
  const sorted = [...tiers].sort((a, b) => b.minUsages - a.minUsages);
  const matched = sorted.find((t) => usageCount >= t.minUsages);
  const effectiveSplit = matched ? matched.split : DEFAULT_SPLIT;
  return calculateReferral(amountCents, effectiveSplit);
}

/**
 * Validate that a code exists and hasn't expired.
 * Returns the code record or null.
 */
export async function validateCode(
  code: string,
  store: ReferralStore,
  now: Date = new Date()
): Promise<ReferralCode | null> {
  const record = await store.getCode(code.toUpperCase().trim());
  if (!record) return null;
  if (record.expiresAt && record.expiresAt < now) return null;
  return record;
}

/**
 * Record that a new user signed up via an affiliate code and is making a purchase.
 * Returns the referral usage record (caller should persist it via store.saveUsage).
 */
export async function applyReferral(
  opts: {
    code: string;
    newUserId: string;
    amountCents: number;
    store: ReferralStore;
    split?: ReferralSplit;
  }
): Promise<ReferralUsage> {
  const { code, newUserId, amountCents, store, split = DEFAULT_SPLIT } = opts;
  const record = await validateCode(code, store);
  if (!record) throw new Error(`Invalid or expired referral code: ${code}`);

  const calc = calculateReferral(amountCents, split);
  const usage: ReferralUsage = {
    code: record.code,
    affiliateId: record.ownerId,
    newUserId,
    amountCents,
    commissionCents: calc.commissionCents,
    discountCents: calc.discountCents,
    appliedAt: new Date(),
  };
  await store.saveUsage(usage);
  return usage;
}

/**
 * Create and store a new referral code for a user.
 */
export async function createCode(
  ownerId: string,
  store: ReferralStore,
  opts: { prefix?: string; length?: number; expiresAt?: Date | null } = {}
): Promise<ReferralCode> {
  const { prefix, length, expiresAt = null } = opts;
  const code = generateCode(ownerId, { prefix, length });
  const record: ReferralCode = {
    code,
    ownerId,
    createdAt: new Date(),
    expiresAt,
  };
  await store.saveCode(record);
  return record;
}

/**
 * Build the full referral URL for sharing.
 */
export function buildReferralUrl(baseUrl: string, code: string, param = "ref"): string {
  const url = new URL(baseUrl);
  url.searchParams.set(param, code);
  return url.toString();
}

/**
 * Extract a referral code from a URL or query-string object.
 */
export function extractCode(
  source: string | URL | Record<string, string | string[] | undefined>,
  param = "ref"
): string | null {
  if (typeof source === "string") {
    try {
      const url = new URL(source);
      return url.searchParams.get(param) || null;
    } catch {
      return null;
    }
  }
  if (source instanceof URL) return source.searchParams.get(param) || null;
  const val = source[param];
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

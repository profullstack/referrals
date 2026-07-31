export interface ReferralSplit {
  /** Fraction of payment credited to the affiliate (0–1). Default: 0.60 */
  affiliate: number;
  /** Fraction discount given to the new customer (0–1). Default: 0.20 */
  customer: number;
  /** Total promotional value as a fraction (affiliate + customer). Default: 0.80 */
  total: number;
}

export interface ReferralCode {
  code: string;
  ownerId: string;
  createdAt: Date;
  /** ISO-8601 date string if the code expires; null means no expiry */
  expiresAt: Date | null;
  /** Optional custom referral split override for this code */
  split?: ReferralSplit;
}

export interface ReferralUsage {
  code: string;
  affiliateId: string;
  newUserId: string;
  /** Original payment amount in cents (or smallest currency unit) */
  amountCents: number;
  /** Commission to pay the affiliate in cents */
  commissionCents: number;
  /** Discount to apply to new customer in cents */
  discountCents: number;
  appliedAt: Date;
}

export interface ReferralCalculation {
  originalAmountCents: number;
  discountCents: number;
  commissionCents: number;
  finalAmountCents: number;
  split: ReferralSplit;
}

export interface ReferralStore {
  /** Persist a referral code. */
  saveCode(code: ReferralCode): Promise<void>;
  /** Look up a code. Returns null if not found. */
  getCode(code: string): Promise<ReferralCode | null>;
  /** Persist a completed referral usage. */
  saveUsage(usage: ReferralUsage): Promise<void>;
  /** Fetch all usages for a given affiliate. */
  getUsagesByAffiliate(affiliateId: string): Promise<ReferralUsage[]>;
}

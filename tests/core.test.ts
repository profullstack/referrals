import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateCode,
  calculateReferral,
  validateCode,
  applyReferral,
  createCode,
  buildReferralUrl,
  extractCode,
  DEFAULT_SPLIT,
} from "../src/core.js";
import type { ReferralCode, ReferralStore, ReferralUsage } from "../src/types.js";

function makeStore(codes: ReferralCode[] = []): ReferralStore & { usages: ReferralUsage[] } {
  const codeMap = new Map(codes.map((c) => [c.code, c]));
  const usages: ReferralUsage[] = [];
  return {
    usages,
    saveCode: async (c) => { codeMap.set(c.code, c); },
    getCode: async (c) => codeMap.get(c) ?? null,
    saveUsage: async (u) => { usages.push(u); },
    getUsagesByAffiliate: async (id) => usages.filter((u) => u.affiliateId === id),
  };
}

describe("DEFAULT_SPLIT", () => {
  it("totals 80%", () => {
    expect(DEFAULT_SPLIT.affiliate + DEFAULT_SPLIT.customer).toBe(DEFAULT_SPLIT.total);
    expect(DEFAULT_SPLIT.total).toBe(0.8);
  });
});

describe("generateCode", () => {
  it("returns a string of the requested length", () => {
    expect(generateCode("user1", { length: 8 })).toHaveLength(8);
    expect(generateCode("user1", { length: 12 })).toHaveLength(12);
  });

  it("prepends prefix with dash", () => {
    const code = generateCode("user1", { prefix: "camp", length: 6 });
    expect(code).toMatch(/^CAMP-[A-Z0-9]{6}$/);
  });
});

describe("calculateReferral", () => {
  it("calculates 60% commission and 20% discount on $100", () => {
    const calc = calculateReferral(10000);
    expect(calc.commissionCents).toBe(6000);
    expect(calc.discountCents).toBe(2000);
    expect(calc.finalAmountCents).toBe(8000);
  });

  it("floors fractional cents", () => {
    const calc = calculateReferral(333);
    expect(calc.discountCents).toBe(Math.floor(333 * 0.2));
    expect(calc.commissionCents).toBe(Math.floor(333 * 0.6));
  });

  it("accepts a custom split", () => {
    const calc = calculateReferral(10000, { affiliate: 0.5, customer: 0.1, total: 0.6 });
    expect(calc.commissionCents).toBe(5000);
    expect(calc.discountCents).toBe(1000);
  });
});

describe("validateCode", () => {
  it("returns null for unknown codes", async () => {
    const store = makeStore();
    expect(await validateCode("NOPE", store)).toBeNull();
  });

  it("returns the record for a valid code", async () => {
    const code: ReferralCode = { code: "HELLO123", ownerId: "u1", createdAt: new Date(), expiresAt: null };
    const store = makeStore([code]);
    expect(await validateCode("HELLO123", store)).toEqual(code);
  });

  it("returns null for an expired code", async () => {
    const past = new Date(Date.now() - 1000);
    const code: ReferralCode = { code: "EXP", ownerId: "u1", createdAt: new Date(), expiresAt: past };
    const store = makeStore([code]);
    expect(await validateCode("EXP", store)).toBeNull();
  });

  it("is case-insensitive", async () => {
    const code: ReferralCode = { code: "ABC12345", ownerId: "u1", createdAt: new Date(), expiresAt: null };
    const store = makeStore([code]);
    expect(await validateCode("abc12345", store)).toEqual(code);
  });
});

describe("applyReferral", () => {
  it("throws on invalid code", async () => {
    const store = makeStore();
    await expect(applyReferral({ code: "BAD", newUserId: "u2", amountCents: 1000, store })).rejects.toThrow();
  });

  it("persists usage with correct amounts", async () => {
    const code: ReferralCode = { code: "GOOD1234", ownerId: "affiliate1", createdAt: new Date(), expiresAt: null };
    const store = makeStore([code]);
    const usage = await applyReferral({ code: "GOOD1234", newUserId: "newuser", amountCents: 5000, store });
    expect(usage.commissionCents).toBe(3000);
    expect(usage.discountCents).toBe(1000);
    expect(usage.affiliateId).toBe("affiliate1");
    expect(store.usages).toHaveLength(1);
  });
});

describe("createCode", () => {
  it("stores and returns a code", async () => {
    const store = makeStore();
    const code = await createCode("owner1", store);
    expect(code.ownerId).toBe("owner1");
    expect(await store.getCode(code.code)).toEqual(code);
  });
});

describe("buildReferralUrl", () => {
  it("appends ref param", () => {
    const url = buildReferralUrl("https://example.com/signup", "ABC123");
    expect(url).toBe("https://example.com/signup?ref=ABC123");
  });

  it("supports custom param name", () => {
    const url = buildReferralUrl("https://example.com/", "XYZ", "r");
    expect(url).toBe("https://example.com/?r=XYZ");
  });
});

describe("extractCode", () => {
  it("extracts from a full URL string", () => {
    expect(extractCode("https://example.com/?ref=MYCODE")).toBe("MYCODE");
  });

  it("returns null when param is missing", () => {
    expect(extractCode("https://example.com/")).toBeNull();
  });

  it("extracts from a plain object (Next.js searchParams)", () => {
    expect(extractCode({ ref: "OBJ123" })).toBe("OBJ123");
  });

  it("supports custom param name", () => {
    expect(extractCode("https://example.com/?r=CUSTOM", "r")).toBe("CUSTOM");
  });
});

import { extendCodeExpiration, getReferralStats } from "../src/core.js";

describe("extendCodeExpiration", () => {
  it("updates expiration date on existing code", async () => {
    const store = makeStore([{ code: "EXP123", ownerId: "u1", createdAt: new Date(), expiresAt: new Date(1000) }]);
    const newDate = new Date(2000000000000);
    const updated = await extendCodeExpiration("EXP123", store, newDate);
    expect(updated.expiresAt).toEqual(newDate);
    expect((await store.getCode("EXP123"))?.expiresAt).toEqual(newDate);
  });

  it("throws when code does not exist", async () => {
    const store = makeStore();
    await expect(extendCodeExpiration("MISSING", store, new Date())).rejects.toThrow("Referral code not found");
  });
});

describe("getReferralStats", () => {
  it("aggregates total revenue, commissions, and discounts for a code", async () => {
    const store = makeStore([{ code: "PROMO88", ownerId: "aff1", createdAt: new Date(), expiresAt: null }]);
    await applyReferral({ code: "PROMO88", newUserId: "u1", amountCents: 10000, store });
    await applyReferral({ code: "PROMO88", newUserId: "u2", amountCents: 20000, store });

    const stats = await getReferralStats("PROMO88", store);
    expect(stats.totalUsages).toBe(2);
    expect(stats.totalRevenueCents).toBe(30000);
    expect(stats.totalCommissionCents).toBe(18000);
    expect(stats.totalDiscountCents).toBe(6000);
  });
});

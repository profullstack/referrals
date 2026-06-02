// src/core.ts
var DEFAULT_SPLIT = {
  affiliate: 0.6,
  customer: 0.2,
  total: 0.8
};
function generateCode(ownerId, opts = {}) {
  const { prefix = "", length = 8 } = opts;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
  return prefix ? `${prefix.toUpperCase()}-${random}` : random;
}
function calculateReferral(amountCents, split = DEFAULT_SPLIT) {
  const discountCents = Math.floor(amountCents * split.customer);
  const commissionCents = Math.floor(amountCents * split.affiliate);
  return {
    originalAmountCents: amountCents,
    discountCents,
    commissionCents,
    finalAmountCents: amountCents - discountCents,
    split
  };
}
async function validateCode(code, store, now = /* @__PURE__ */ new Date()) {
  const record = await store.getCode(code.toUpperCase().trim());
  if (!record) return null;
  if (record.expiresAt && record.expiresAt < now) return null;
  return record;
}
async function applyReferral(opts) {
  const { code, newUserId, amountCents, store, split = DEFAULT_SPLIT } = opts;
  const record = await validateCode(code, store);
  if (!record) throw new Error(`Invalid or expired referral code: ${code}`);
  const calc = calculateReferral(amountCents, split);
  const usage = {
    code: record.code,
    affiliateId: record.ownerId,
    newUserId,
    amountCents,
    commissionCents: calc.commissionCents,
    discountCents: calc.discountCents,
    appliedAt: /* @__PURE__ */ new Date()
  };
  await store.saveUsage(usage);
  return usage;
}
async function createCode(ownerId, store, opts = {}) {
  const { prefix, length, expiresAt = null } = opts;
  const code = generateCode(ownerId, { prefix, length });
  const record = {
    code,
    ownerId,
    createdAt: /* @__PURE__ */ new Date(),
    expiresAt
  };
  await store.saveCode(record);
  return record;
}
function buildReferralUrl(baseUrl, code, param = "ref") {
  const url = new URL(baseUrl);
  url.searchParams.set(param, code);
  return url.toString();
}
function extractCode(source, param = "ref") {
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
  return Array.isArray(val) ? val[0] ?? null : val;
}
export {
  DEFAULT_SPLIT,
  applyReferral,
  buildReferralUrl,
  calculateReferral,
  createCode,
  extractCode,
  generateCode,
  validateCode
};
//# sourceMappingURL=index.js.map
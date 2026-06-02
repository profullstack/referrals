"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  DEFAULT_SPLIT: () => DEFAULT_SPLIT,
  applyReferral: () => applyReferral,
  buildReferralUrl: () => buildReferralUrl,
  calculateReferral: () => calculateReferral,
  createCode: () => createCode,
  extractCode: () => extractCode,
  generateCode: () => generateCode,
  validateCode: () => validateCode
});
module.exports = __toCommonJS(src_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_SPLIT,
  applyReferral,
  buildReferralUrl,
  calculateReferral,
  createCode,
  extractCode,
  generateCode,
  validateCode
});
//# sourceMappingURL=index.cjs.map
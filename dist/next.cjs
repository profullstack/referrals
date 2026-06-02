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

// src/next.ts
var next_exports = {};
__export(next_exports, {
  makeReferralHandlers: () => makeReferralHandlers,
  trackReferralCode: () => trackReferralCode
});
module.exports = __toCommonJS(next_exports);

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

// src/next.ts
function nextResponse() {
  const { NextResponse } = require("next/server");
  return NextResponse;
}
function makeReferralHandlers(opts) {
  const { store, split = DEFAULT_SPLIT, getUserId, param = "ref" } = opts;
  const NR = nextResponse();
  async function GET(req) {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action");
    if (action === "validate") {
      const code = sp.get(param);
      if (!code) return NR.json({ error: "Missing code" }, { status: 400 });
      const record = await validateCode(code, store);
      return NR.json({ valid: !!record, code: record ?? null });
    }
    if (action === "mycode") {
      if (!getUserId) return NR.json({ error: "Not configured" }, { status: 501 });
      const userId = await getUserId(req);
      if (!userId) return NR.json({ error: "Unauthorized" }, { status: 401 });
      const usages = await store.getUsagesByAffiliate(userId);
      return NR.json({ usages });
    }
    return NR.json({ error: "Unknown action" }, { status: 400 });
  }
  async function POST(req) {
    const body = await req.json();
    const action = body["action"];
    if (action === "create") {
      if (!getUserId) return NR.json({ error: "Not configured" }, { status: 501 });
      const userId = await getUserId(req);
      if (!userId) return NR.json({ error: "Unauthorized" }, { status: 401 });
      const prefix = typeof body["prefix"] === "string" ? body["prefix"] : void 0;
      const code = await createCode(userId, store, { prefix });
      return NR.json({ code });
    }
    if (action === "apply") {
      if (!getUserId) return NR.json({ error: "Not configured" }, { status: 501 });
      const userId = await getUserId(req);
      if (!userId) return NR.json({ error: "Unauthorized" }, { status: 401 });
      const code = typeof body["code"] === "string" ? body["code"] : null;
      const amount = typeof body["amount"] === "number" ? body["amount"] : null;
      if (!code || !amount) return NR.json({ error: "Missing code or amount" }, { status: 400 });
      const usage = await applyReferral({ code, newUserId: userId, amountCents: amount, store, split });
      return NR.json({ usage });
    }
    return NR.json({ error: "Unknown action" }, { status: 400 });
  }
  return { GET, POST };
}
function trackReferralCode(request, response, opts = {}) {
  const { param = "ref", cookieName = "referral_code", maxAgeSeconds = 60 * 60 * 24 * 30 } = opts;
  const code = request.nextUrl.searchParams.get(param);
  if (code) {
    response.cookies.set(cookieName, code, {
      httpOnly: false,
      // readable by client JS for prefill
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/"
    });
  }
  return response;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  makeReferralHandlers,
  trackReferralCode
});
//# sourceMappingURL=next.cjs.map
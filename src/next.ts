/**
 * Next.js App Router helpers — route handlers + middleware utilities.
 *
 * Usage in app/api/referrals/route.ts:
 *   import { makeReferralHandlers } from "@profullstack/referrals/next";
 *   export const { GET, POST } = makeReferralHandlers({ store });
 */

import { applyReferral, createCode, validateCode } from "./core.js";
import type { ReferralStore } from "./types.js";
import { DEFAULT_SPLIT } from "./core.js";
import type { ReferralSplit } from "./types.js";

type NextRequest = {
  nextUrl: { searchParams: URLSearchParams };
  json(): Promise<unknown>;
};

type NextResponse = {
  json(data: unknown, init?: ResponseInit): Response;
};

// We import NextResponse lazily so the package doesn't break in
// non-Next environments (core and react work without Next).
function nextResponse(): NextResponse {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require("next/server") as { NextResponse: NextResponse };
  return NextResponse;
}

export interface ReferralHandlerOptions {
  store: ReferralStore;
  split?: ReferralSplit;
  /** Current authenticated user id — required for POST /apply and GET /code */
  getUserId?: (req: NextRequest) => Promise<string | null>;
  /** URL param name for referral code. Default: "ref" */
  param?: string;
}

/**
 * Factory that returns Next.js route handler exports for a single
 * `/api/referrals` route. Mount as:
 *   export const { GET, POST } = makeReferralHandlers({ store, getUserId });
 *
 * Routes:
 *   GET  ?action=validate&ref=CODE          → { valid, code }
 *   GET  ?action=mycode                     → { code } (requires userId)
 *   POST { action:"create" }                → { code } (requires userId)
 *   POST { action:"apply", code, amount }   → { usage } (requires userId)
 */
export function makeReferralHandlers(opts: ReferralHandlerOptions) {
  const { store, split = DEFAULT_SPLIT, getUserId, param = "ref" } = opts;
  const NR = nextResponse();

  async function GET(req: NextRequest) {
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

  async function POST(req: NextRequest) {
    const body = (await req.json()) as Record<string, unknown>;
    const action = body["action"];

    if (action === "create") {
      if (!getUserId) return NR.json({ error: "Not configured" }, { status: 501 });
      const userId = await getUserId(req);
      if (!userId) return NR.json({ error: "Unauthorized" }, { status: 401 });
      const prefix = typeof body["prefix"] === "string" ? body["prefix"] : undefined;
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

/**
 * Middleware helper: reads the referral code from the request URL and
 * stores it in a cookie so it survives page navigations.
 *
 * Call inside next.js middleware.ts:
 *   import { trackReferralCode } from "@profullstack/referrals/next";
 *   export function middleware(request) {
 *     return trackReferralCode(request, NextResponse.next());
 *   }
 */
export function trackReferralCode(
  request: { nextUrl: URL; cookies: { get(name: string): { value: string } | undefined } },
  response: Response & { cookies: { set(name: string, value: string, opts?: object): void } },
  opts: { param?: string; cookieName?: string; maxAgeSeconds?: number } = {}
): Response & { cookies: { set(name: string, value: string, opts?: object): void } } {
  const { param = "ref", cookieName = "referral_code", maxAgeSeconds = 60 * 60 * 24 * 30 } = opts;
  const code = request.nextUrl.searchParams.get(param);
  const alreadyTracked = request.cookies.get(cookieName)?.value;
  // URL param wins only if not already tracked (first-touch attribution)
  if (code && !alreadyTracked) {
    response.cookies.set(cookieName, code, {
      httpOnly: false, // readable by client JS for prefill
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });
  }
  return response;
}

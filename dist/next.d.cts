import { a as ReferralStore, R as ReferralSplit } from './types-D0pmt9XK.cjs';

/**
 * Next.js App Router helpers — route handlers + middleware utilities.
 *
 * Usage in app/api/referrals/route.ts:
 *   import { makeReferralHandlers } from "@profullstack/referrals/next";
 *   export const { GET, POST } = makeReferralHandlers({ store });
 */

type NextRequest = {
    nextUrl: {
        searchParams: URLSearchParams;
    };
    json(): Promise<unknown>;
};
interface ReferralHandlerOptions {
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
declare function makeReferralHandlers(opts: ReferralHandlerOptions): {
    GET: (req: NextRequest) => Promise<Response>;
    POST: (req: NextRequest) => Promise<Response>;
};
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
declare function trackReferralCode(request: {
    nextUrl: URL;
    cookies: {
        get(name: string): {
            value: string;
        } | undefined;
    };
}, response: Response & {
    cookies: {
        set(name: string, value: string, opts?: object): void;
    };
}, opts?: {
    param?: string;
    cookieName?: string;
    maxAgeSeconds?: number;
}): Response & {
    cookies: {
        set(name: string, value: string, opts?: object): void;
    };
};

export { type ReferralHandlerOptions, makeReferralHandlers, trackReferralCode };

import { describe, it, expect } from "vitest";
import { trackReferralCode } from "../src/next.js";

type SetCall = { name: string; value: string; opts?: object };

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  return {
    nextUrl: new URL(url),
    cookies: {
      get(name: string) {
        return name in cookies ? { value: cookies[name] } : undefined;
      },
    },
  };
}

function makeResponse() {
  const calls: SetCall[] = [];
  const response = {
    calls,
    cookies: {
      set(name: string, value: string, opts?: object) {
        calls.push({ name, value, opts });
      },
    },
  };
  return response as typeof response & Response;
}

describe("trackReferralCode", () => {
  it("sets the referral cookie when a code is present and none is tracked yet", () => {
    const req = makeRequest("https://example.com/signup?ref=FIRST");
    const res = makeResponse();
    trackReferralCode(req, res);
    expect(res.calls).toHaveLength(1);
    expect(res.calls[0]).toMatchObject({ name: "referral_code", value: "FIRST" });
  });

  it("does not set a cookie when no code is in the URL", () => {
    const req = makeRequest("https://example.com/signup");
    const res = makeResponse();
    trackReferralCode(req, res);
    expect(res.calls).toHaveLength(0);
  });

  it("preserves first-touch attribution: a later code does not overwrite an existing referral cookie", () => {
    // User already arrived via FIRST; a second link with SECOND must not steal the credit.
    const req = makeRequest("https://example.com/signup?ref=SECOND", {
      referral_code: "FIRST",
    });
    const res = makeResponse();
    trackReferralCode(req, res);
    expect(res.calls).toHaveLength(0);
  });

  it("respects a custom cookie name when checking for an existing code", () => {
    const req = makeRequest("https://example.com/signup?ref=SECOND", {
      my_ref: "FIRST",
    });
    const res = makeResponse();
    trackReferralCode(req, res, { cookieName: "my_ref" });
    expect(res.calls).toHaveLength(0);
  });
});

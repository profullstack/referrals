import { describe, it, expect, vi } from "vitest";
import { trackReferralCode } from "../src/next.js";

function mockRequest(urlStr: string, cookiesRecord: Record<string, string> = {}) {
  const url = new URL(urlStr);
  return {
    nextUrl: url,
    cookies: {
      get(name: string) {
        const val = cookiesRecord[name];
        return val !== undefined ? { value: val } : undefined;
      },
    },
  };
}

function mockResponse() {
  const setCookies: Array<{ name: string; value: string; opts?: object }> = [];
  return {
    cookies: {
      set(name: string, value: string, opts?: object) {
        setCookies.push({ name, value, opts });
      },
    },
    getSetCookies() {
      return setCookies;
    },
  };
}

describe("trackReferralCode", () => {
  it("sets the referral cookie when ref param is present and no cookie exists", () => {
    const req = mockRequest("https://example.com/?ref=FIRST123");
    const res = mockResponse();

    trackReferralCode(req as any, res as any);

    expect(res.getSetCookies()).toHaveLength(1);
    expect(res.getSetCookies()[0]).toMatchObject({
      name: "referral_code",
      value: "FIRST123",
    });
  });

  it("does not set cookie when ref param is missing", () => {
    const req = mockRequest("https://example.com/signup");
    const res = mockResponse();

    trackReferralCode(req as any, res as any);

    expect(res.getSetCookies()).toHaveLength(0);
  });

  it("preserves existing referral cookie and prevents overwriting (first-touch attribution)", () => {
    const req = mockRequest("https://example.com/?ref=SECOND456", {
      referral_code: "FIRST123",
    });
    const res = mockResponse();

    trackReferralCode(req as any, res as any);

    expect(res.getSetCookies()).toHaveLength(0);
  });

  it("supports custom param and custom cookie name", () => {
    const req = mockRequest("https://example.com/?aff=CUSTOM789");
    const res = mockResponse();

    trackReferralCode(req as any, res as any, {
      param: "aff",
      cookieName: "aff_code",
    });

    expect(res.getSetCookies()).toHaveLength(1);
    expect(res.getSetCookies()[0]).toMatchObject({
      name: "aff_code",
      value: "CUSTOM789",
    });
  });
});

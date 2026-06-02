"use client";

// src/react.tsx
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// src/core.ts
var DEFAULT_SPLIT = {
  affiliate: 0.6,
  customer: 0.2,
  total: 0.8
};
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

// src/react.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var ReferralContext = createContext({
  code: null,
  setCode: () => void 0,
  split: DEFAULT_SPLIT
});
function ReferralProvider({
  children,
  split = DEFAULT_SPLIT,
  param = "ref",
  storageKey = "referral_code"
}) {
  const [code, setCodeState] = useState(null);
  useEffect(() => {
    const fromUrl = extractCode(window.location.href, param);
    if (fromUrl) {
      sessionStorage.setItem(storageKey, fromUrl);
      setCodeState(fromUrl);
      return;
    }
    const stored = sessionStorage.getItem(storageKey);
    if (stored) setCodeState(stored);
  }, [param, storageKey]);
  const setCode = useCallback(
    (next) => {
      setCodeState(next);
      if (next) sessionStorage.setItem(storageKey, next);
      else sessionStorage.removeItem(storageKey);
    },
    [storageKey]
  );
  return /* @__PURE__ */ jsx(ReferralContext.Provider, { value: { code, setCode, split }, children });
}
function useReferral() {
  return useContext(ReferralContext);
}
function useReferralCalculation(amountCents) {
  const { code, split } = useReferral();
  if (!code || amountCents <= 0) return null;
  return calculateReferral(amountCents, split);
}
function ReferralLink({ code, baseUrl, param = "ref", className, children }) {
  const [href, setHref] = useState("#");
  useEffect(() => {
    const base = baseUrl ?? window.location.origin + window.location.pathname;
    setHref(buildReferralUrl(base, code, param));
  }, [code, baseUrl, param]);
  return /* @__PURE__ */ jsx("a", { href, className, children: children ?? href });
}
function ReferralBanner({ amountCents, currencySymbol = "$", className }) {
  const calc = useReferralCalculation(amountCents);
  if (!calc) return null;
  const discountFormatted = (calc.discountCents / 100).toFixed(2);
  const pct = Math.round(calc.split.customer * 100);
  return /* @__PURE__ */ jsxs("div", { role: "status", className, children: [
    "Referral discount applied: ",
    pct,
    "% off \u2014 you save ",
    currencySymbol,
    discountFormatted
  ] });
}
function CopyReferralButton({
  code,
  baseUrl,
  param = "ref",
  className,
  copiedLabel = "Copied!",
  children = "Copy referral link"
}) {
  const [copied, setCopied] = useState(false);
  const handleClick = useCallback(async () => {
    const base = baseUrl ?? window.location.origin + window.location.pathname;
    const url = buildReferralUrl(base, code, param);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }, [code, baseUrl, param]);
  return /* @__PURE__ */ jsx("button", { type: "button", onClick: handleClick, className, children: copied ? copiedLabel : children });
}
export {
  CopyReferralButton,
  ReferralBanner,
  ReferralLink,
  ReferralProvider,
  useReferral,
  useReferralCalculation
};
//# sourceMappingURL=react.js.map
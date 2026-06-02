"use strict";
"use client";
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

// src/react.tsx
var react_exports = {};
__export(react_exports, {
  CopyReferralButton: () => CopyReferralButton,
  ReferralBanner: () => ReferralBanner,
  ReferralLink: () => ReferralLink,
  ReferralProvider: () => ReferralProvider,
  useReferral: () => useReferral,
  useReferralCalculation: () => useReferralCalculation
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");

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
var import_jsx_runtime = require("react/jsx-runtime");
var ReferralContext = (0, import_react.createContext)({
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
  const [code, setCodeState] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    const fromUrl = extractCode(window.location.href, param);
    if (fromUrl) {
      sessionStorage.setItem(storageKey, fromUrl);
      setCodeState(fromUrl);
      return;
    }
    const stored = sessionStorage.getItem(storageKey);
    if (stored) setCodeState(stored);
  }, [param, storageKey]);
  const setCode = (0, import_react.useCallback)(
    (next) => {
      setCodeState(next);
      if (next) sessionStorage.setItem(storageKey, next);
      else sessionStorage.removeItem(storageKey);
    },
    [storageKey]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferralContext.Provider, { value: { code, setCode, split }, children });
}
function useReferral() {
  return (0, import_react.useContext)(ReferralContext);
}
function useReferralCalculation(amountCents) {
  const { code, split } = useReferral();
  if (!code || amountCents <= 0) return null;
  return calculateReferral(amountCents, split);
}
function ReferralLink({ code, baseUrl, param = "ref", className, children }) {
  const [href, setHref] = (0, import_react.useState)("#");
  (0, import_react.useEffect)(() => {
    const base = baseUrl ?? window.location.origin + window.location.pathname;
    setHref(buildReferralUrl(base, code, param));
  }, [code, baseUrl, param]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href, className, children: children ?? href });
}
function ReferralBanner({ amountCents, currencySymbol = "$", className }) {
  const calc = useReferralCalculation(amountCents);
  if (!calc) return null;
  const discountFormatted = (calc.discountCents / 100).toFixed(2);
  const pct = Math.round(calc.split.customer * 100);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { role: "status", className, children: [
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
  const [copied, setCopied] = (0, import_react.useState)(false);
  const handleClick = (0, import_react.useCallback)(async () => {
    const base = baseUrl ?? window.location.origin + window.location.pathname;
    const url = buildReferralUrl(base, code, param);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }, [code, baseUrl, param]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: handleClick, className, children: copied ? copiedLabel : children });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CopyReferralButton,
  ReferralBanner,
  ReferralLink,
  ReferralProvider,
  useReferral,
  useReferralCalculation
});
//# sourceMappingURL=react.cjs.map
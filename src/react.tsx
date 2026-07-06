"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { buildReferralUrl, calculateReferral, extractCode } from "./core.js";
import type { ReferralCalculation, ReferralSplit } from "./types.js";
import { DEFAULT_SPLIT } from "./core.js";

// ─── Context ──────────────────────────────────────────────────────────────────

interface ReferralContextValue {
  code: string | null;
  setCode: (code: string | null) => void;
  split: ReferralSplit;
}

const ReferralContext = createContext<ReferralContextValue>({
  code: null,
  setCode: () => undefined,
  split: DEFAULT_SPLIT,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ReferralProviderProps {
  children: React.ReactNode;
  split?: ReferralSplit;
  /** URL query param name to read the code from. Default: "ref" */
  param?: string;
  /** Session-storage key for persisting the code across page loads. Default: "referral_code" */
  storageKey?: string;
}

export function ReferralProvider({
  children,
  split = DEFAULT_SPLIT,
  param = "ref",
  storageKey = "referral_code",
}: ReferralProviderProps) {
  const [code, setCodeState] = useState<string | null>(null);

  useEffect(() => {
    // 1. prefer URL param (so fresh links always win)
    const fromUrl = extractCode(window.location.href, param);
    if (fromUrl) {
      sessionStorage.setItem(storageKey, fromUrl);
      setCodeState(fromUrl);
      return;
    }
    // 2. fall back to session storage (persists across page navigations)
    const stored = sessionStorage.getItem(storageKey);
    if (stored) setCodeState(stored);
  }, [param, storageKey]);

  const setCode = useCallback(
    (next: string | null) => {
      setCodeState(next);
      if (next) sessionStorage.setItem(storageKey, next);
      else sessionStorage.removeItem(storageKey);
    },
    [storageKey]
  );

  return (
    <ReferralContext.Provider value={{ code, setCode, split }}>
      {children}
    </ReferralContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReferral() {
  return useContext(ReferralContext);
}

/** Returns the calculated discount/commission for a given amount in cents. */
export function useReferralCalculation(amountCents: number): ReferralCalculation | null {
  const { code, split } = useReferral();
  if (!code || amountCents <= 0) return null;
  return calculateReferral(amountCents, split);
}

// ─── Components ───────────────────────────────────────────────────────────────

interface ReferralLinkProps {
  code: string;
  baseUrl?: string;
  param?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Renders a shareable affiliate link. Falls back to current page URL if baseUrl is omitted. */
export function ReferralLink({ code, baseUrl, param = "ref", className, children }: ReferralLinkProps) {
  const [href, setHref] = useState("#");
  useEffect(() => {
    const base = baseUrl ?? window.location.origin + window.location.pathname;
    setHref(buildReferralUrl(base, code, param));
  }, [code, baseUrl, param]);

  return (
    <a href={href} className={className}>
      {children ?? href}
    </a>
  );
}

interface ReferralBannerProps {
  amountCents: number;
  currencySymbol?: string;
  className?: string;
}

/** Shows the discount the new customer will receive when a referral code is active. */
export function ReferralBanner({ amountCents, currencySymbol = "$", className }: ReferralBannerProps) {
  const calc = useReferralCalculation(amountCents);
  if (!calc) return null;

  const discountFormatted = (calc.discountCents / 100).toFixed(2);
  const pct = Math.round(calc.split.customer * 100);

  return (
    <div role="status" className={className}>
      Referral discount applied: {pct}% off — you save {currencySymbol}{discountFormatted}
    </div>
  );
}

interface CopyReferralButtonProps {
  code: string;
  baseUrl?: string;
  param?: string;
  className?: string;
  copiedLabel?: string;
  children?: React.ReactNode;
}

/** Button that copies the affiliate share link to the clipboard. */
export function CopyReferralButton({
  code,
  baseUrl,
  param = "ref",
  className,
  copiedLabel = "Copied!",
  children = "Copy referral link",
}: CopyReferralButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const base = baseUrl ?? window.location.origin + window.location.pathname;
    const url = buildReferralUrl(base, code, param);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code, baseUrl, param]);

  return (
    <button type="button" onClick={handleClick} className={className}>
      {copied ? copiedLabel : children}
    </button>
  );
}

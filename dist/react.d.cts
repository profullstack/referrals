import React from 'react';
import { R as ReferralSplit, c as ReferralCalculation } from './types-D0pmt9XK.cjs';

interface ReferralContextValue {
    code: string | null;
    setCode: (code: string | null) => void;
    split: ReferralSplit;
}
interface ReferralProviderProps {
    children: React.ReactNode;
    split?: ReferralSplit;
    /** URL query param name to read the code from. Default: "ref" */
    param?: string;
    /** Session-storage key for persisting the code across page loads. Default: "referral_code" */
    storageKey?: string;
}
declare function ReferralProvider({ children, split, param, storageKey, }: ReferralProviderProps): React.JSX.Element;
declare function useReferral(): ReferralContextValue;
/** Returns the calculated discount/commission for a given amount in cents. */
declare function useReferralCalculation(amountCents: number): ReferralCalculation | null;
interface ReferralLinkProps {
    code: string;
    baseUrl?: string;
    param?: string;
    className?: string;
    children?: React.ReactNode;
}
/** Renders a shareable affiliate link. Falls back to current page URL if baseUrl is omitted. */
declare function ReferralLink({ code, baseUrl, param, className, children }: ReferralLinkProps): React.JSX.Element;
interface ReferralBannerProps {
    amountCents: number;
    currencySymbol?: string;
    className?: string;
}
/** Shows the discount the new customer will receive when a referral code is active. */
declare function ReferralBanner({ amountCents, currencySymbol, className }: ReferralBannerProps): React.JSX.Element | null;
interface CopyReferralButtonProps {
    code: string;
    baseUrl?: string;
    param?: string;
    className?: string;
    copiedLabel?: string;
    children?: React.ReactNode;
}
/** Button that copies the affiliate share link to the clipboard. */
declare function CopyReferralButton({ code, baseUrl, param, className, copiedLabel, children, }: CopyReferralButtonProps): React.JSX.Element;

export { CopyReferralButton, ReferralBanner, ReferralLink, ReferralProvider, useReferral, useReferralCalculation };

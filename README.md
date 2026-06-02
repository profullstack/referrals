# @profullstack/referrals

Referral program SDK with an 80/20 split: **60% commission to the affiliate**, **20% discount to the new customer**.

## Install

```bash
npm install @profullstack/referrals
```

## Split

| Party         | Value |
|---------------|-------|
| Affiliate     | 60%   |
| New customer  | 20%   |
| **Total**     | **80%** |

## Core (framework-agnostic)

```ts
import {
  DEFAULT_SPLIT,
  createCode,
  validateCode,
  applyReferral,
  calculateReferral,
  buildReferralUrl,
  extractCode,
} from "@profullstack/referrals";

// Create a referral code for a user
const code = await createCode("user-123", store);
// → { code: "AB3K7PQZ", ownerId: "user-123", ... }

// Build a shareable link
const link = buildReferralUrl("https://myapp.com/signup", code.code);
// → "https://myapp.com/signup?ref=AB3K7PQZ"

// Calculate discount + commission for $99.00
const calc = calculateReferral(9900);
// → { discountCents: 1980, commissionCents: 5940, finalAmountCents: 7920 }

// Apply the referral when the new user pays
const usage = await applyReferral({
  code: "AB3K7PQZ",
  newUserId: "new-user-456",
  amountCents: 9900,
  store,
});
```

### Implementing `ReferralStore`

The core functions take a `ReferralStore` — wire it to your database:

```ts
import type { ReferralStore } from "@profullstack/referrals";
import { supabase } from "@/lib/supabase";

export const referralStore: ReferralStore = {
  async saveCode(code) {
    await supabase.from("referral_codes").insert(code);
  },
  async getCode(code) {
    const { data } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    return data;
  },
  async saveUsage(usage) {
    await supabase.from("referral_usages").insert(usage);
  },
  async getUsagesByAffiliate(affiliateId) {
    const { data } = await supabase
      .from("referral_usages")
      .select("*")
      .eq("affiliate_id", affiliateId);
    return data ?? [];
  },
};
```

## React

```tsx
import { ReferralProvider, useReferral, ReferralBanner, CopyReferralButton } from "@profullstack/referrals/react";

// Wrap your app (reads ?ref= from URL automatically)
<ReferralProvider>
  <App />
</ReferralProvider>

// Show discount banner during checkout
<ReferralBanner amountCents={9900} currencySymbol="$" />
// → "Referral discount applied: 20% off — you save $19.80"

// Affiliate share button
<CopyReferralButton code={myCode} baseUrl="https://myapp.com/signup" />
```

## Next.js App Router

**`app/api/referrals/route.ts`**
```ts
import { makeReferralHandlers } from "@profullstack/referrals/next";
import { referralStore } from "@/lib/referral-store";
import { getUser } from "@/lib/auth";

export const { GET, POST } = makeReferralHandlers({
  store: referralStore,
  getUserId: async (req) => {
    const user = await getUser(req);
    return user?.id ?? null;
  },
});
```

**`middleware.ts`** — persist the `?ref=` code in a cookie across page navigations:
```ts
import { NextResponse } from "next/server";
import { trackReferralCode } from "@profullstack/referrals/next";

export function middleware(request) {
  return trackReferralCode(request, NextResponse.next());
}
```

## API routes

| Method | Params                                | Description                       |
|--------|---------------------------------------|-----------------------------------|
| GET    | `?action=validate&ref=CODE`           | Check if a code is valid          |
| GET    | `?action=mycode`                      | Get current user's referral usages |
| POST   | `{ action: "create" }`               | Create a new referral code        |
| POST   | `{ action: "apply", code, amount }`  | Apply a code to a purchase        |

## Publishing to npm

```bash
cd ~/src/referrals
npm login   # one-time
npm publish --access public
```

Then update the dependency in each project from `file:../referrals` to `^0.1.0`.

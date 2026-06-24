# Provider and BYOK strategy

This document is the authoritative NodeHire provider contract. It replaces earlier free-first and never-persist-BYOK assumptions.

## Routing tiers

1. **Shared cache — everyone.** Exact lookup is keyed only by `ontology_leaf_id + mode + difficulty`. No company, role, JD, user, or provider belongs in the key.
2. **App Gemini — anonymous only.** Best-effort first taste, guarded by the UTC global `GEMINI_DAILY_CEILING`. Only successful calls atomically increment `app_usage_daily`. Logged-in users never consume this pool. On ceiling/quota failure: closest same-leaf cache, then BYOK.
3. **BYOK — scalable live AI.** Gemini, OpenAI, and Anthropic. Required for logged-in live generation/evaluation beyond cache; optional for anonymous users after Tier 2. BYOK never consumes the app ceiling.

The floor is the closest cached question, even across leaves, with its ideal answer for self-grading. There is no local-LLM or web-search substitute.

## Secret handling

- Every provider call is server-proxied.
- Call `redactSecrets()` before logging any provider error.
- Never silently switch provider after a BYOK failure. Normalize invalid-key, rate-limit, and outage errors distinctly.
- Anonymous and non-persisted logged-in keys live in `sessionStorage`, expire after 24 hours, and are cleared on tab close or logout.
- Logged-in users may explicitly opt into **Remember this key**. Persist only a versioned AES-256-GCM encrypted envelope, protected by a server-held encryption key, in a service-role-only table. Never expose ciphertext through client-readable policies.
- Settings must include a hard-delete Disconnect action.

## On-demand onboarding

Do not prompt on first load. Deliver value through cache (and anonymous Tier 2) first. Show **Keep going — connect a free key** only when live AI is actually needed.

Connecting a provider must:

1. Open the official key-creation page in a new tab.
2. Show `1. Create key → 2. Copy it → 3. Paste below`.
3. Focus the paste input on `visibilitychange` when NodeHire becomes visible again.
4. Validate through one lightweight server-proxied request and immediately show Connected, Invalid key, Rate limited, or Provider unavailable.
5. Offer persistence to logged-in users as an unchecked opt-in, never a default.

Trust copy:

- Anonymous/session-only: **Never stored—sent securely only to proxy this request, then discarded.**
- Persisted account key: **This key is encrypted and saved to your account so you won't need to paste it again. You can disconnect it anytime in Settings.**

When anonymous Tier 2 is exhausted, compute reset copy from the UTC day boundary: **Free AI questions reset at 00:00 UTC — connect your own free Gemini key to continue now, or check back after reset.**

## Cache and usage requirements

- Keep the composite index on `question_bank(ontology_leaf_id, mode, difficulty)`.
- Closest-match lookup first relaxes difficulty/mode on the same leaf, then considers other leaves.
- `app_usage_daily` is aggregate platform protection, not a user quota.
- Failed and timed-out app-key calls do not increment successful usage.

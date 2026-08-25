-- Backfill for the UKSubscription -> User merge (see prisma/schema.prisma).
--
-- This session had no DATABASE_URL, so this could not be run or tested against
-- a real database. Review it and run it yourself, in this order:
--
--   1. On the OLD schema (UKSubscription model still present), add the new
--      `plan` column to User without dropping UKSubscription yet:
--        npx prisma db push
--      (Prisma will add User.plan; UKSubscription is untouched at this point.)
--
--   2. Run this script against that same database to copy every active
--      UKSubscription row into the unified User fields.
--
--   3. Pull the current prisma/schema.prisma from this branch (UKSubscription
--      model removed) and run `npx prisma db push` again — this drops the
--      now-empty UKSubscription table.
--
-- What this does: for every user with an active UK subscription, mirrors it
-- onto the fields the rest of the app already reads (isPro/credits/
-- proExpiresAt/plan) using the exact same semantics the old UK code paths
-- used — see app/api/uk/subscription/route.ts and app/api/uk/credits/route.ts
-- for the logic this replicates.
--
--   - plan = 'pro'     -> isPro = true,  credits unchanged, proExpiresAt = expiresAt
--   - plan = 'trial'   -> isPro = true,  credits unchanged, proExpiresAt = expiresAt
--                         (trial granted unrestricted-ish access via `active`,
--                         same as isPro does for the rest of the app; expiring
--                         it is already handled generically by the auto-expire
--                         check in app/api/credits/route.ts)
--   - plan = 'credits' -> isPro stays false, credits = GREATEST(existing, sub.credits)
--   - plan = 'free'    -> nothing to copy
--
-- Inactive subscriptions (active = false) are skipped — those users already
-- have no access under the old system, so plan is set to 'free' for the
-- record but isPro/credits are left untouched.

UPDATE "User" u
SET "plan" = s.plan
FROM "UKSubscription" s
WHERE s."userId" = u.id;

UPDATE "User" u
SET
  "isPro" = true,
  "proExpiresAt" = s."expiresAt"
FROM "UKSubscription" s
WHERE s."userId" = u.id
  AND s.active = true
  AND s.plan IN ('pro', 'trial');

UPDATE "User" u
SET "credits" = GREATEST(u.credits, s.credits)
FROM "UKSubscription" s
WHERE s."userId" = u.id
  AND s.active = true
  AND s.plan = 'credits';

-- Sanity check before moving on to step 3 — review these rows manually.
-- SELECT u.id, u.email, u.plan, u."isPro", u.credits, u."proExpiresAt"
-- FROM "User" u JOIN "UKSubscription" s ON s."userId" = u.id;

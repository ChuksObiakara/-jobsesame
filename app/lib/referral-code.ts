import { createHash } from 'crypto';

// Deterministic referral code derived from a Clerk user id.
//
// The previous implementation — Buffer.from(userId).toString('base64').slice(0, 8) —
// took only the first 8 base64 characters, which come almost entirely from
// the shared "user_2"/"user_3"/... version prefix every Clerk id in a given
// project starts with. Two different real users' ids collapsed to the same
// 8 characters far more often than not, so the *second* user to ever sign
// up (via /api/user/sync, fired on every dashboard mount) or upload a CV
// (via /api/cv or /api/user/cv) would hit a unique-constraint violation on
// referralCode while creating their User row — silently failing account
// creation and, downstream, every CV save for that account.
//
// Hashing the full id spreads entropy across the whole output instead of
// reading off a handful of shared leading bytes, so two different ids no
// longer collide just for sharing a prefix.
export function referralCodeFor(userId: string): string {
  return createHash('sha256').update(userId).digest('hex').slice(0, 8).toUpperCase();
}

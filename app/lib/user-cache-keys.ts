// Per-user namespacing for the client-side localStorage caches used across the
// dashboard, onboarding and quick-apply flows.
//
// These caches exist only to avoid a blank/loading flash before the
// authoritative database fetch resolves — but because localStorage is shared
// by every account that ever signs into the same browser, a *global* key
// (the previous behaviour) leaks the last-used account's CV/profile/
// applications into a brand-new account's UI the instant it mounts, before
// the DB fetch has a chance to overwrite it. Namespacing every key by the
// signed-in Clerk user id makes that leak structurally impossible: a
// different account can never read another account's cached entry, even
// momentarily.
//
// Always guard on `userId` being present (i.e. Clerk has finished loading)
// before reading or writing — these helpers intentionally have no
// "unscoped" fallback, so a not-yet-loaded user simply sees no cache instead
// of risking a cross-account read.

export const cvCacheKey = (userId: string) => `jobsesame_cv_data_${userId}`;
export const applicationsCacheKey = (userId: string) => `jobsesame_applications_${userId}`;
export const profileCacheKey = (userId: string) => `jobsesame_profile_${userId}`;
export const applyCountCacheKey = (userId: string) => `jobsesame_apply_count_${userId}`;

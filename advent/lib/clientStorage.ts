'use client';

/**
 * Client-side helpers to keep user-specific state in localStorage.
 */
const USER_ID_KEY = 'adventCalendarUserId';
const OPENED_DOORS_PREFIX = 'openedDoors';
const POLL_PARTICIPATION_PREFIX = 'pollParticipation';

/**
 * Returns a stable user id stored in localStorage or creates one if missing.
 */
export function getOrCreateUserId(): string | null {
  if (typeof window === 'undefined') return null;

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

const buildUserKey = (prefix: string, userId?: string | null) =>
  `${prefix}${userId ? `_${userId}` : ''}`;

/**
 * Load opened doors for a specific user. Falls back to the legacy global key.
 */
export function loadOpenedDoors(userId?: string | null): number[] {
  if (typeof window === 'undefined') return [];

  const userKey = buildUserKey(OPENED_DOORS_PREFIX, userId);
  const raw = localStorage.getItem(userKey);
  if (raw) return safeParseArray(raw);

  // Legacy fallback (pre user-id)
  const legacy = localStorage.getItem(OPENED_DOORS_PREFIX);
  return legacy ? safeParseArray(legacy) : [];
}

/**
 * Persist opened doors for a specific user.
 */
export function saveOpenedDoors(doors: number[], userId?: string | null) {
  if (typeof window === 'undefined') return;
  const userKey = buildUserKey(OPENED_DOORS_PREFIX, userId);
  localStorage.setItem(userKey, JSON.stringify(doors));
}

/**
 * Load poll participation per door (doorNumber -> chosen option) for a user.
 */
export function loadPollParticipation(userId?: string | null): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const userKey = buildUserKey(POLL_PARTICIPATION_PREFIX, userId);
  const raw = localStorage.getItem(userKey);
  return raw ? safeParseRecord(raw) : {};
}

/**
 * Store the chosen option for a poll for the current user.
 */
export function savePollParticipation(
  doorNumber: number,
  option: string,
  userId?: string | null
) {
  if (typeof window === 'undefined') return;
  const userKey = buildUserKey(POLL_PARTICIPATION_PREFIX, userId);
  const existing = loadPollParticipation(userId);
  const updated = { ...existing, [doorNumber]: option };
  localStorage.setItem(userKey, JSON.stringify(updated));
}

const safeParseArray = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeParseRecord = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

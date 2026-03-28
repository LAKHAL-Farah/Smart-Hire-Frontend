const USER_ID_KEYS = [
  'smarthire.userId',
  'smarthire_user_id',
  'userId',
  'currentUserId',
  'authUser',
  'user',
];

const HARDCODED_FALLBACK_USER_ID = 1;

function parseUserIdCandidate(raw: string | null): number | null {
  if (!raw) {
    return null;
  }

  const text = raw.trim();
  if (!text) {
    return null;
  }

  if (/^\d+$/.test(text)) {
    const parsed = Number(text);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const asRecord = parsed as Record<string, unknown>;
    const direct = asRecord['userId'] ?? asRecord['id'];
    if (typeof direct === 'number' && Number.isInteger(direct) && direct > 0) {
      return direct;
    }
    if (typeof direct === 'string' && /^\d+$/.test(direct)) {
      return Number(direct);
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveCurrentUserId(): number | null {
  for (const key of USER_ID_KEYS) {
    const local = parseUserIdCandidate(globalThis.localStorage?.getItem(key) ?? null);
    if (local) {
      return local;
    }

    const session = parseUserIdCandidate(globalThis.sessionStorage?.getItem(key) ?? null);
    if (session) {
      return session;
    }
  }

  return HARDCODED_FALLBACK_USER_ID;
}

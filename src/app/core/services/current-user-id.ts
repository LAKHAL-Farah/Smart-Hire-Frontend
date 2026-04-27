const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_USER_UUID_STORAGE_KEY = 'smarthire_profile_user_uuid';

function parseUuid(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

function parseStoredJson(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function resolveCurrentProfileUserId(): string | null {
  const directKeys = [
    'UserId',
    'userId',
    'user_id',
    'uid',
    PROFILE_USER_UUID_STORAGE_KEY,
  ];

  for (const key of directKeys) {
    const parsed = parseUuid(localStorage.getItem(key));
    if (parsed) {
      if (key !== PROFILE_USER_UUID_STORAGE_KEY) {
        localStorage.setItem(PROFILE_USER_UUID_STORAGE_KEY, parsed);
      }
      return parsed;
    }
  }

  const user = parseStoredJson('user');
  if (user && typeof user === 'object') {
    const userRecord = user as Record<string, unknown>;
    const possibleUserIds = [
      userRecord['id'],
      userRecord['userId'],
      userRecord['UserId'],
      userRecord['uid'],
    ];

    for (const candidate of possibleUserIds) {
      const parsed = parseUuid(candidate);
      if (parsed) {
        localStorage.setItem(PROFILE_USER_UUID_STORAGE_KEY, parsed);
        return parsed;
      }
    }
  }

  return null;
}

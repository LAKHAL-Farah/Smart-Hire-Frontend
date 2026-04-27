export function resolveRoadmapUserId(): number | null {
  const session = localStorage.getItem('user');
  let sessionIdRaw: string | null = null;
  let hasNonNumericSessionId = false;

  if (session) {
    try {
      const parsed = JSON.parse(session) as { id?: string | number };
      sessionIdRaw = parsed?.id != null ? String(parsed.id).trim() : null;
      const candidate = Number(sessionIdRaw);
      if (Number.isFinite(candidate) && candidate > 0) {
        return candidate;
      }

      if (sessionIdRaw) {
        hasNonNumericSessionId = true;
      }
    } catch {
      // Ignore malformed session payload and continue with legacy keys.
    }
  }

  const keys = ['userId', 'UserId', 'user_id', 'uid'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    if (hasNonNumericSessionId) {
      // If we have a logged-in session id that is non-numeric (UUID), do not
      // silently reuse legacy numeric ids from previous sessions.
      if (!sessionIdRaw || raw.trim() !== sessionIdRaw) {
        continue;
      }
    }

    const candidate = Number(raw);
    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }

  return null;
}

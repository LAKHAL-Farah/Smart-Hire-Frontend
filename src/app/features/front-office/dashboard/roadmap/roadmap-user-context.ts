export function resolveRoadmapUserId(): number | null {
  const session = localStorage.getItem('user');
  if (session) {
    try {
      const parsed = JSON.parse(session) as { id?: string | number };
      const candidate = Number(parsed?.id);
      if (Number.isFinite(candidate) && candidate > 0) {
        return candidate;
      }
    } catch {
      // Ignore malformed session payload and continue with legacy keys.
    }
  }

  const keys = ['userId', 'user_id', 'uid'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }
    const candidate = Number(raw);
    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }

  return null;
}

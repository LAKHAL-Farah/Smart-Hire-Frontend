/** Maps onboarding career path → MS-Assessment `skill` string (domain for tasks/quiz). */
export function careerPathToAssessmentSkill(careerPath: string | null | undefined): string {
  const c = (careerPath ?? 'fullstack').toLowerCase();
  const map: Record<string, string> = {
    frontend: 'FRONTEND',
    backend: 'BACKEND',
    fullstack: 'FULLSTACK',
    devops: 'DEVOPS',
    data: 'DATA',
    mobile: 'MOBILE',
  };
  return map[c] ?? 'FULLSTACK';
}

/**
 * Adaptive difficulty: each finished assessment session increases difficulty tier.
 * `count` = number of completed sessions stored on the profile (approximate).
 */
export function retakeCountToLevel(completedSessionCount: number): string {
  if (completedSessionCount <= 0) return 'JUNIOR';
  if (completedSessionCount === 1) return 'MID';
  if (completedSessionCount === 2) return 'SENIOR';
  return 'SENIOR';
}

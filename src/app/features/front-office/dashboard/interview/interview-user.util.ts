export const INTERVIEW_USER_ID = 1;

export function resolveCurrentUserId(): number {
  return INTERVIEW_USER_ID;
}

export function isCurrentInterviewUser(userId: number | null | undefined): boolean {
  return Number(userId) === INTERVIEW_USER_ID;
}

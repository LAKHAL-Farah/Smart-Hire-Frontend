/**
 * CareerPath Model - Represents a career path suggestion
 */
export interface CareerPath {
  id?: number;
  name: string;
  description?: string;
  requiredSkills?: string;
  targetRoles?: string;
  averageSalary: number;
}

/**
 * CareerPath UI Model - Extended for UI display
 */
export interface CareerPathUI extends CareerPath {
  percentage?: number;
  gradient?: string;
}

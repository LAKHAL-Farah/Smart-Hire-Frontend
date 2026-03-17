/**
 * Skill Model - Represents a skill in the assessment system
 */
export interface Skill {
  id?: number;
  name: string;
  category: string;
  description?: string;
  createdAt?: string;
}

/**
 * Skill UI Model - Extended skill model for UI display
 */
export interface SkillUI extends Skill {
  score?: number;
}

export type ProcessingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type CVVersionType = 'ORIGINAL' | 'TAILORED' | 'GENERIC_OPTIMIZED';

export type FileFormat = 'PDF' | 'DOCX';

export type TipPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type ProfileType = 'CV' | 'LINKEDIN' | 'GITHUB';

export type DiffType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export interface DiffSection {
  sectionName: string;
  diffType: DiffType;
  originalContent: string;
  revisedContent: string;
  addedKeywords: string[];
  removedKeywords: string[];
  changeSummary: string;
}

export interface DiffResult {
  sections: DiffSection[];
  totalChanges: number;
  keywordsAdded: number;
  keywordsRemoved: number;
  sentencesRewritten: number;
}

export interface CompletenessSection {
  present: boolean;
  score: number;
  feedback: string;
}

export interface CompletenessResult {
  overallScore: number;
  sections: Record<string, CompletenessSection>;
  missingElements: string[];
  weakElements: string[];
  verdict: string;
}

export interface ProfileTipDto {
  id: string;
  userId: string;
  profileType: ProfileType;
  sourceEntityId: string;
  tipText: string;
  priority: TipPriority;
  isResolved: boolean;
  createdAt: string;
}

export interface CandidateCvDto {
  id: string;
  userId: string;
  originalFileName: string;
  fileFormat: FileFormat;
  parsedContent: string | null;
  parseErrorMessage?: string | null;
  completenessAnalysis?: string | null;
  parseStatus: ProcessingStatus;
  atsScore: number | null;
  isActive: boolean;
  uploadedAt: string;
  updatedAt: string;
}

export interface CvVersionDto {
  id: string;
  cvId: string;
  jobOfferId: string | null;
  versionType: CVVersionType;
  tailoredContent: string;
  atsScore: number | null;
  keywordMatchRate: number | null;
  atsAnalysis?: string | null;
  diffContent?: string | null;
  completenessAnalysis?: string | null;
  exportedFileUrl: string | null;
  generatedAt: string;
}

export interface JobOfferDto {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  rawDescription: string;
  extractedKeywords: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export interface CreateJobOfferRequest {
  title: string;
  company?: string;
  rawDescription: string;
  sourceUrl?: string;
}

export interface AtsScoreDto {
  cvId: string;
  atsScore: number;
}

export interface ParsedCvContent {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

export interface CvCompleteness {
  contact: boolean;
  summary: boolean;
  skills: boolean;
  experience: boolean;
  education: boolean;
}

export interface TailorResultMetrics {
  scoreDelta: number;
  keywordMatchRate: number;
}

export interface LinkedInSectionScores {
  headline: number;
  summary: number;
  skills: number;
  recommendations: number;
  globalScore: number;
  headlineFeedback: string;
  summaryFeedback: string;
  skillsFeedback: string;
  recommendationsFeedback: string;
}

export interface LinkedInProfileDto {
  id: string;
  userId: string;
  rawContent: string | null;
  analysisStatus: ProcessingStatus;
  scrapeErrorMessage: string | null;
  globalScore: number | null;
  sectionScoresJson: string | null;
  currentHeadline: string | null;
  optimizedHeadline: string | null;
  currentSummary: string | null;
  optimizedSummary: string | null;
  currentSkills: string | null;
  optimizedSkills: string | null;
  jobAlignedHeadline: string | null;
  jobAlignedSummary: string | null;
  jobAlignedSkills: string | null;
  alignedJobOfferId: string | null;
  createdAt: string;
  analyzedAt: string | null;
}

export interface GitHubRepoDto {
  id: string;
  repoName: string;
  repoUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  forksCount: number;
  isForked: boolean;
  isArchived: boolean;
  pushedAt: string | null;
  readmeScore: number | null;
  hasCiCd: boolean | null;
  hasTests: boolean | null;
  codeStructureScore: number | null;
  auditFeedback: string | null;
  fixSuggestions: string | null;
  overallScore: number | null;
}

export interface GitHubProfileFeedback {
  profileSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  recruiterImpression: string;
}

export interface GitHubProfileDto {
  id: string;
  userId: string;
  githubUsername: string;
  profileUrl: string;
  overallScore: number | null;
  repoCount: number | null;
  topLanguages: string | null;
  profileReadmeScore: number | null;
  feedback: string | null;
  auditStatus: ProcessingStatus;
  auditErrorMessage: string | null;
  createdAt: string;
  analyzedAt: string | null;
  repositories: GitHubRepoDto[];
}

export interface AuditGitHubRequest {
  githubProfileUrl: string;
}

export type ProcessingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type CVVersionType = 'ORIGINAL' | 'TAILORED' | 'GENERIC_OPTIMIZED';

export type FileFormat = 'PDF' | 'DOCX';

export type TipPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type ProfileType = 'CV' | 'LINKEDIN' | 'GITHUB';

export interface CandidateCvDto {
  id: string;
  userId: string;
  originalFileName: string;
  fileFormat: FileFormat;
  parsedContent: string | null;
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

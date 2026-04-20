export interface MLScenarioAnswer {
  id: number;
  answerId: number;
  modelChosen: string | null;
  features: string[] | null;
  metrics: string[] | null;
  deployment: string | null;
  dataPreprocessing: string | null;
  evaluationStrategy: string | null;
  mlScore: number | null;
  mlFeedback: string | null;
  followUpGenerated: string | null;
}

export interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  highlighted: boolean;
  order: number;
}

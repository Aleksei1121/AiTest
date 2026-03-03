export type TaskType =
  | 'generation'
  | 'refactoring'
  | 'new_feature_generation'
  | 'script_generation'
  | 'script_refactoring'
  | 'new_script_generation'
  | 'autotesting';

export interface WarningTestCase {
  id: number;
  name: string;
}

export interface PlannerTask {
  id: string;
  projectId: number;
  projectName: string;
  owner: string;
  startTime: string;
  taskType: TaskType;
  endTime?: string;

  parsingResult?: {
    total: number;
    warnings: number;
  };

  refactoringResult?: {
    totalChecked: number;
    unchanged: number;
    draftNewVersions: number;
  };

  newFeatureResult?: {
    totalChecked: number;
    newDraft: number;
    deprecated: number;
  };

  scriptGenerationResult?: {
    processedTestCases: number;
    generatedScripts: number;
  };

  scriptRefactoringResult?: {
    totalChecked: number;
    unchanged: number;
    draftNewVersions: number;
  };

  newScriptGenerationResult?: {
    createdScripts: number;
  };

  autotestingResult?: {
    testPlanName: string;
    testCases: Array<{ id: number; name: string }>;
  };

  warningTestCases?: WarningTestCase[];
}
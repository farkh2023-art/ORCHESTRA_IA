export type ProjectStatusTask = {
  id: string;
  role: string;
  status: string;
  dependsOn: string[];
  input: unknown;
  output: unknown;
  error: string | null;
  tokensUsed: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStatusMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  taskId: string | null;
};

export type ProjectStatusValidationReport = {
  id: string;
  taskId: string | null;
  agentInstanceId: string | null;
  scope: string;
  status: string;
  overallScore: number;
  alignmentScore: number;
  approved: boolean;
  createdAt: string;
};

export type ProjectStatusPayload = {
  project: {
    id: string;
    title: string;
    brief: string;
    status: string;
    finalOutput: unknown;
    createdAt: string;
    updatedAt: string;
  };
  spec: {
    id: string;
    version: number;
    content: unknown;
    createdAt: string;
  } | null;
  tasks: ProjectStatusTask[];
  waitingHumanTasks: ProjectStatusTask[];
  messages: ProjectStatusMessage[];
  traces: {
    costUsd: number;
    tokensIn: number;
    tokensOut: number;
    totalTokens: number;
  };
  validationReports: ProjectStatusValidationReport[];
};

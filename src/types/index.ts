
export type AutonomyLevel = typeof AutonomyLevelValues[number];

export const InteractionStyleValues = ["Conversational (Text)", "Conversational (Voice)", "API-driven", "UI-based Interaction", "Proactive"] as const;
export type InteractionStyle = typeof InteractionStyleValues[number];

export const DeploymentModelValues = ["SaaS", "Cloud-Hosted", "On-Premise", "API-based", "Embedded", "Hybrid"] as const;
export type DeploymentModel = typeof DeploymentModelValues[number];

export const TargetBusinessSizeValues = ["Startup", "SMB (Small & Medium Business)", "Enterprise", "Individual"] as const;
export type TargetBusinessSize = typeof TargetBusinessSizeValues[number];

export interface CaseStudy {
  description: string;
  link?: string; // Optional link to a case study or portfolio item
}

export interface PriceTier {
  name: string;
  price: string;
  features: string[];
  description?: string;
}

export interface Review {
  id: string;
  agentId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  dataAiHint?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  shortDescription?: string; // New: A concise summary/tagline
  verified?: boolean; // New: Verified by AgentVerse badge
  description: string; // Existing: More detailed explanation
  developer: string; // Company or individual offering the agent
  developerId?: string; // Link to the UserProfile of the developer
  avatarUrl?: string;
  dataAiHint?: string;
  version: string;
  dateListed?: string; // New: ISO date string
  lastUpdated: string; // ISO date string

  primaryFunction?: string;
  specificSubTasks?: string[];
  capabilities?: string[];
  intendedUseCases?: string[];
  targetIndustry?: string[];
  targetBusinessSize?: TargetBusinessSize[];
  autonomyLevel?: AutonomyLevel;
  decisionMakingCapabilities?: string[];
  interactionStyle?: InteractionStyle[];

  underlyingAiTechnologies?: string[];
  underlyingModels?: string[];
  techStack?: string[];
  inputDataFormats?: string[];
  outputDataFormats?: string[];
  languagesSupported?: string[];
  scalabilityInfo?: string;
  computationalRequirements?: string;

  keyPerformanceMetrics?: { metric: string; value: string; description?: string }[];
  caseStudies?: CaseStudy[];
  benchmarkingResultsLink?: string;
  evaluationMethodology?: string;
  knownLimitationsBiases?: string[];
  explainabilityFeatures?: string;

  deploymentModel?: DeploymentModel[];
  integrations?: string[];
  easeOfIntegration?: string;
  documentationLink?: string;
  typicalTimeToDeploy?: string;

  pricingModel?: string;
  priceTiers?: PriceTier[];
  freeTrialAvailable?: boolean;
  freeTrialDetails?: string;

  supportChannels?: string[];
  supportHours?: string;
  slas?: string;
  maintenanceUpdatePolicy?: string;

  dataSecurityPractices?: string[];
  securityCompliance?: string[];
  ethicalGuidelinesAdherence?: string;
  transparencyMeasures?: string[];
  biasMitigationEfforts?: string;
  auditability?: string;

  rating: number;
  reviewsCount: number;
  tags?: string[];

  // AgentVerse Control Plane (ACP) Runtime & Governance Config
  systemPrompt?: string;
  endpointUrl?: string;
  samplePrompts?: string[];
}

export type ExecutionStatus =
  | "completed"
  | "blocked_guardrail"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "error";

export interface GuardrailScanResult {
  passed: boolean;
  promptInjectionDetected: boolean;
  promptInjectionReason?: string;
  piiRedactedCount: number;
  piiTypesFound: string[];
  sanitizedPrompt: string;
  highRiskActionDetected: boolean;
  detectedActions: string[];
}

export interface AgentExecutionLog {
  id: string;
  agentId: string;
  agentName: string;
  developer: string;
  userId: string;
  taskPrompt: string;
  sanitizedPrompt: string;
  autonomyPolicy: AutonomyLevel;
  piiRedactionEnabled: boolean;
  status: ExecutionStatus;
  guardrail: GuardrailScanResult;
  output?: {
    summary: string;
    reasoningSteps: string[];
    proposedActions: {
      tool: string;
      operation: string;
      riskLevel: "low" | "medium" | "high";
      payloadPreview: string;
    }[];
    deliverable: string;
  };
  latencyMs: number;
  estimatedTokens: number;
  costUsd: number;
  modelUsed?: string;
  createdAt: string;
}

// ...

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string;
  bio?: string;
  stripeAccountId?: string; // New: Connected Stripe Express Account ID
  createdAt: string; // ISO date string
}

export interface CompanyTestimonial {
  reviewerName: string;
  testimonial: string;
  projectName: string;
  date: string; // ISO date string
}

export const BudgetCategoryValues = [
  "Under $1,000",
  "$1,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "Over $25,000",
  "Hourly Rate",
  "To Be Discussed",
] as const;

export type BudgetCategory = typeof BudgetCategoryValues[number];

export const AutonomyLevelValues = [
  "Tool/Integration",
  "Workflow Automation",
  "Assisted Decision-Making",
  "Fully Autonomous Operation",
] as const;


export interface JobRequest {
  id: string;
  companyName: string;
  companyLogoUrl?: string;
  dataAiHintCompanyLogo?: string;
  projectTitle: string;
  projectDescription: string;
  requiredSkills: string[];
  projectTechStack?: string[];
  desiredAutonomyLevel?: AutonomyLevel;
  budget: string;
  budgetCategory?: BudgetCategory;
  duration?: string;
  postedDate: string;
  status: 'Open' | 'In Progress' | 'Closed';
  contactEmail: string;
  agentBenefits?: string;
  preferredOnboardingDate?: string;

  companyRating?: number;
  companyPaymentHistorySummary?: string;
  companyWorkStyle?: 'Hands-on Collaboration' | 'Autonomous Implementation Preferred' | 'Flexible Approach';
  companyTestimonials?: CompanyTestimonial[];
}

export const AvailableSkills: string[] = [
  "Data Analysis", "Content Generation", "Customer Service", "Code Generation",
  "Research", "Planning", "Financial Modeling", "Healthcare Diagnostics",
  "Social Media Management", "Translation", "Image Recognition", "Process Automation",
  "Marketing Strategy", "SEO Optimization", "UI/UX Design", "Project Management",
  "Chatbot Development", "Natural Language Processing", "Salesforce Integration", "Lead Qualification", "DialogFlow",
  "Python", "Pandas", "Environmental Science", "Educational Technology", "Personalization Algorithms", "Adaptive Learning Systems",
  "Shopify Integration", "CRM Integration"
];

export const CommonTechStacks: string[] = [
  "Python", "JavaScript", "Java", "C#", "C++", "TypeScript",
  "React", "Angular", "Vue.js", "Node.js", "Django", "Ruby on Rails", "Spring Boot",
  "AWS", "Azure", "Google Cloud Platform (GCP)", "Docker", "Kubernetes",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "NoSQL",
  "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "Spark",
  "iOS", "Android", "Swift", "Kotlin", "Unity", "Unreal Engine",
  "Salesforce Apex", "Heroku", "DialogFlow API", "AWS Sagemaker", "Google Cloud AI Platform",
  "Shopify API"
];

// For NLP-powered job post autofill
export interface AutofillJobDetailsInput {
  naturalLanguageQuery: string;
  availableSkills: string[];
}

export interface AutofillJobDetailsOutput {
  suggestedProjectTitle?: string;
  refinedProjectDescription?: string;
  suggestedSkills?: string[];
}



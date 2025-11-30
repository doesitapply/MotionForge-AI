
export enum Jurisdiction {
  D_NEV = 'Federal - District of Nevada (D. Nev.)',
  WASHOE = 'Nevada State - Washoe County (2nd JD)',
  CLARK = 'Nevada State - Clark County (8th JD)',
  NV_SUPREME = 'Nevada Supreme Court',
}

export type CaseEvent = {
  id: string;
  date: number;
  title: string;
  description: string;
  type: 'FILING' | 'HEARING' | 'ORDER' | 'OTHER';
};

export type Evidence = {
  id: string;
  filename: string;
  mimeType: string;
  data: string; // Base64
  size: number;
  uploadedAt: number;
  ocrText?: string; // Extracted text from the document
};

export type CaseProfile = {
  id: string;
  nickname: string;
  jurisdiction: Jurisdiction;
  caseNumber: string;
  courtName: string;
  judge: string;
  plaintiff: string;
  defendant: string;
  globalFacts: string; // The canonical story of the case
  notes?: string;
  events: CaseEvent[]; // Timeline of what happened
  evidence?: Evidence[]; // Uploaded docs
  lastStrategyAnalysis?: string; // Cached AI advice
  lastModified: number;
};

export type FilingTypeId = 
  | 'TRO' 
  | 'MOTION_DISMISS_STRUCTURAL' 
  | 'MOTION_CLARIFICATION' 
  | 'MOTION_SANCTIONS_RULE11'
  | 'NOTICE_CONST_VIOLATIONS'
  | 'OPPOSITION_GENERIC'
  | 'CUSTOM_MOTION';

export type InputQuestion = {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'date';
  helperText?: string;
};

export type SectionId = 'caption' | 'title' | 'intro' | 'facts' | 'legal_standard' | 'argument' | 'relief' | 'signature';

export type SectionTemplate = {
  id: SectionId;
  title: string;
  promptTemplate: string; // The instruction sent to Gemini
  isStatic?: boolean; // If true, Gemini isn't called, just static text (rare for this app)
};

export type FilingType = {
  id: FilingTypeId;
  name: string;
  description: string;
  jurisdiction: 'FEDERAL' | 'STATE' | 'ANY';
  questions: InputQuestion[];
  sections: SectionTemplate[];
};

export type Draft = {
  id: string;
  caseId: string;
  filingTypeId: FilingTypeId;
  title: string;
  content: string; // HTML or Markdown
  createdAt: number;
  updatedAt: number;
};

export enum AIFeature {
  CHAT = 'Chat Assistant',
  LEGAL_RESEARCH = 'Legal Research',
  CASE_SUMMARIZER = 'Case Summarizer',
  CLAUSE_GENERATION = 'Clause Gen',
  IMAGE_GEN = 'Exhibit Gen',
  VOICE_ASSISTANT = 'Voice Assistant',
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ResearchResult {
  citation: string;
  summary: string;
}

export interface CaseSummary {
    facts: string;
    issue: string;
    holding: string;
    reasoning: string;
}

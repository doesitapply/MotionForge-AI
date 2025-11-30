import { FilingType, FilingTypeId, Jurisdiction } from './types';

// --- Helper Prompts ---
const BASE_STYLE = `
You are a senior litigator drafting a legal motion.
Tone: Professional, authoritative, precise, and persuasive.
Format: Use Markdown. Use standard legal headings (I., II., III.).
Do not use conversational filler ("Here is the section you asked for"). Just output the legal text.
`;

// --- Templates ---

const TRO_TEMPLATE: FilingType = {
  id: 'TRO',
  name: 'Motion for TRO / Preliminary Injunction',
  description: 'Emergency relief to preserve status quo and prevent irreparable harm.',
  jurisdiction: 'ANY',
  questions: [
    { id: 'harm', label: 'What is the immediate, irreparable harm?', placeholder: 'e.g., The city is bulldozing the property tomorrow at 8 AM.', type: 'textarea' },
    { id: 'relief', label: 'What specific order do you want?', placeholder: 'e.g., Enjoin Defendants from entering the premises.', type: 'textarea' },
    { id: 'notice', label: 'Was notice given to the other side?', placeholder: 'Yes/No and how.', type: 'text' },
  ],
  sections: [
    {
      id: 'intro',
      title: 'INTRODUCTION',
      promptTemplate: `${BASE_STYLE}
      Draft the Introduction for a Motion for TRO/PI.
      Context: {globalFacts}
      Immediate Harm: {harm}
      Relief Sought: {relief}
      Jurisdiction: {jurisdiction}
      
      Summarize why the court must act immediately. Keep it under 2 pages.`
    },
    {
      id: 'facts',
      title: 'STATEMENT OF FACTS',
      promptTemplate: `${BASE_STYLE}
      Draft the Statement of Facts.
      Chronological narrative of: {globalFacts}
      Focus on the events leading to the immediate emergency.`
    },
    {
      id: 'legal_standard',
      title: 'LEGAL STANDARD',
      promptTemplate: `${BASE_STYLE}
      Provide the Legal Standard for a TRO and Preliminary Injunction in {jurisdiction}.
      Cite relevant Winter v. NRDC or state equivalent factors:
      1. Likelihood of success
      2. Irreparable harm
      3. Balance of equities
      4. Public interest`
    },
    {
      id: 'argument',
      title: 'ARGUMENT',
      promptTemplate: `${BASE_STYLE}
      Draft the Argument section.
      Argue that the plaintiff meets all 4 factors for a TRO.
      Apply the facts: {globalFacts}
      To the harm: {harm}
      Argue why monetary damages are insufficient.`
    },
  ]
};

const SANCTIONS_TEMPLATE: FilingType = {
  id: 'MOTION_SANCTIONS_RULE11',
  name: 'Motion for Sanctions (Rule 11)',
  description: 'Seek penalties for frivolous filings or lack of evidentiary support.',
  jurisdiction: 'FEDERAL',
  questions: [
    { id: 'conduct', label: 'What specific conduct is sanctionable?', placeholder: 'e.g., Filing a complaint without any basis in fact.', type: 'textarea' },
    { id: 'safe_harbor', label: 'Date safe harbor letter was served?', placeholder: 'e.g., January 1, 2024', type: 'text' },
  ],
  sections: [
    {
      id: 'intro',
      title: 'INTRODUCTION',
      promptTemplate: `${BASE_STYLE}
      Draft Introduction for a Rule 11 Sanctions Motion.
      Conduct: {conduct}
      Assert that the filing is frivolous/legally baseless.`
    },
    {
      id: 'facts',
      title: 'PROCEDURAL HISTORY',
      promptTemplate: `${BASE_STYLE}
      Draft relevant history focusing on the bad faith conduct: {conduct}
      Mention the Safe Harbor service date: {safe_harbor}.`
    },
    {
      id: 'argument',
      title: 'ARGUMENT',
      promptTemplate: `${BASE_STYLE}
      Argue why Rule 11 is violated.
      1. Objective unreasonableness.
      2. Failure to investigate.
      3. Improper purpose (harassment/delay).
      Cite standard 9th Circuit/D. Nev Sanctions law.`
    },
  ]
};

const DISMISS_STRUCTURAL: FilingType = {
  id: 'MOTION_DISMISS_STRUCTURAL',
  name: 'Motion to Dismiss (Structural/Const.)',
  description: 'Dismissal based on deep structural or constitutional violations (Due Process, Separation of Powers).',
  jurisdiction: 'ANY',
  questions: [
    { id: 'violation', label: 'Primary Constitutional Violation', placeholder: 'e.g., Violation of Separation of Powers via Executive Order...', type: 'textarea' },
    { id: 'prejudice', label: 'How does this prejudice the client?', placeholder: 'e.g., Denied a fair tribunal...', type: 'textarea' },
  ],
  sections: [
    {
      id: 'intro',
      title: 'INTRODUCTION',
      promptTemplate: `${BASE_STYLE}
      Draft a powerful Introduction for a Motion to Dismiss based on structural constitutional errors.
      Violation: {violation}
      Tone: High-level constitutional analysis, grave concern for the rule of law.`
    },
    {
      id: 'argument',
      title: 'LEGAL ARGUMENT',
      promptTemplate: `${BASE_STYLE}
      Draft the Argument.
      Focus on {violation}.
      Cite foundational cases (Marbury, Mathews v. Eldridge, etc. as appropriate for the jurisdiction {jurisdiction}).
      Argue that the defect is structural and requires dismissal, not just correction.`
    },
  ]
};

const OPPOSITION_GENERIC: FilingType = {
  id: 'OPPOSITION_GENERIC',
  name: 'Opposition to Motion',
  description: 'General opposition to any motion filed by the other side.',
  jurisdiction: 'ANY',
  questions: [
    { id: 'opposing_motion', label: 'What motion are you opposing?', placeholder: 'e.g., Defendant\'s Motion to Dismiss (ECF No. 10)', type: 'text' },
    { id: 'core_argument', label: 'Why should it be denied?', placeholder: 'e.g., The complaint adequately alleges facts...', type: 'textarea' },
  ],
  sections: [
    {
      id: 'intro',
      title: 'INTRODUCTION',
      promptTemplate: `${BASE_STYLE}
      Draft the Introduction for an Opposition to {opposing_motion}.
      Summarize why the motion is meritless based on: {core_argument}.`
    },
    {
      id: 'legal_standard',
      title: 'LEGAL STANDARD',
      promptTemplate: `${BASE_STYLE}
      Provide the Legal Standard for opposing {opposing_motion} in {jurisdiction}.
      Focus on the burden of proof which lies with the movant.`
    },
    {
      id: 'argument',
      title: 'ARGUMENT',
      promptTemplate: `${BASE_STYLE}
      Draft the Argument section.
      Refute the points in {opposing_motion}.
      Key argument: {core_argument}.
      Use the case facts: {globalFacts}.`
    }
  ]
};

const CUSTOM_MOTION: FilingType = {
  id: 'CUSTOM_MOTION',
  name: 'Custom / Generic Motion',
  description: 'Draft any type of motion by defining the goal.',
  jurisdiction: 'ANY',
  questions: [
    { id: 'motion_title', label: 'Title of Motion', placeholder: 'e.g., Motion for Leave to Amend', type: 'text' },
    { id: 'goal', label: 'What is the goal of this motion?', placeholder: 'e.g., To add a new defendant based on discovery.', type: 'textarea' },
    { id: 'legal_basis', label: 'Legal Basis (Optional)', placeholder: 'e.g., Rule 15(a)', type: 'text' },
  ],
  sections: [
    {
      id: 'intro',
      title: 'INTRODUCTION',
      promptTemplate: `${BASE_STYLE}
      Draft the Introduction for a {motion_title}.
      Goal: {goal}.
      Jurisdiction: {jurisdiction}.`
    },
    {
      id: 'facts',
      title: 'RELEVANT FACTS',
      promptTemplate: `${BASE_STYLE}
      Draft relevant facts supporting {motion_title}.
      Context: {globalFacts}.
      Focus on why {goal} is necessary now.`
    },
    {
      id: 'argument',
      title: 'ARGUMENT',
      promptTemplate: `${BASE_STYLE}
      Draft the legal argument for {motion_title}.
      Basis: {legal_basis}.
      Why the court should grant {goal}.`
    }
  ]
};

export const FILING_TYPES: Record<string, FilingType> = {
  [TRO_TEMPLATE.id]: TRO_TEMPLATE,
  [SANCTIONS_TEMPLATE.id]: SANCTIONS_TEMPLATE,
  [DISMISS_STRUCTURAL.id]: DISMISS_STRUCTURAL,
  [OPPOSITION_GENERIC.id]: OPPOSITION_GENERIC,
  [CUSTOM_MOTION.id]: CUSTOM_MOTION,
};

export const getFilingTypes = (): FilingType[] => Object.values(FILING_TYPES);
import { CaseProfile, Draft } from '../types';

const CASES_KEY = 'motionforge_cases';
const DRAFTS_KEY = 'motionforge_drafts';

export const saveCase = (newCase: CaseProfile): void => {
  const cases = getCases();
  const index = cases.findIndex(c => c.id === newCase.id);
  if (index >= 0) {
    cases[index] = newCase;
  } else {
    cases.push(newCase);
  }
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
};

export const getCases = (): CaseProfile[] => {
  const data = localStorage.getItem(CASES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getCase = (id: string): CaseProfile | undefined => {
  return getCases().find(c => c.id === id);
};

export const deleteCase = (id: string): void => {
  const cases = getCases().filter(c => c.id !== id);
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
};

export const saveDraft = (draft: Draft): void => {
  const drafts = getDrafts();
  const index = drafts.findIndex(d => d.id === draft.id);
  if (index >= 0) {
    drafts[index] = draft;
  } else {
    drafts.push(draft);
  }
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

export const getDrafts = (): Draft[] => {
  const data = localStorage.getItem(DRAFTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getDraftsForCase = (caseId: string): Draft[] => {
  return getDrafts().filter(d => d.caseId === caseId).sort((a, b) => b.updatedAt - a.updatedAt);
};

export const deleteDraft = (id: string): void => {
  const drafts = getDrafts().filter(d => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

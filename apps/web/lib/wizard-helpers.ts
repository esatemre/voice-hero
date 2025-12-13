/**
 * Wizard Integration Helpers
 * Manages first-visit detection, state persistence, and onboarding tracking
 */

export const WIZARD_STORAGE_KEYS = {
  WIZARD_STATE: 'wizard-state',
  FIRST_TIME_USER: 'first-time-user',
  WIZARD_COMPLETED: 'wizard-completed',
  ONBOARDING_CHECKLIST: 'onboarding-checklist',
} as const;

/**
 * Check if this is the user's first visit to the dashboard
 * Returns true if they've never created a project before
 */
export function isFirstTimeUser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hasSeenBefore = localStorage.getItem(WIZARD_STORAGE_KEYS.FIRST_TIME_USER);
  return !hasSeenBefore;
}

/**
 * Mark user as no longer first-time
 * Should be called when user completes first project
 */
export function markUserAsOnboarded(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WIZARD_STORAGE_KEYS.FIRST_TIME_USER, 'true');
}

/**
 * Check if user has started but not completed the wizard
 * Useful for resume functionality
 */
export function hasIncompleteWizardState(): boolean {
  if (typeof window === 'undefined') return false;
  
  const state = localStorage.getItem(WIZARD_STORAGE_KEYS.WIZARD_STATE);
  if (!state) return false;
  
  try {
    const parsed = JSON.parse(state);
    // If step is less than 6, they haven't completed
    return parsed.step && parsed.step < 6;
  } catch {
    return false;
  }
}

/**
 * Get incomplete wizard state for resuming
 */
export function getIncompleteWizardState() {
  if (typeof window === 'undefined') return null;
  
  const state = localStorage.getItem(WIZARD_STORAGE_KEYS.WIZARD_STATE);
  if (!state) return null;
  
  try {
    return JSON.parse(state);
  } catch {
    return null;
  }
}

/**
 * Clear wizard state (called after successful project creation)
 */
export function clearWizardState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WIZARD_STORAGE_KEYS.WIZARD_STATE);
}

/**
 * Reset wizard (user explicitly chooses to start over)
 */
export function resetWizard(): void {
  if (typeof window === 'undefined') return;
  clearWizardState();
  localStorage.removeItem(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST);
}

/**
 * Initialize onboarding checklist items
 * These track which steps of the wizard have been completed
 */
export interface OnboardingChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  projectId?: string;
}

const DEFAULT_ONBOARDING_ITEMS: OnboardingChecklistItem[] = [
  { id: 'project-created', title: 'Create your first project', completed: false },
  { id: 'script-generated', title: 'Generate or write scripts', completed: false },
  { id: 'voice-selected', title: 'Select a voice', completed: false },
  { id: 'widget-installed', title: 'Install widget on your site', completed: false },
  { id: 'view-analytics', title: 'View your first analytics', completed: false },
];

/**
 * Get current onboarding checklist
 */
export function getOnboardingChecklist(): OnboardingChecklistItem[] {
  if (typeof window === 'undefined') return DEFAULT_ONBOARDING_ITEMS;
  
  const stored = localStorage.getItem(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST);
  if (!stored) return DEFAULT_ONBOARDING_ITEMS;
  
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ONBOARDING_ITEMS;
  }
}

/**
 * Mark an onboarding item as complete
 */
export function completeOnboardingItem(itemId: string, projectId?: string): void {
  if (typeof window === 'undefined') return;
  
  const checklist = getOnboardingChecklist();
  const updated = checklist.map(item =>
    item.id === itemId
      ? { ...item, completed: true, projectId }
      : item
  );
  
  localStorage.setItem(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST, JSON.stringify(updated));
}

/**
 * Check if all onboarding items are complete
 */
export function isOnboardingComplete(): boolean {
  const checklist = getOnboardingChecklist();
  return checklist.every(item => item.completed);
}

/**
 * Get onboarding progress percentage
 */
export function getOnboardingProgress(): number {
  const checklist = getOnboardingChecklist();
  if (checklist.length === 0) return 0;
  
  const completed = checklist.filter(item => item.completed).length;
  return Math.round((completed / checklist.length) * 100);
}

/**
 * Determine if wizard should be shown
 * Rules:
 * 1. Feature flag must be enabled
 * 2. User must be first-time or have incomplete state
 */
export function shouldShowWizard(featureFlagEnabled: boolean): boolean {
  if (!featureFlagEnabled) return false;
  
  const isFirstTime = isFirstTimeUser();
  const hasIncomplete = hasIncompleteWizardState();
  
  return isFirstTime || hasIncomplete;
}

/**
 * Get wizard entry point
 * Returns 'new' for new users, 'resume' for users resuming
 */
export function getWizardEntryPoint(): 'new' | 'resume' {
  if (hasIncompleteWizardState()) return 'resume';
  if (isFirstTimeUser()) return 'new';
  return 'new';
}

/**
 * Validate wizard state integrity
 * Ensures all required fields are present
 */
export function isValidWizardState(state: any): boolean {
  if (!state) return false;
  
  const required = [
    'step',
    'projectName',
    'websiteUrl',
    'description',
    'tone',
    'language',
    'targetNewVisitors',
    'targetReturningVisitors',
    'targetUtmCampaigns',
    'targetLanguages',
    'initialScripts',
    'selectedVoiceId',
    'widgetInstalled',
  ];
  
  return required.every(field => field in state);
}

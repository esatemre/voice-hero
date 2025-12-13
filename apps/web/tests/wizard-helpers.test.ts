import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isFirstTimeUser,
  markUserAsOnboarded,
  hasIncompleteWizardState,
  getIncompleteWizardState,
  clearWizardState,
  resetWizard,
  getOnboardingChecklist,
  completeOnboardingItem,
  isOnboardingComplete,
  getOnboardingProgress,
  shouldShowWizard,
  getWizardEntryPoint,
  isValidWizardState,
  WIZARD_STORAGE_KEYS,
} from '@/lib/wizard-helpers';

describe('Wizard Helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('First Time User Detection', () => {
    it('returns true when user has never visited before', () => {
      expect(isFirstTimeUser()).toBe(true);
    });

    it('returns false after marking user as onboarded', () => {
      expect(isFirstTimeUser()).toBe(true);
      markUserAsOnboarded();
      expect(isFirstTimeUser()).toBe(false);
    });

    it('persists onboarded status in localStorage', () => {
      markUserAsOnboarded();
      expect(localStorage.getItem(WIZARD_STORAGE_KEYS.FIRST_TIME_USER)).toBe('true');
    });
  });

  describe('Wizard State Management', () => {
    it('returns false when no wizard state exists', () => {
      expect(hasIncompleteWizardState()).toBe(false);
    });

    it('returns true when wizard state exists at step < 6', () => {
      const state = { step: 3, projectName: 'Test' };
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, JSON.stringify(state));
      expect(hasIncompleteWizardState()).toBe(true);
    });

    it('returns false when wizard is at final step', () => {
      const state = { step: 6, projectName: 'Test' };
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, JSON.stringify(state));
      expect(hasIncompleteWizardState()).toBe(false);
    });

    it('retrieves incomplete wizard state', () => {
      const state = { step: 2, projectName: 'My Project' };
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, JSON.stringify(state));
      
      const retrieved = getIncompleteWizardState();
      expect(retrieved).toEqual(state);
    });

    it('returns null when retrieving non-existent state', () => {
      expect(getIncompleteWizardState()).toBeNull();
    });

    it('clears wizard state', () => {
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, '{}');
      clearWizardState();
      expect(localStorage.getItem(WIZARD_STORAGE_KEYS.WIZARD_STATE)).toBeNull();
    });

    it('resets wizard completely', () => {
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, '{}');
      localStorage.setItem(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST, '[]');
      
      resetWizard();
      
      expect(localStorage.getItem(WIZARD_STORAGE_KEYS.WIZARD_STATE)).toBeNull();
      expect(localStorage.getItem(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST)).toBeNull();
    });
  });

  describe('Onboarding Checklist', () => {
    it('returns default checklist when none exists', () => {
      const checklist = getOnboardingChecklist();
      expect(checklist.length).toBe(5);
      expect(checklist[0].id).toBe('project-created');
      expect(checklist.every(item => !item.completed)).toBe(true);
    });

    it('marks item as complete', () => {
      completeOnboardingItem('project-created', 'project-123');
      
      const checklist = getOnboardingChecklist();
      const item = checklist.find(i => i.id === 'project-created');
      
      expect(item?.completed).toBe(true);
      expect(item?.projectId).toBe('project-123');
    });

    it('handles multiple items marked complete', () => {
      completeOnboardingItem('project-created');
      completeOnboardingItem('voice-selected');
      
      const checklist = getOnboardingChecklist();
      const completed = checklist.filter(i => i.completed);
      
      expect(completed.length).toBe(2);
    });

    it('returns false when onboarding not complete', () => {
      expect(isOnboardingComplete()).toBe(false);
    });

    it('returns true when all items are complete', () => {
      const checklist = getOnboardingChecklist();
      checklist.forEach(item => {
        completeOnboardingItem(item.id);
      });
      
      expect(isOnboardingComplete()).toBe(true);
    });

    it('calculates correct progress percentage', () => {
      expect(getOnboardingProgress()).toBe(0);
      
      completeOnboardingItem('project-created');
      expect(getOnboardingProgress()).toBe(20); // 1 of 5
      
      completeOnboardingItem('voice-selected');
      expect(getOnboardingProgress()).toBe(40); // 2 of 5
      
      const checklist = getOnboardingChecklist();
      checklist.forEach(item => completeOnboardingItem(item.id));
      expect(getOnboardingProgress()).toBe(100); // 5 of 5
    });

    it('handles corrupted checklist gracefully', () => {
      localStorage.setItem(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST, 'invalid json');
      
      const checklist = getOnboardingChecklist();
      expect(checklist.length).toBe(5);
    });
  });

  describe('Wizard Visibility Logic', () => {
    it('returns false when feature flag is disabled', () => {
      expect(shouldShowWizard(false)).toBe(false);
    });

    it('returns true for first-time user with feature flag enabled', () => {
      expect(shouldShowWizard(true)).toBe(true);
    });

    it('returns true when user has incomplete wizard state and flag enabled', () => {
      const state = { step: 3, projectName: 'Test' };
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, JSON.stringify(state));
      markUserAsOnboarded();
      
      expect(shouldShowWizard(true)).toBe(true);
    });

    it('returns false when user completed onboarding and flag enabled', () => {
      markUserAsOnboarded();
      clearWizardState();
      
      expect(shouldShowWizard(true)).toBe(false);
    });
  });

  describe('Wizard Entry Point', () => {
    it('returns "new" for first-time users', () => {
      expect(getWizardEntryPoint()).toBe('new');
    });

    it('returns "resume" when user has incomplete wizard', () => {
      const state = { step: 2, projectName: 'Test' };
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, JSON.stringify(state));
      
      expect(getWizardEntryPoint()).toBe('resume');
    });

    it('returns "new" for completed onboarding users', () => {
      markUserAsOnboarded();
      expect(getWizardEntryPoint()).toBe('new');
    });
  });

  describe('Wizard State Validation', () => {
    it('returns false for null state', () => {
      expect(isValidWizardState(null)).toBe(false);
    });

    it('returns false for undefined state', () => {
      expect(isValidWizardState(undefined)).toBe(false);
    });

    it('returns false when required fields are missing', () => {
      const state = {
        step: 1,
        projectName: 'Test',
        // missing other required fields
      };
      
      expect(isValidWizardState(state)).toBe(false);
    });

    it('returns true when all required fields present', () => {
      const state = {
        step: 1,
        projectName: 'Test',
        websiteUrl: 'https://example.com',
        description: 'A test project',
        tone: 'professional',
        language: 'en-US',
        targetNewVisitors: true,
        targetReturningVisitors: true,
        targetUtmCampaigns: false,
        targetLanguages: false,
        initialScripts: {
          welcome: 'Welcome',
          returning: 'Welcome back',
          cta: 'Click here',
        },
        selectedVoiceId: null,
        widgetInstalled: false,
      };
      
      expect(isValidWizardState(state)).toBe(true);
    });
  });

  describe('Storage Key Constants', () => {
    it('exports all required storage keys', () => {
      expect(WIZARD_STORAGE_KEYS.WIZARD_STATE).toBe('wizard-state');
      expect(WIZARD_STORAGE_KEYS.FIRST_TIME_USER).toBe('first-time-user');
      expect(WIZARD_STORAGE_KEYS.WIZARD_COMPLETED).toBe('wizard-completed');
      expect(WIZARD_STORAGE_KEYS.ONBOARDING_CHECKLIST).toBe('onboarding-checklist');
    });
  });

  describe('Edge Cases', () => {
    it('handles localStorage not available gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(() => {
        isFirstTimeUser();
        markUserAsOnboarded();
        hasIncompleteWizardState();
        getIncompleteWizardState();
        clearWizardState();
        resetWizard();
        getOnboardingChecklist();
        completeOnboardingItem('test');
      }).not.toThrow();
      
      global.window = originalWindow;
    });

    it('handles corrupted wizard state JSON gracefully', () => {
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, 'corrupted json {]');
      
      expect(() => {
        hasIncompleteWizardState();
        getIncompleteWizardState();
      }).not.toThrow();
      
      expect(hasIncompleteWizardState()).toBe(false);
      expect(getIncompleteWizardState()).toBeNull();
    });

    it('preserves other localStorage keys when resetting wizard', () => {
      localStorage.setItem('other-key', 'other-value');
      localStorage.setItem(WIZARD_STORAGE_KEYS.WIZARD_STATE, '{}');
      
      resetWizard();
      
      expect(localStorage.getItem('other-key')).toBe('other-value');
      expect(localStorage.getItem(WIZARD_STORAGE_KEYS.WIZARD_STATE)).toBeNull();
    });
  });
});

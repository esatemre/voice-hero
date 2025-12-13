export interface ProjectStatus {
  segmentsTotal: number;
  segmentsWithAudio: number;
  lastVoiceGeneratedAt: number | null;
  pagesTotal: number;
  pagesVoiceEnabled: number;
  lastScrapeAt: number | null;
}

export type Tone = "professional" | "casual" | "playful" | "energetic";

export interface ScriptOptions {
  language?: string;
  tone?: Tone;
  lengthSeconds?: number;
  wordCount?: number;
  ctaFocus?: string;
}

export interface ScriptCritique {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  revisedScript: string;
}

export interface Project {
  id: string;
  ownerId: string; // For now, just a placeholder or auth ID
  name: string;
  baseUrl: string;
  description: string;
  tone: Tone;
  language: string; // e.g., 'en-US'
  aiSummary?: string;
  aiDetails?: string;
  email?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: number | null;
  emailOptOut?: boolean;
  emailUnsubscribeToken?: string;
  onboarding?: {
    welcomeEmailSentAt?: number;
    pageDiscoveryEmailSentAt?: number;
    voiceReadyEmailSentAt?: number;
    widgetInstallEmailSentAt?: number;
    goLiveEmailSentAt?: number;
  };
  scriptDefaults?: ScriptOptions;
  status: ProjectStatus;
  createdAt: number;
}

export interface Segment {
  id: string;
  projectId: string;
  type: "new_visitor" | "returning_visitor" | "utm_source" | "geo" | "language";
  conditionValue?: string; // e.g., 'meta_ads' for utm_source, or 'es' for language
  scriptContent: string;
  audioUrl?: string;
  voiceId?: string; // ElevenLabs voice ID
  createdAt: number;
  lastContentSnapshotId?: string; // ID of snapshot used when script was generated
  lastContentHash?: string; // Content hash at time of script generation
}

export type PageStatus = "discovered" | "scraped" | "error";

export interface Page {
  id: string;
  projectId: string;
  url: string;
  path: string;
  title: string;
  status: PageStatus;
  lastScrapedAt: number | null;
  voiceEnabled: boolean;
  lastContentHash: string | null;
}

export interface VoiceProfile {
  id: string;
  name: string;
  previewUrl?: string;
  labels?: Record<string, string>;
  description?: string;
}

export interface PlaybackResponse {
  audioUrl: string;
  transcript: string;
  label: string;
}

export interface ContentSnapshotRaw {
  title: string;
  headline: string;
  description: string;
  bullets: string[];
  ctaText: string[];
}

export interface ContentSnapshotProcessed {
  description: string;
  summary: string;
  details: string;
}

export interface ContentSnapshot {
  id: string;
  pageId: string;
  createdAt: number;
  raw: ContentSnapshotRaw;
  processed: ContentSnapshotProcessed;
  contentHash: string;
}

export type SegmentType =
  | "new_visitor"
  | "returning_visitor"
  | "utm_source"
  | "geo"
  | "language";

export interface PageSegment {
  id: string;
  pageId: string;
  type: SegmentType;
  conditionValue?: string;
  scriptContent: string;
  audioUrl?: string;
  voiceId?: string;
  version: number;
  createdAt: number;
  lastContentSnapshotId?: string;
  lastContentHash?: string;
}

export interface ScriptVersion {
  id: string;
  segmentId: string;
  scriptContent: string;
  voiceId?: string;
  createdAt: number;
  source: string;
  contentSnapshotId?: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface WizardState {
  step: WizardStep;
  projectName: string;
  websiteUrl: string;
  description: string;
  email: string;
  tone: Tone;
  language: string;
  targetNewVisitors: boolean;
  targetReturningVisitors: boolean;
  targetUtmCampaigns: boolean;
  targetLanguages: boolean;
  initialScripts: {
    welcome: string;
    returning: string;
    cta: string;
  };
  selectedVoiceId: string | null;
  widgetInstalled: boolean;
}

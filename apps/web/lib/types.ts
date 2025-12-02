export interface Project {
  id: string;
  ownerId: string; // For now, just a placeholder or auth ID
  name: string;
  baseUrl: string;
  description: string;
  tone: 'professional' | 'casual' | 'playful' | 'energetic';
  language: string; // e.g., 'en-US'
  aiSummary?: string;
  aiDetails?: string;
  createdAt: number;
}

export interface Segment {
  id: string;
  projectId: string;
  type: 'new_visitor' | 'returning_visitor' | 'utm_source' | 'geo' | 'language';
  conditionValue?: string; // e.g., 'meta_ads' for utm_source, or 'es' for language
  scriptContent: string;
  audioUrl?: string;
  voiceId?: string; // ElevenLabs voice ID
  createdAt: number;
}

export interface PlaybackResponse {
  audioUrl: string;
  transcript: string;
  label: string;
}

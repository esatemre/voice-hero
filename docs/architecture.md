# VoiceHero System Architecture

## System Overview

VoiceHero is an AI-powered voice engagement platform that adds dynamic voice scripts to websites. The system orchestrates page discovery, script generation, voice synthesis, widget delivery, and analytics collection.

```
┌─────────────────────────────────────────────────────────────────┐
│                      VoiceHero Dashboard                          │
│  (Script Management, Segment Setup, Voice Selection, Analytics)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐    ┌─────────┐
   │ Page    │      │ Script  │    │ Voice   │
   │ Service │      │ Service │    │ Service │
   └────┬────┘      └────┬────┘    └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌──────────┐  ┌──────────┐    ┌──────────┐
   │ Firestore│  │ Gemini   │    │ ElevenLabs
   │ Database │  │ API      │    │ Voice API │
   └──────────┘  └──────────┘    └──────────┘
        │
        └─────────────────────────────────┐
                                          │
        ┌─────────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────────┐
   │  Widget (Embedded on Client Site)│
   │  ┌────────────────────────────────┤
   │  │ • Page context detection      │
   │  │ • Playback logic & selection  │
   │  │ • Audio player                │
   │  │ • Event tracking              │
   │  └────────────────────────────────┤
   └──────────────────────────────────┘
        │
        ▼
   ┌──────────────────┐
   │ Analytics Events │
   │ (Recorded back   │
   │  to Firestore)   │
   └──────────────────┘
```

## Core Subsystems

### 1. Page Discovery & Management

**Purpose:** Scan and track pages on user websites for targeting scripts.

**Components:**
- **Page Detection:** Widget collects page URL and title from each visitor session
- **Page Index:** API aggregates unique pages into a project-scoped index
- **Page Metadata:** Stores URL, title, snapshot of page content, and voice enable/disable toggle

**Data Flow:**
1. Widget sends page URL and content snapshot to `/api/page-discovery`
2. API stores unique pages in `projects/{projectId}/pages/{pageId}`
3. Dashboard queries page list for user to select and configure

**Related Files:**
- `apps/web/app/api/page-discovery/route.ts`
- `apps/web/app/api/projects/[projectId]/pages/route.ts`
- `apps/web/components/project-view.tsx` (page discovery UI)

### 2. Script Management & Generation

**Purpose:** Create and manage voice scripts for different audience segments and pages.

**Components:**
- **Script Generation:** AI (Gemini) generates scripts from page content
- **Script Wizard:** Guided UI for users to control language, tone, and length
- **Script Critique:** AI evaluates scripts and suggests improvements
- **Multi-Level Scripts:** Support for project-level defaults and page-specific overrides

**Data Model:**
- **Project Segments:** Global segment definitions (e.g., "new visitor", "returning", "campaign XYZ")
- **Page Segments:** Page-specific script assignments per segment
- **Script Versions:** Track edits and allow rollback

**Data Flow:**
1. User triggers script generation for a segment
2. API calls Gemini with page content + segment context
3. Generated script stored in `projects/{projectId}/pages/{pageId}/segments/{segmentId}`
4. Widget fetches scripts by page + segment context

**Related Files:**
- `apps/web/app/api/generate-script/route.ts`
- `apps/web/app/api/script-critique/route.ts`
- `apps/web/lib/gemini.ts` (AI prompt orchestration)
- `apps/web/components/script-generation-wizard.tsx`

### 3. Voice & Audio Generation

**Purpose:** Convert text scripts into realistic voice audio.

**Components:**
- **Voice Profiles:** 500+ realistic voices from ElevenLabs
- **Voice Preview:** Users preview voices before selecting
- **Per-Segment Voice Selection:** Different segments can use different voices
- **Audio Caching:** Generated audio is cached in cloud storage

**Data Model:**
- **Voice Selection:** Stored per project-segment or page-segment
- **Audio URL:** Reference to cloud-hosted MP3 file
- **Voice Metadata:** Voice ID, language, gender, accent, name

**Data Flow:**
1. User selects voice from Voice Profiles UI
2. System stores voice ID in segment/page-segment config
3. When script is updated, trigger ElevenLabs API to generate audio
4. Store audio URL in Firestore alongside script content
5. Widget downloads and plays audio based on context

**Related Files:**
- `apps/web/app/api/voice/preview/route.ts`
- `apps/web/app/api/voice/generate/route.ts`
- `apps/web/lib/elevenlabs.ts` (ElevenLabs integration)
- `apps/web/components/voice-profiles-preview.tsx`

### 4. Widget & Playback

**Purpose:** Deliver voice experiences to end-user website visitors.

**Components:**
- **Widget Script:** Small JavaScript bundle that runs on customer websites
- **Context Detection:** Identifies visitor context (page, returning visitor, UTM params, language)
- **Segment Selection:** Maps visitor context to appropriate script + voice
- **Playback Engine:** Audio player with UI controls
- **Event Tracking:** Sends playback events back to analytics

**Widget Data Flow:**
```
1. Visitor loads page with VoiceHero widget
2. Widget detects: pageUrl, userContext (returning, lang, utm params)
3. Widget calls /api/playback with context
4. /api/playback selects script + audio based on segment matching
5. Widget receives script, audio URL, segment metadata
6. Widget displays audio player + renders script (if configured)
7. Visitor plays audio, widget tracks event (play, complete, etc.)
8. Event sent to /api/analytics/track with context
9. Analytics stored in Firestore for dashboard reporting
```

**Related Files:**
- `apps/web/public/widget.js` (widget source)
- `apps/web/app/api/playback/route.ts` (script selection logic)
- `apps/web/app/api/analytics/track/route.ts`

### 5. Analytics & Reporting

**Purpose:** Track voice engagement and provide insights to teams.

**Metrics:**
- **Plays:** Number of times audio was initiated
- **Completions:** Number of times audio played fully
- **Engagement Rate:** Completions / Plays
- **Per-Page Breakdown:** Metrics grouped by URL
- **Segment Performance:** Which segments drive highest engagement

**Data Model:**
- **Events:** Each play/completion is logged with context (pageUrl, segment, voice, visitor session)
- **Aggregations:** API computes time-series and grouping queries

**Data Flow:**
1. Widget tracks `play`, `complete` events with full context
2. Events sent to `/api/analytics/track`
3. Events stored in `projects/{projectId}/analytics/events`
4. Dashboard queries `/api/analytics/stats` to fetch aggregated metrics
5. UI renders charts, tables, and per-page breakdowns

**Related Files:**
- `apps/web/app/api/analytics/track/route.ts`
- `apps/web/app/api/analytics/stats/route.ts`
- `apps/web/components/analytics-view.tsx`

## Data Storage (Firestore)

### Document Structure

```
firestore/
├── projects/{projectId}/
│   ├── (document) name, url, createdAt, voiceId, segmentDefaults
│   ├── pages/{pageId}/
│   │   ├── (document) url, title, lastSeen, voiceEnabled
│   │   └── segments/{segmentId}/
│   │       └── (document) scriptContent, audioUrl, voiceId, version, createdAt
│   ├── segments/{segmentId}/
│   │   └── (document) name, type, criteria, scriptContent, audioUrl, voiceId
│   ├── analytics/
│   │   └── events/{eventId}
│   │       └── (document) type, pageUrl, segmentId, timestamp, userId
│   └── settings/
│       └── (document) scriptDefaults, preferences
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/playback` | POST | Select script + voice for visitor context |
| `/api/generate-script` | POST | Generate script via Gemini |
| `/api/script-critique` | POST | Evaluate and suggest script improvements |
| `/api/page-discovery` | POST | Register discovered page |
| `/api/projects/[projectId]/pages` | GET/POST | Manage pages |
| `/api/projects/[projectId]/segments` | GET/POST/PUT | Manage segments |
| `/api/voice/preview` | POST | Generate voice preview |
| `/api/voice/generate` | POST | Generate audio for script |
| `/api/analytics/track` | POST | Record playback event |
| `/api/analytics/stats` | GET | Fetch aggregated metrics |

## Key Design Patterns

### 1. Context-Based Routing
Scripts are selected based on visitor context (page, returning status, language, UTM source). This enables targeted messaging without exposing selection logic to the dashboard.

### 2. Fallback Chain
If a page-specific segment script doesn't exist, the system falls back to project-level segment scripts. This ensures graceful degradation and backward compatibility.

### 3. Event-Driven Updates
Page discovery, script generation, and voice synthesis are event-triggered. The widget reports what it discovers, and the backend ingests and surfaces new data.

### 4. Single Source of Truth
Each artifact (script, audio, voice ID) is stored once in Firestore. UI and widget both read from the same database, eliminating sync issues.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, TypeScript
- **Database:** Firestore (NoSQL)
- **AI:** Google Gemini API (script generation + critique)
- **Voice:** ElevenLabs API (voice synthesis)
- **Deployment:** Docker (GHCR) + Coolify (hosting), Firebase (database)
- **Analytics:** Custom events → Firestore

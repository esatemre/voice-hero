# Voice Hero Roadmap

Voice Hero is built to evolve from a smart monologue into a fully conversational sales agent. This roadmap outlines our path from the current MVP to a production-grade, self-optimizing platform.

## Why We Believe In This
Early founder feedback has been strong: teams want a faster way to sharpen how they explain their product and to make their brand feel more professional as new startups flood the market. We are continuing with humility and curiosity as we learn and iterate.

## Phase 1: The Foundation (Current MVP)
**Goal:** Prove that segment-aware voice intros increase engagement.
- [x] **Google Cloud Integration**: Vertex AI (Gemini) for script generation.
- [x] **ElevenLabs Integration**: High-quality TTS voice synthesis.
- [x] **Segment Detection**: New vs. returning vs. UTM visitors.
- [x] **Widget**: Lightweight JS embed for playback.
- [x] **Dashboard**: Multi-project overview with status metrics.
- [x] **Page Discovery**: Link-based discovery, page management, and per-page voice toggles.
- [x] **Content Snapshots**: Capture page content and surface change alerts.
- [x] **Script Workflow**: Generation wizard, multi-segment scripts per page, and segment builder UI.
- [x] **Voice Management**: Voice profiles preview and per-segment voice selection.
- [x] **Quality Tools**: AI script critique plus script version timeline and restore.
- [x] **Analytics**: Per-page analytics and live feed.
- [x] **Visitor Simulator**: Test as a visitor with custom context.
- [x] **Setup Helpers**: Default segments on project creation and URL auto-fill scraping.
- [x] **Lifecycle Emails**: Welcome + trigger emails (feature-flagged; requires SMTP2GO and `email_onboarding_enabled`).
- [x] **Marketing**: Landing page redesign (feature-flagged).

## Phase 1.5: Activation & Onboarding (Rollout)
**Goal:** Help founders go from first login to live voice in one focused session.
- [ ] **Onboarding checklist UI**: Progress panel with auto-complete visibility (tracking exists; UI pending).

## Phase 2: The Conversational Upgrade (ElevenLabs Challenge)
**Goal:** Transform the widget from a player into an interactive agent.
- [ ] **Two-Way Conversation**:
    - Integrate **ElevenLabs Conversational AI** to allow visitors to reply to the pitch.
    - *Example*: After the pitch "We help you scale...", the user can ask "How much does it cost?" and get an immediate, voice-driven answer.
- [ ] **Knowledge Base Injection**:
    - RAG pipeline on Google Cloud to feed the ElevenLabs Agent with the site's FAQ and pricing data.
- [ ] **Voice Activity Detection (VAD)**:
    - Enable "Interruptibility" so users can stop the pitch by speaking.

## Phase 3: The Optimization Loop (Google Cloud Challenge)
**Goal:** Automate the "A/B testing" of voice pitches.
- [ ] **Feedback Loop**:
    - Track "Listen Rate" and "CTA Click Rate" per segment.
    - Feed this data back into Vertex AI.
- [ ] **Auto-Generation**:
    - Nightly jobs where Gemini analyzes performance data and proposes 3 new script variants for underperforming segments.
    - Automatically generate audio for the best candidates using ElevenLabs.
- [ ] **Multi-Armed Bandit**:
    - Implement a bandit algorithm to dynamically route traffic to the best-performing voice variants.

## Phase 3.5: Automatic Page Intelligence & Voice Adaptation
**Goal:** Make the system self-maintaining by auto-discovering pages and adapting to content changes.

- [ ] **Auto-Discovery (Sitemap)**: Ingest `sitemap.xml` for broader coverage.
- [ ] **Smart Scraping**: Use Gemini to infer page intent and structure.
- [ ] **Scheduled Change Detection**: Crawl on a schedule and track meaningful diffs.
- [ ] **Auto-Regeneration**: Suggest or trigger script refresh when content shifts.

## Phase 4: Enterprise Scale
**Goal:** Support high-traffic SaaS teams.
- [ ] **Edge Caching**: Serve audio files via Google Cloud CDN for <50ms latency globally.
- [ ] **Team Permissions**: RBAC for marketing teams.
- [ ] **CRM Integration**: Push "Voice Engagement" signals to HubSpot/Salesforce.
- [ ] **Custom Voice Clones**: Allow founders to clone their own voice for a personal touch.

---

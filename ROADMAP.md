# Voice Hero Roadmap

Voice Hero is built to evolve from a smart monologue into a fully conversational sales agent. This roadmap outlines our path from the current Hackathon MVP to a production-grade, self-optimizing platform.

## Phase 1: The Foundation (Current MVP)
**Goal:** Prove that segment-aware voice intros increase engagement.
- [x] **Google Cloud Integration**: Vertex AI (Gemini) for script generation.
- [x] **ElevenLabs Integration**: High-quality TTS for "Rachel" voice.
- [x] **Segment Detection**: Basic logic for New vs. Returning vs. UTM visitors.
- [x] **Widget**: Lightweight JS embed for playback.
- [x] **Dashboard**: Project and segment management.

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

### Quick Wins (Hackathon-Ready)
- [ ] **Auto-Initialize Default Segments**: When creating a project, automatically create 3 default segments (New, Returning, Ads) instead of empty state.
- [ ] **URL Scraper Preview**: Add a "Scrape URL" button that fetches page content and pre-fills the description field.
- [ ] **Multi-Page Support UI**: Show vision of managing multiple landing pages per project (even if backend only supports one for now).

### Full Epic (Production)
- [ ] **Auto-Discovery**: Crawl sitemap and detect key landing pages (`/`, `/pricing`, `/product/*`).
- [ ] **Smart Scraping**: Extract headline, subhead, bullets, CTAs using Gemini to understand page intent.
- [ ] **Content Snapshots**: Store versioned page content with timestamps.
- [ ] **Change Detection**: Scheduled scraper that detects significant content changes and triggers re-generation.
- [ ] **Version History**: Timeline showing page content versions vs. voice script versions for attribution.
- [ ] **Multi-Website Dashboard**: Workspace → Websites → Pages → Segments hierarchy.

## Phase 4: Enterprise Scale
**Goal:** Support high-traffic SaaS teams.
- [ ] **Edge Caching**: Serve audio files via Google Cloud CDN for <50ms latency globally.
- [ ] **Team Permissions**: RBAC for marketing teams.
- [ ] **CRM Integration**: Push "Voice Engagement" signals to HubSpot/Salesforce.
- [ ] **Custom Voice Clones**: Allow founders to clone their own voice for a personal touch.

---
*Built for the Google Cloud x ElevenLabs Hackathon 2025.*

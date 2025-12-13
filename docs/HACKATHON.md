# AI Partner Catalyst Hackathon 2025 - Submission Guide

## Challenge: ElevenLabs + Google Cloud AI

**Challenge Statement:**
Use ElevenLabs and Google Cloud AI to make your app conversational, intelligent, and voice-driven. Combine ElevenLabs Agents with Google Cloud Vertex AI or Gemini to give your app a natural, human voice and personality — enabling users to interact entirely through speech.

**VoiceHero Alignment:**
VoiceHero perfectly matches this challenge by:
1. ✅ Integrating **ElevenLabs** for realistic voice synthesis (500+ voices)
2. ✅ Using **Google Vertex AI (Gemini)** for intelligent script generation and critique
3. ✅ Providing a **voice-driven interface** for website personalization
4. ✅ Adapting content based on visitor context (conversational awareness)

---

## Submission Checklist

### Required Components

- [ ] **Hosted Project URL**
  - Live at: `https://voicehero.prodfact.com`
  - Dashboard accessible and functional
  - Widget demo pages showing the voice agent in action

- [ ] **GitHub Repository**
  - ✅ Public repository: `github.com/esatemre/voice-hero`
  - ✅ Open source license: MIT (visible in root)
  - ✅ Complete source code and assets
  - Clear README with setup instructions
  - `.env.example` with all required variables

- [ ] **Demo Video (3 minutes max)**
  - Upload to YouTube or Vimeo (must be public)
  - Content should cover:
    1. Problem statement (30 seconds)
    2. Solution overview with VoiceHero (30 seconds)
    3. Live demo of dashboard (1 minute)
    4. Widget in action on a sample website (30 seconds)
    5. Show integration with Gemini + ElevenLabs (30 seconds)

- [ ] **Devpost Submission Form**
  - Challenge: ElevenLabs
  - Title, tagline, description
  - Technologies used
  - Demo video link
  - Repository link
  - Hosted project link

---

## Demo Video Script Outline

### Scene 1: The Problem (0:00 - 0:30)
*Show homepage with static text*
- "Every visitor to your website sees the same generic headline."
- "First-time visitors are confused. Returning customers are bored. Ad traffic gets mismatched messaging."
- "Static websites don't adapt. But voice can."

### Scene 2: VoiceHero Solution (0:30 - 1:00)
*Show dashboard overview*
- "VoiceHero is a Landing Voice Agent that detects who your visitor is..."
- "...generates a personalized 20-second pitch using Google Gemini..."
- "...and speaks to them with a natural voice powered by ElevenLabs."

### Scene 3: Dashboard Features (1:00 - 2:00)
*Walk through dashboard*
- Page discovery: Show how pages are automatically detected
- Segment builder: Create segments (new visitor, returning, ad campaigns)
- Script generation: Generate scripts with language/tone/length controls
- Voice selection: Browse 500+ ElevenLabs voices
- Analytics: Show per-page engagement metrics
- Script critique: AI evaluates and suggests improvements

### Scene 4: Live Widget Demo (2:00 - 2:30)
*Show widget on a live website*
- Visitor lands on page
- Widget detects context (new/returning, UTM params)
- Audio player appears
- Play the voice agent's pitch
- Show different segments with different voices/scripts

### Scene 5: Tech Integration (2:30 - 3:00)
*Show architecture diagram or code*
- "Powered by Google Vertex AI (Gemini) for intelligent copywriting"
- "ElevenLabs voices for natural, realistic speech"
- "Firestore for data persistence"
- "Real-time analytics to measure voice impact"

---

## Implementation Status

### ✅ Completed Features
All core features are production-ready:

**Core Features (CORE - Available to all users):**
- Multi-segment scripts per page (CORE-multi-segment-per-page)
- Script generation wizard with language/tone/length (CORE-script-generation-wizard)
- Page discovery and management (CORE-page-discovery-view, CORE-page-content-snapshot, CORE-page-voice-toggle)
- Voice profiles with 500+ realistic voices (CORE-voice-profiles-preview)
- Per-segment voice selection (CORE-per-segment-voice-selection)
- Segment builder UI (CORE-segment-builder-ui)
- Workspace multi-site analytics (CORE-workspace-multi-site-status)
- Script suggestions on content change (CORE-suggest-scripts-after-change)

**Plus Features (PLUS - Premium capabilities):**
- AI script critique with improvement suggestions (PLUS-ai-script-critique)
- Per-page analytics breakdown (PLUS-per-page-analytics)
- Test as visitor simulator (PLUS-visitor-simulator)

### 📊 Dashboard & UI
- ✅ Professional dashboard layout with navigation
- ✅ System architecture documentation page
- ✅ Mobile-responsive design
- ✅ Dark/light mode support (via Tailwind)

### 🔧 API Endpoints
All required endpoints implemented and tested:
- `/api/playback` - Script selection with context
- `/api/generate-script` - Gemini-powered script generation
- `/api/script-critique` - AI evaluation and suggestions
- `/api/page-discovery` - Page tracking and management
- `/api/voice/generate` - ElevenLabs audio synthesis
- `/api/analytics/track` - Event tracking
- `/api/analytics/stats` - Aggregated metrics

---

## Key Talking Points

### 1. Problem-Solution Fit
- **Problem**: Static homepages don't convert different visitor types
- **Solution**: Voice agents that adapt messaging in real-time
- **Impact**: Higher engagement, lower bounce rates, increased conversions

### 2. Innovation
- First platform to combine **segment-based voice personalization** with **AI-generated scripts**
- Real-time script generation powered by Gemini
- Production-ready widget that works on any website

### 3. Technology Excellence
- **Google Gemini** for intelligent copywriting (language, tone, length control)
- **ElevenLabs** for natural, multilingual voice synthesis (500+ voices)
- **Firestore** for real-time data and analytics
- **Next.js** for scalable, serverless deployment

### 4. User Impact
- Website owners can personalize at scale without hiring copywriters
- Visitors get conversational, voice-driven experiences
- Data-driven insights show which scripts resonate with which segments
- Automatic script improvement suggestions via AI critique

### 5. Hackathon Requirements Met
✅ Uses ElevenLabs Agents/APIs for voice-driven interaction  
✅ Uses Google Cloud (Vertex AI/Gemini) for intelligent content generation  
✅ Deployed and hosted (voicehero.prodfact.com)  
✅ Public GitHub repository with MIT license  
✅ Production-ready application  

---

## Pre-Submission Checklist

### Code & Repository
- [ ] Ensure `.env.example` lists all required environment variables
- [ ] README is clear and complete with setup instructions
- [ ] License file is visible and at root level
- [ ] GitHub repo is public
- [ ] No secrets or API keys committed to repo
- [ ] Latest code is pushed to main branch

### Hosted Application
- [ ] Verify voicehero.prodfact.com is live and accessible
- [ ] Dashboard loads without errors
- [ ] Can create a new project
- [ ] Script generation works
- [ ] Voice selection works
- [ ] Widget preview/test works
- [ ] Analytics page displays correctly

### Documentation
- [ ] README highlights ElevenLabs + Gemini integration
- [ ] Architecture documentation is complete
- [ ] API documentation is clear
- [ ] Getting started guide is straightforward

### Demo Video
- [ ] 3 minutes or less
- [ ] Clear audio and screen recording
- [ ] Shows problem, solution, features, live demo
- [ ] Uploaded to YouTube/Vimeo as public video
- [ ] Link is shareable

### Devpost Form
- [ ] Project title is compelling and clear
- [ ] Tagline is 1-2 sentences, punchy
- [ ] Description covers problem, solution, tech, impact
- [ ] Technologies list includes: Next.js, Gemini, ElevenLabs, Firestore
- [ ] All links are correct and working
- [ ] Challenge selected: ElevenLabs

---

## Demo Video Upload Instructions

### Option 1: YouTube
1. Go to youtube.com and sign in
2. Click upload video (top right)
3. Select your demo video file
4. Title: "VoiceHero - Landing Voice Agent | ElevenLabs + Gemini Hackathon"
5. Description: Add problem, solution, tech stack
6. Make video PUBLIC (not unlisted)
7. Copy shareable link for Devpost

### Option 2: Vimeo
1. Go to vimeo.com and sign in
2. Click "Upload" 
3. Select your demo video
4. Add title and description
5. Set to public
6. Copy link for Devpost

---

## Marketing Copy for Devpost

### Title
**VoiceHero: AI-Powered Voice Agent for Landing Page Personalization**

### Tagline
Give every website visitor a personalized voice pitch powered by Gemini and ElevenLabs.

### Description Template
VoiceHero is a Landing Voice Agent platform that detects who your website visitors are and serves them personalized, AI-generated voice pitches.

**The Challenge:**
Every visitor sees the same static homepage. First-time visitors are confused. Returning customers are bored. Ad traffic gets mismatched messaging.

**The Solution:**
VoiceHero intelligently detects visitor context (new vs returning, UTM source, language) and generates tailored 20-second pitches using Google Vertex AI (Gemini). These pitches are spoken to visitors using ElevenLabs' natural, realistic voices—with different voices/scripts for different segments.

**How It Works:**
1. Website owner sets up VoiceHero dashboard
2. AI automatically discovers pages on their website
3. Owner creates audience segments (new visitors, returning customers, ad campaigns)
4. For each segment, Gemini generates a unique script tailored to convert that audience
5. ElevenLabs synthesizes the script into natural speech with the selected voice
6. Lightweight widget embeds on the website and plays personalized pitches
7. Analytics track which segments engage most, and AI suggests script improvements

**Technology:**
- **Google Vertex AI (Gemini)**: Generates intelligent, conversion-focused scripts with customizable language, tone, and length
- **ElevenLabs**: Text-to-speech with 500+ realistic voices for natural, multilingual voice synthesis
- **Firestore**: Real-time data storage for segments, scripts, audio, and analytics
- **Next.js**: Scalable, serverless platform for dashboard and API

**Impact:**
- Website owners can personalize at scale without hiring copywriters
- Visitors get conversational, voice-driven experiences that feel personal
- Real-time analytics show which pitches convert best
- AI continuously suggests script improvements based on engagement

**Why It's Hackathon-Ready:**
- ✅ Fully integrated ElevenLabs + Gemini
- ✅ Production-ready, deployed application
- ✅ Public GitHub repo with MIT license
- ✅ Clear data flows and architecture
- ✅ Real user value: higher conversion rates through voice personalization

---

## Timeline to Submission

**Now:**
- [ ] Finalize demo video script
- [ ] Record and edit demo video (1-2 hours)
- [ ] Upload to YouTube/Vimeo
- [ ] Verify all application features work on voicehero.prodfact.com

**Day Before Deadline (Dec 30):**
- [ ] Review GitHub repo (clean code, good docs)
- [ ] Test full user flow on hosted app
- [ ] Write Devpost submission form content
- [ ] Final QA of demo video

**Deadline Day (Dec 31):**
- [ ] Submit on Devpost before 2:00pm PST
- [ ] Verify submission was received
- [ ] Share with communities/networks if rules allow

---

## Success Metrics

To win, VoiceHero should:
1. ✅ **Technological Implementation**: Show strong integration of Gemini + ElevenLabs APIs with clean code
2. ✅ **Design**: Intuitive dashboard UI and smooth user experience
3. ✅ **Potential Impact**: Demonstrate real-world value for website owners
4. ✅ **Quality of Idea**: Show innovation in voice-personalization space

---

## Resources

- **ElevenLabs Docs**: https://elevenlabs.io/docs
- **Google Gemini Docs**: https://ai.google.dev
- **Devpost Submission**: https://ai-partner-catalyst.devpost.com/register
- **VoiceHero Hosted**: https://voicehero.prodfact.com
- **VoiceHero GitHub**: https://github.com/esatemre/voice-hero

---

Good luck! 🚀

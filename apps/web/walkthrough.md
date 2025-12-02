# VoiceHero MVP Walkthrough

## Overview
VoiceHero is a SaaS that generates personalized voice pitches for website visitors using Gemini and ElevenLabs.

## Features
- **Project Management**: Create projects for different websites.
- **Segment Configuration**: Define rules for New, Returning, and UTM-based visitors.
- **AI Script Generation**: Use Gemini to write engaging scripts.
- **Voice Generation**: Use ElevenLabs to convert scripts to audio.
- **Embeddable Widget**: A simple script tag to add the voice player to any site.

## Setup
1. **Environment Variables**:
   Copy `env.example` to `.env.local` and fill in your API keys:
   - `ELEVENLABS_API_KEY`

2. **Run Locally**:
   ```bash
   npm run dev
   ```

## Verification Steps

### 1. Create a Project
1. Go to `http://localhost:3000/dashboard/new`.
2. Enter project details (Name, URL, Description, Tone).
3. Click "Create Project".

### 2. Generate Content
1. In the Project Dashboard, you will see default segments.
2. Click "Generate" on a segment to create a script using Gemini.
3. Edit the script if needed.
4. Click "Generate Voice" to create the audio using ElevenLabs.

### 3. Embed Widget
1. Go to the "Integration" tab.
2. Copy the script tag.
3. Paste it into your website (or use `public/demo.html` for testing).

### 4. Test Playback
1. Open your website.
2. Click the VoiceHero bubble.
3. Listen to the personalized pitch.

## Demo
A demo page is available at `http://localhost:3000/demo.html`.
Make sure to replace `DATA-SITE-ID` with your actual project ID in the HTML file.

The main landing page is at `http://localhost:3000/` and showcases the "Landing Voice Agent" branding.

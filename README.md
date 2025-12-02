# Voice Hero - Landing Voice Agent 🎙️

**Your homepage, but with a self-optimizing 20-second voice pitch.**

> Built for the **Google Cloud x ElevenLabs Hackathon 2025**.
> *Challenge: ElevenLabs (Conversational, Intelligent, Voice-Driven)*

![Voice Hero Demo](https://via.placeholder.com/800x400?text=Voice+Hero+Dashboard)

## 🚀 The Problem
You fight for every click to your homepage. But once visitors arrive, they all see the same static headline.
- **First-time visitors** are confused.
- **Returning visitors** are bored.
- **Ad traffic** hears a generic pitch that doesn't match the ad they clicked.

Static text doesn't adapt. **Voice does.**

## 💡 The Solution
Landing Voice Agent is a "Voice Sales Agent" that lives on your website.
1. **Detects** who the visitor is (New, Returning, or from a specific Ad).
2. **Generates** a tailored 20-second pitch using **Google Vertex AI (Gemini)**.
3. **Speaks** to them using **ElevenLabs** high-fidelity AI voices.
4. **Learns** from engagement to write better scripts over time.

## 🛠️ Tech Stack

### 1. Google Cloud Platform (The Brain)
- **Vertex AI (Gemini Pro)**: We use Gemini to act as an expert copywriter. It analyzes the product description and generates unique scripts for each visitor segment (e.g., "Write a punchy, 15s intro for a returning visitor who hasn't converted yet").
- **Firestore**: Stores project config, segments, and generated audio mappings.
- **Cloud Run / Next.js**: The entire platform is hosted on a scalable serverless architecture.

### 2. ElevenLabs (The Voice)
- **Text-to-Speech API**: We use the `eleven_monolingual_v1` and Turbo models to generate lifelike speech that captures brand tone (Professional, Energetic, Calm).
- **Voice Design**: Each segment can have a distinct "persona".

## 🏗️ Architecture

```mermaid
graph TD
    A[Visitor Lands] -->|JS Widget| B{Context?}
    B -->|New User| C[Get 'New' Segment]
    B -->|Returning| D[Get 'Returning' Segment]
    B -->|?utm_source=ads| E[Get 'Ad' Segment]
    
    C & D & E --> F[Fetch Audio URL]
    F --> G[ElevenLabs Audio]
    
    subgraph "Optimization Loop (Async)"
        H[Gemini (Vertex AI)] -->|Drafts Script| I[Review/Approve]
        I -->|Generate| J[ElevenLabs API]
        J -->|Save URL| K[Firestore]
    end
```

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Google Cloud Service Account (Vertex AI & Firestore enabled)
- ElevenLabs API Key

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/esatemre/voice-hero.git
   cd voice-hero
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env.local` and add your keys:
   ```bash
   ELEVENLABS_API_KEY=your-elevenlabs-key
   
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

5. **Open the Dashboard**
   Visit `http://localhost:3000/dashboard` to create your first project.

## 🔮 Roadmap
We have big plans to turn Voice Hero into a fully conversational agent.
See [ROADMAP.md](./ROADMAP.md) for our vision of two-way voice conversations and reinforcement learning loops.

## 📄 License
MIT License.

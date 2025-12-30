# VoiceHero Setup Guide

A complete guide to setting up VoiceHero locally or in production.

## Prerequisites

- **Node.js** 18+
- **pnpm** (preferred) or npm/yarn
- **Google Cloud Account** with Firestore and Vertex AI enabled
- **ElevenLabs Account** with API key
- **Git** for cloning the repository

## Quick Start (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/esatemre/voice-hero.git
cd voice-hero
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your actual keys (see "Getting API Keys" section below).

### 4. Run the Development Server

```bash
pnpm run dev
```

The app will be available at `http://localhost:3000`

### 5. Access the Dashboard

1. Open `http://localhost:3000/dashboard` in your browser
2. Sign up with an email address
3. Create your first project
4. Start discovering pages and generating scripts

---

## Getting API Keys

### Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to **Project Settings** > **Your Apps** > **Web**
4. Copy the Firebase config values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

5. Go to **Project Settings** > **Service Accounts**
6. Click **Generate New Private Key** and download the JSON file
7. Extract these values from the JSON:
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (replace `\n` with actual newlines)
   - `FIREBASE_STORAGE_BUCKET`

8. Ensure **Firestore Database** is enabled:
   - Go to **Firestore Database** in the left menu
   - Click **Create Database**
   - Choose **Start in production mode**
   - Select your region

9. Ensure **Vertex AI API** is enabled:
   - Go to **APIs & Services** > **Library**
   - Search for "Vertex AI API"
   - Click **Enable**

### ElevenLabs

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/voice-lab)
2. Log in or create an account
3. Navigate to **API Keys** in the left menu
4. Copy your API key
5. Paste it into `ELEVENLABS_API_KEY` in `.env.local`

### Application URL

Set `NEXT_PUBLIC_APP_URL` to where your app is hosted:
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

---

## Project Structure

```
voice-hero/
├── apps/
│   └── web/                          # Main Next.js application
│       ├── app/
│       │   ├── api/                  # Backend API routes
│       │   │   ├── analytics/        # Event tracking & stats
│       │   │   ├── generate-script/  # Gemini script generation
│       │   │   ├── playback/         # Widget script selection
│       │   │   ├── page-discovery/   # Page tracking
│       │   │   ├── script-critique/  # AI script evaluation
│       │   │   ├── voice/            # ElevenLabs integration
│       │   │   └── projects/         # Project management
│       │   ├── dashboard/            # Dashboard pages
│       │   └── page.tsx              # Landing page
│       ├── components/               # React components
│       │   ├── project-view.tsx      # Main dashboard UI
│       │   ├── analytics-view.tsx    # Analytics dashboard
│       │   └── ui/                   # Reusable UI components
│       ├── lib/
│       │   ├── firebase.ts           # Firebase config
│       │   ├── gemini.ts             # Gemini/Vertex AI integration
│       │   ├── elevenlabs.ts         # ElevenLabs integration
│       │   └── types.ts              # TypeScript types
│       ├── public/
│       │   └── widget.js             # Embedded widget script
│       ├── tests/                    # Jest tests
│       └── .env.example              # Environment template
├── docs/
│   ├── INDEX.md                      # Documentation hub
│   ├── SETUP.md                      # This file
│   ├── ROADMAP.md                    # Future features and direction
│   ├── FIREBASE_FEATURE_FLAGS.md     # Feature flags reference
│   └── architecture.md               # System architecture documentation
├── README.md                         # Project overview
├── AGENTS.md                         # Agent instructions
└── LICENSE                           # MIT license
```

---

## Key Features Overview

### 1. Page Discovery

Automatically detect and track all unique pages on your website via the embedded widget.

**API:** `POST /api/page-discovery`  
**Related Files:** `apps/web/app/api/page-discovery/route.ts`

### 2. Script Generation

Generate conversion-focused scripts using Google Gemini AI. Control language, tone, and length.

**API:** `POST /api/generate-script`  
**Related Files:** `apps/web/app/api/generate-script/route.ts`, `apps/web/lib/gemini.ts`

### 3. Script Critique

Get AI-powered feedback on scripts with improvement suggestions.

**API:** `POST /api/script-critique`  
**Related Files:** `apps/web/app/api/script-critique/route.ts`

### 4. Voice Generation

Convert scripts to audio using ElevenLabs' 500+ realistic voices.

**API:** `POST /api/voice/generate`  
**Related Files:** `apps/web/app/api/voice/generate/route.ts`, `apps/web/lib/elevenlabs.ts`

### 5. Widget Playback

Embed on your website to serve personalized scripts based on visitor context.

**Widget:** `apps/web/public/widget.js`  
**API:** `POST /api/playback`  
**Related Files:** `apps/web/app/api/playback/route.ts`

### 6. Analytics

Track visitor engagement per page and segment.

**APIs:** `POST /api/analytics/track`, `GET /api/analytics/stats`  
**Related Files:** `apps/web/app/api/analytics/route.ts`, `apps/web/components/analytics-view.tsx`

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## Building for Production

```bash
# Build the application
pnpm run build

# Start the production server
pnpm start
```

---

## Deployment

### Docker + Coolify (Recommended)

VoiceHero is deployed using Docker images from GitHub Container Registry (GHCR) and hosted with Coolify:

1. **Build and Push Docker Image:**
   ```bash
   # Build the Docker image from the repository root
   docker build -t ghcr.io/your-org/voice-hero:latest -f apps/web/Dockerfile .
   
   # Push to GHCR
   docker push ghcr.io/your-org/voice-hero:latest
   ```

2. **Deploy with Coolify:**
   - Create a new application in Coolify
   - Select "Docker Image" as the source
   - Use the GHCR image: `ghcr.io/your-org/voice-hero:latest`
   - Set environment variables from `.env.local`
   - Configure your domain
   - Deploy

Coolify will automatically:
- Pull the latest image from GHCR
- Manage container lifecycle
- Handle SSL certificates
- Provide deployment logs and monitoring

### Other Platforms (AWS, GCP, Azure, etc.)

1. Build Docker image from repository root: `docker build -t voice-hero -f apps/web/Dockerfile .`
2. Push to your container registry
3. Deploy the container to your platform
4. Set environment variables in your hosting platform
5. Point your domain to the deployed application

---

## Troubleshooting

### "Module not found" errors

**Solution:** Ensure all dependencies are installed
```bash
pnpm install
```

### Firebase authentication errors

**Solution:** Verify your Firebase credentials in `.env.local`:
- Check that `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are correct
- Ensure Firestore Database is created and in production mode
- Verify the service account has appropriate permissions

### Gemini API errors

**Solution:** 
- Ensure Vertex AI API is enabled in Google Cloud Console
- Verify your project has Vertex AI quota available
- Check that your service account has `Vertex AI User` role

### ElevenLabs API errors

**Solution:**
- Verify your `ELEVENLABS_API_KEY` is correct
- Check your account has remaining API quota
- Ensure your API key hasn't been revoked

### Widget not loading on external websites

**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` is set correctly to your production domain
- Check CORS settings if you're getting browser console errors
- Ensure the widget script tag is correctly embedded: 
  ```html
  <script src="https://yourdomain.com/widget.js"></script>
  ```

---

## Development Workflow

### Creating a New Feature

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes following the existing code style
3. Test locally: `pnpm run dev`
4. Run tests: `pnpm test`
5. Commit with clear messages: `git commit -m "feat: add my feature"`
6. Push and create a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules (auto-checked on commit)
- Use Prettier for formatting (run `pnpm format` before committing)
- Write tests for new features

---

## Performance Optimization

### Widget Performance

- Widget script is minified and lazy-loaded
- Audio playback uses browser's native player
- Analytics events are batched and sent asynchronously

### API Performance

- Firestore queries are indexed for fast lookups
- Script generation uses streaming responses
- Audio URLs are cached to avoid regeneration

---

## Security Considerations

⚠️ **Never commit the following to Git:**
- `.env.local` (contains API keys)
- `Firebase private key`
- `ElevenLabs API key`

✅ **Always:**
- Use environment variables for secrets
- Keep `.env.local` in `.gitignore` (already configured)
- Rotate API keys regularly
- Use Firebase Security Rules to restrict database access
- Validate all user inputs on the backend

---

## Support & Resources

- **VoiceHero GitHub:** https://github.com/esatemre/voice-hero
- **Firebase Docs:** https://firebase.google.com/docs
- **Vertex AI Docs:** https://cloud.google.com/vertex-ai/docs
- **ElevenLabs Docs:** https://elevenlabs.io/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## License

MIT License - See [LICENSE](./LICENSE) file for details.

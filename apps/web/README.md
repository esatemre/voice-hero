# Landing Voice Agent Web App

Self-optimizing voice pitches for your website.

## Environment Setup

### Development Mode

1. Copy the environment example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   - Firebase configuration
   - ElevenLabs API key
   - App URL (defaults to `http://localhost:3000`)

3. Start the development server:
   ```bash
   pnpm dev
   ```

**How it works:** Next.js automatically loads variables from `.env.local` at runtime. The variables are read from `process.env` when your application code executes.

### Production Mode

1. Set environment variables in your hosting platform:
   - **Vercel**: Project Settings → Environment Variables
   - **Other platforms**: Set via platform-specific configuration

2. Deploy your application

**How it works:** Next.js reads environment variables from the server's environment at runtime. No `.env` files are used in production.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | No |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice generation | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

### Variable Prefixes

- **`NEXT_PUBLIC_*`**: Exposed to the browser (client-side)
- **No prefix**: Server-side only (never exposed to browser)

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
apps/web/
├── app/              # Next.js app directory (pages & layouts)
├── components/       # React components
├── lib/              # Utility functions and configurations
│   ├── env.ts       # Centralized environment configuration
│   ├── firebase.ts  # Firebase initialization
│   └── elevenlabs.ts # ElevenLabs API client
├── public/          # Static assets
└── .env.local       # Local environment variables (gitignored)
```

## Notes

- `.env.local` is gitignored and should never be committed
- Always use `.env.example` as a template
- Environment variables are loaded at runtime, not build time
- Server-side variables (without `NEXT_PUBLIC_`) are never exposed to the browser

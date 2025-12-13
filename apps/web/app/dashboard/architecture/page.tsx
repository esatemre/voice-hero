import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export default function ArchitecturePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
                <p className="text-muted-foreground mt-2">
                    How VoiceHero processes data through page discovery, script generation, voice synthesis, widget delivery, and analytics.
                </p>
            </div>

            {/* Overview Diagram */}
            <Card>
                <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted p-2 sm:p-4 rounded-lg">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                            <pre className="font-mono text-xs sm:text-sm leading-tight select-none whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────┐
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
   │ Firestore│  │ Gemini   │    │ElevenLabs│
   │ Database │  │ API      │    │Voice API │
   └──────────┘  └──────────┘    └──────────┘
        │
        └─────────────────────────────────┐
                                          │
        ┌─────────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────────┐
   │  Widget (Embedded on Client Site)│
   │  • Page context detection        │
   │  • Playback logic & selection    │
   │  • Audio player                  │
   │  • Event tracking                │
   └──────────────────────────────────┘
        │
        ▼
   ┌──────────────────┐
   │ Analytics Events │
   │ (Recorded back   │
   │  to Firestore)   │
   └──────────────────┘`}
                            </pre>
                        </div>
                        <div className="mt-2 text-center">
                            <span className="text-xs text-muted-foreground">
                                ← Scroll horizontally to see full diagram →
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Core Subsystems */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Core Subsystems</h2>

                <Accordion type="single" collapsible className="space-y-2">
                    {/* Page Discovery */}
                    <AccordionItem value="page-discovery" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold">1. Page Discovery & Management</h3>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Purpose</p>
                                <p className="text-sm text-muted-foreground">
                                    Scan and track pages on user websites for targeting scripts.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Components</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li><strong>Page Detection:</strong> Widget collects page URL and title from each visitor session</li>
                                    <li><strong>Page Index:</strong> API aggregates unique pages into a project-scoped index</li>
                                    <li><strong>Page Metadata:</strong> Stores URL, title, content snapshot, and voice toggle</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Data Flow</p>
                                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                                    <li>Widget sends page URL and content to <code className="bg-muted px-1 rounded">/api/page-discovery</code></li>
                                    <li>API stores unique pages in Firestore under <code className="bg-muted px-1 rounded">projects/pages</code></li>
                                    <li>Dashboard queries page list for user configuration</li>
                                </ol>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Related Files</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>apps/web/app/api/page-discovery/route.ts</li>
                                    <li>apps/web/app/api/projects/[projectId]/pages/route.ts</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Script Management */}
                    <AccordionItem value="script-management" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold">2. Script Management & Generation</h3>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Purpose</p>
                                <p className="text-sm text-muted-foreground">
                                    Create and manage voice scripts for different audience segments and pages.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Components</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li><strong>Script Generation:</strong> AI (Gemini) generates scripts from page content</li>
                                    <li><strong>Script Wizard:</strong> Guided UI for language, tone, and length control</li>
                                    <li><strong>Script Critique:</strong> AI evaluates and suggests improvements</li>
                                    <li><strong>Multi-Level Scripts:</strong> Project defaults + page-specific overrides</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Data Model</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li><strong>Project Segments:</strong> Global segment definitions (e.g., &quot;new visitor&quot;)</li>
                                    <li><strong>Page Segments:</strong> Page-specific script assignments</li>
                                    <li><strong>Script Versions:</strong> Track edits and allow rollback</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Related Files</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>apps/web/app/api/generate-script/route.ts</li>
                                    <li>apps/web/app/api/script-critique/route.ts</li>
                                    <li>apps/web/lib/gemini.ts</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Voice & Audio */}
                    <AccordionItem value="voice-audio" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold">3. Voice & Audio Generation</h3>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Purpose</p>
                                <p className="text-sm text-muted-foreground">
                                    Convert text scripts into realistic voice audio.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Components</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li><strong>Voice Profiles:</strong> 500+ realistic voices from ElevenLabs</li>
                                    <li><strong>Voice Preview:</strong> Users preview before selecting</li>
                                    <li><strong>Per-Segment Selection:</strong> Different segments use different voices</li>
                                    <li><strong>Audio Caching:</strong> Generated audio is cached in cloud storage</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Data Flow</p>
                                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                                    <li>User selects voice from Voice Profiles UI</li>
                                    <li>System stores voice ID in segment config</li>
                                    <li>When script updates, trigger ElevenLabs API for audio generation</li>
                                    <li>Store audio URL in Firestore alongside script</li>
                                    <li>Widget downloads and plays audio based on context</li>
                                </ol>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Related Files</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>apps/web/app/api/voice/preview/route.ts</li>
                                    <li>apps/web/app/api/voice/generate/route.ts</li>
                                    <li>apps/web/lib/elevenlabs.ts</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Widget & Playback */}
                    <AccordionItem value="widget-playback" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold">4. Widget & Playback</h3>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Purpose</p>
                                <p className="text-sm text-muted-foreground">
                                    Deliver voice experiences to end-user website visitors.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Components</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li><strong>Widget Script:</strong> Small JavaScript bundle on customer websites</li>
                                    <li><strong>Context Detection:</strong> Identifies visitor context (page, returning, UTM, language)</li>
                                    <li><strong>Segment Selection:</strong> Maps context to appropriate script + voice</li>
                                    <li><strong>Playback Engine:</strong> Audio player with UI controls</li>
                                    <li><strong>Event Tracking:</strong> Sends playback events to analytics</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Widget Data Flow</p>
                                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                                    <li>Visitor loads page with VoiceHero widget</li>
                                    <li>Widget detects pageUrl, language, UTM params, returning status</li>
                                    <li>Widget calls <code className="bg-muted px-1 rounded">/api/playback</code> with context</li>
                                    <li>/api/playback selects script + audio based on segment matching</li>
                                    <li>Widget displays player and renders script</li>
                                    <li>Visitor plays audio; events tracked (play, complete, etc.)</li>
                                    <li>Events sent to <code className="bg-muted px-1 rounded">/api/analytics/track</code></li>
                                </ol>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Related Files</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>apps/web/public/widget.js</li>
                                    <li>apps/web/app/api/playback/route.ts</li>
                                    <li>apps/web/app/api/analytics/track/route.ts</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Analytics */}
                    <AccordionItem value="analytics" className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold">5. Analytics & Reporting</h3>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Purpose</p>
                                <p className="text-sm text-muted-foreground">
                                    Track voice engagement and provide insights to teams.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Key Metrics</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li><strong>Plays:</strong> Number of times audio was initiated</li>
                                    <li><strong>Completions:</strong> Number of times audio played fully</li>
                                    <li><strong>Engagement Rate:</strong> Completions / Plays</li>
                                    <li><strong>Per-Page Breakdown:</strong> Metrics grouped by URL</li>
                                    <li><strong>Segment Performance:</strong> Which segments drive highest engagement</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Data Flow</p>
                                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                                    <li>Widget tracks play/complete events with full context</li>
                                    <li>Events sent to <code className="bg-muted px-1 rounded">/api/analytics/track</code></li>
                                    <li>Events stored in Firestore under <code className="bg-muted px-1 rounded">projects/analytics/events</code></li>
                                    <li>Dashboard queries <code className="bg-muted px-1 rounded">/api/analytics/stats</code> for aggregated metrics</li>
                                    <li>UI renders charts, tables, and per-page breakdowns</li>
                                </ol>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Related Files</p>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>apps/web/app/api/analytics/track/route.ts</li>
                                    <li>apps/web/app/api/analytics/stats/route.ts</li>
                                    <li>apps/web/components/analytics-view.tsx</li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Key Design Patterns */}
            <Card>
                <CardHeader>
                    <CardTitle>Key Design Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">1. Context-Based Routing</h4>
                        <p className="text-sm text-muted-foreground">
                            Scripts are selected based on visitor context (page, returning status, language, UTM source). This enables targeted messaging without exposing selection logic to the dashboard.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">2. Fallback Chain</h4>
                        <p className="text-sm text-muted-foreground">
                            If a page-specific segment script doesn&apos;t exist, the system falls back to project-level segment scripts. This ensures graceful degradation and backward compatibility.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">3. Event-Driven Updates</h4>
                        <p className="text-sm text-muted-foreground">
                            Page discovery, script generation, and voice synthesis are event-triggered. The widget reports what it discovers, and the backend ingests and surfaces new data.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">4. Single Source of Truth</h4>
                        <p className="text-sm text-muted-foreground">
                            Each artifact (script, audio, voice ID) is stored once in Firestore. UI and widget both read from the same database, eliminating sync issues.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Technology Stack */}
            <Card>
                <CardHeader>
                    <CardTitle>Technology Stack</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold mb-2">Frontend</p>
                            <ul className="text-muted-foreground space-y-1 list-disc ml-4">
                                <li>Next.js</li>
                                <li>React</li>
                                <li>TypeScript</li>
                                <li>Tailwind CSS</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold mb-2">Backend</p>
                            <ul className="text-muted-foreground space-y-1 list-disc ml-4">
                                <li>Next.js API routes</li>
                                <li>TypeScript</li>
                                <li>Firestore</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold mb-2">External Services</p>
                            <ul className="text-muted-foreground space-y-1 list-disc ml-4">
                                <li>Google Gemini (AI)</li>
                                <li>ElevenLabs (Voice)</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold mb-2">Deployment</p>
                            <ul className="text-muted-foreground space-y-1 list-disc ml-4">
                                <li>Docker (GHCR)</li>
                                <li>Coolify (Hosting)</li>
                                <li>Firebase (Database)</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

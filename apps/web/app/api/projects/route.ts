import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { getDb } from "@/lib/db";
import { Project, Segment, Page } from "@/lib/types";
import { sendWelcomeEmail } from "@/lib/onboarding-email";

async function computeProjectStatus(
  projectId: string,
): Promise<Project["status"]> {
  const db = getDb();
  const segmentsSnapshot = await db
    .collection("projects")
    .doc(projectId)
    .collection("segments")
    .get();
  const segments = segmentsSnapshot.docs.map((doc) => doc.data() as Segment);

  const segmentsTotal = segments.length;
  const segmentsWithAudio = segments.filter((s) => s.audioUrl).length;

  const lastVoiceGeneratedAt =
    segmentsWithAudio > 0
      ? Math.max(...segments.filter((s) => s.audioUrl).map((s) => s.createdAt))
      : null;

  // Compute page-level status
  const pagesSnapshot = await db
    .collection("projects")
    .doc(projectId)
    .collection("pages")
    .get();
  const pages = pagesSnapshot.docs.map((doc) => doc.data() as Page);

  const pagesTotal = pages.length;
  const pagesVoiceEnabled = pages.filter((p) => p.voiceEnabled).length;

  const lastScrapeAt =
    pages.length > 0
      ? Math.max(
          ...pages
            .filter((p) => p.lastScrapedAt)
            .map((p) => p.lastScrapedAt as number),
        )
      : null;

  return {
    segmentsTotal,
    segmentsWithAudio,
    lastVoiceGeneratedAt,
    pagesTotal,
    pagesVoiceEnabled,
    lastScrapeAt,
  };
}

export async function GET() {
  try {
    const db = getDb();
    const projectsSnapshot = await db.collection("projects").get();

    const projects = await Promise.all(
      projectsSnapshot.docs.map(async (doc) => {
        const project = doc.data() as Project;
        const status = await computeProjectStatus(project.id);
        return { ...project, status };
      }),
    );

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      baseUrl,
      description,
      tone,
      language,
      aiSummary,
      aiDetails,
      email,
      initialScripts,
      selectedVoiceId,
    } = body;

    const db = getDb();
    const projectRef = db.collection("projects").doc();
    const projectId = projectRef.id;

    // Email is optional - use placeholder if not provided
    let normalizedEmail: string;
    if (email && typeof email === "string" && email.includes("@")) {
      normalizedEmail = email.trim().toLowerCase();
    } else {
      // Use placeholder email if not provided (for demo/MVP)
      normalizedEmail = `demo-${projectId}@voicehero.local`;
    }

    const emailVerificationToken = randomUUID();
    const emailUnsubscribeToken = randomUUID();
    const emailVerificationExpiresAt =
      Date.now() + 7 * 24 * 60 * 60 * 1000;

    const project: Project = {
      id: projectId,
      ownerId: "demo-user", // Hardcoded for MVP
      name: name || "",
      baseUrl: baseUrl || "",
      description: description || "",
      tone: tone || "professional",
      language: language || "en-US",
      aiSummary: aiSummary || null,
      aiDetails: aiDetails || null,
      email: normalizedEmail,
      emailVerified: false,
      emailVerifiedAt: null,
      emailVerificationToken,
      emailVerificationExpiresAt,
      emailOptOut: false,
      emailUnsubscribeToken,
      status: {
        segmentsTotal: 0,
        segmentsWithAudio: 0,
        lastVoiceGeneratedAt: null,
        pagesTotal: 0,
        pagesVoiceEnabled: 0,
        lastScrapeAt: null,
      },
      createdAt: Date.now(),
    };

    await projectRef.set(project);

    // Create default segments in project subcollection
    // Use provided initial scripts if available, otherwise use defaults
    const defaultSegments: Omit<Segment, "id">[] = [
      {
        projectId,
        type: "new_visitor",
        scriptContent: initialScripts?.welcome || "Welcome to our site! Check out our amazing features.",
        createdAt: Date.now(),
      },
      {
        projectId,
        type: "returning_visitor",
        scriptContent: initialScripts?.returning || "Welcome back! Here is what is new since your last visit.",
        createdAt: Date.now(),
      },
      {
        projectId,
        type: "utm_source",
        conditionValue: "ads",
        scriptContent: initialScripts?.cta || "Thanks for clicking our ad! Here is the special offer we promised.",
        createdAt: Date.now(),
      },
    ];

    const batch = db.batch();
    const segmentDocs: { id: string; segment: Omit<Segment, "id"> & { voiceId?: string } }[] = [];
    defaultSegments.forEach((segment) => {
      const docRef = projectRef.collection("segments").doc();
      const segmentData: Segment = { ...segment, id: docRef.id } as Segment;
      // Add voice ID if provided and segment has script content
      if (selectedVoiceId && segment.scriptContent) {
        segmentData.voiceId = selectedVoiceId;
      }
      batch.set(docRef, segmentData);
      segmentDocs.push({ id: docRef.id, segment: segmentData });
    });

    await batch.commit();

    // Automatically generate voices for segments with scripts and selected voice
    if (selectedVoiceId) {
      setImmediate(async () => {
        try {
          const { generateVoice } = await import("@/lib/elevenlabs");
          const { saveAudioFile, verifyStorageAccess } = await import("@/lib/storage");
          
          await verifyStorageAccess();
          
          for (const { id: segmentId, segment } of segmentDocs) {
            if (segment.scriptContent && segment.voiceId) {
              try {
                const audioBuffer = await generateVoice(segment.scriptContent, segment.voiceId);
                const audioUrl = await saveAudioFile(audioBuffer, `${projectId}-${segmentId}`);
                
                await db
                  .collection("projects")
                  .doc(projectId)
                  .collection("segments")
                  .doc(segmentId)
                  .update({ audioUrl });
              } catch (error) {
                console.error(`Failed to generate voice for segment ${segmentId}:`, error);
                // Continue with other segments even if one fails
              }
            }
          }
          
          // Update project status after voice generation
          const segmentsSnapshot = await db
            .collection("projects")
            .doc(projectId)
            .collection("segments")
            .get();
          const segments = segmentsSnapshot.docs.map((doc) => doc.data() as Segment);
          const segmentsWithAudio = segments.filter((s) => s.audioUrl).length;
          
          await db.collection("projects").doc(projectId).update({
            "status.segmentsWithAudio": segmentsWithAudio,
            "status.lastVoiceGeneratedAt": segmentsWithAudio > 0 ? Date.now() : null,
          });
        } catch (error) {
          console.error("Failed to auto-generate voices:", error);
          // Don't fail project creation if voice generation fails
        }
      });
    }

    // Automatically discover pages if baseUrl is provided (async, don't block)
    if (baseUrl) {
      // Run page discovery asynchronously to not block project creation
      setImmediate(async () => {
        try {
          const { discoverPages } = await import("@/lib/scraper");
          const discovered = await discoverPages(baseUrl, 50);
          if (discovered.length > 0) {
            const pagesRef = projectRef.collection("pages");
            const existingSnapshot = await pagesRef.get();
            const existingByUrl = new Map<string, Page>();
            existingSnapshot.forEach((doc) => {
              const data = doc.data() as Page;
              existingByUrl.set(data.url, { ...data, id: data.id || doc.id });
            });

            const pagesBatch = db.batch();
            discovered.forEach((page) => {
              try {
                const parsed = new URL(page.url);
                const normalizedPath = parsed.pathname.endsWith("/") && parsed.pathname !== "/"
                  ? parsed.pathname.slice(0, -1)
                  : parsed.pathname;
                const normalizedUrl = `${parsed.origin}${normalizedPath}`;
                
                const existing = existingByUrl.get(normalizedUrl);
                const pageId = existing?.id || createHash("sha1").update(normalizedUrl).digest("hex");
                const pageDoc = pagesRef.doc(pageId);
                
                pagesBatch.set(
                  pageDoc,
                  {
                    id: pageId,
                    projectId,
                    url: normalizedUrl,
                    path: parsed.pathname || "/",
                    title: page.title || page.url,
                    status: existing?.status ?? "discovered",
                    lastScrapedAt: existing?.lastScrapedAt ?? null,
                    voiceEnabled: existing?.voiceEnabled ?? true,
                    lastContentHash: existing?.lastContentHash ?? null,
                  },
                  { merge: true }
                );
              } catch (e) {
                console.error("Error processing discovered page:", e);
              }
            });
            await pagesBatch.commit();
          }
        } catch (error) {
          console.error("Failed to auto-discover pages:", error);
          // Don't fail project creation if page discovery fails
        }
      });
    }

    try {
      await sendWelcomeEmail(project, projectId);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}

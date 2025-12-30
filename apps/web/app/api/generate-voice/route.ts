import { NextResponse } from "next/server";
import { ElevenLabsError, generateVoice } from "@/lib/elevenlabs";
import { getDb } from "@/lib/db";
import { saveAudioFile, verifyStorageAccess } from "@/lib/storage";
import { Segment } from "@/lib/types";
import { isEmailConfigured } from "@/lib/email";
import { maybeSendOnboardingEmail } from "@/lib/onboarding-email";

async function updateProjectStatus(projectId: string) {
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

  await db.collection("projects").doc(projectId).update({
    "status.segmentsTotal": segmentsTotal,
    "status.segmentsWithAudio": segmentsWithAudio,
    "status.lastVoiceGeneratedAt": lastVoiceGeneratedAt,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voiceId, projectId, segmentId } = body;
    let hadAudioBefore = false;

    const emailConfigured = projectId ? await isEmailConfigured() : false;

    if (projectId && emailConfigured) {
      const db = getDb();
      const segmentsSnapshot = await db
        .collection("projects")
        .doc(projectId)
        .collection("segments")
        .get();
      hadAudioBefore = segmentsSnapshot.docs.some(
        (doc) => !!(doc.data() as Segment).audioUrl,
      );
    }

    // Verify Firebase Storage access before generating voice to avoid wasting tokens
    await verifyStorageAccess();

    const audioBuffer = await generateVoice(text, voiceId);

    // In a real app, we would upload this buffer to Google Cloud Storage
    // For MVP, we might just return the base64 or a temporary URL if we can't set up GCS easily.
    // However, the plan says "Stored directly as ElevenLabs URLs, or Downloaded and put in Cloud Storage".
    // ElevenLabs doesn't give a permanent URL unless we use their history API, but even then it's better to host it.
    // Let's assume we have GCS setup or we can just return base64 for the immediate demo if GCS is too much friction.
    // BUT, the widget needs a URL.
    // Let's try to use a data URI for now if the audio is short (20s is ~1MB maybe? might be heavy).
    // Better: use the history item ID from ElevenLabs if possible, or just mock the storage for now.

    // Actually, let's implement a simple file upload to GCS if we have the credentials.
    // If not, we can save to local disk (in `public/audio`) since we are running locally or on a simple server.
    // For local development, `public/audio` can be used, but in production we use Firebase Storage.

    // Note: `public` folder in Next.js is static. We can't write to it at runtime in production.
    // Audio files are stored in Firebase Storage instead for production deployments.

    const audioUrl = await saveAudioFile(
      audioBuffer,
      `${projectId}-${segmentId}`,
    );

    // Update segment in Firestore
    if (projectId && segmentId) {
      const db = getDb();
      await db
        .collection("projects")
        .doc(projectId)
        .collection("segments")
        .doc(segmentId)
        .update({
          audioUrl,
          voiceId,
        });

      await updateProjectStatus(projectId);

      if (!hadAudioBefore && emailConfigured) {
        maybeSendOnboardingEmail(projectId, "voice-ready").catch((error) => {
          console.error("Failed to send voice-ready email:", error);
        });
      }
    }

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("Error generating voice:", error);

    // Handle storage errors separately (these occur before voice generation)
    if (error instanceof Error && error.message.includes("Firebase Storage")) {
      return NextResponse.json(
        {
          error: error.message,
          code: "storage_error",
        },
        { status: 500 },
      );
    }

    if (error instanceof ElevenLabsError) {
      const message = error.message || "Failed to generate voice";
      const normalizedMessage = message.toLowerCase();
      let status = error.statusCode || 500;
      let code = "elevenlabs_error";
      let responseMessage = message;

      if (
        normalizedMessage.includes("model") &&
        normalizedMessage.includes("deprecat")
      ) {
        status = 400;
        code = "model_deprecated";
        responseMessage =
          "Voice model deprecated. Please switch to eleven_turbo_v2_5.";
      } else if (error.type === "missing_api_key") {
        status = 500;
        code = "missing_api_key";
        responseMessage = "Missing ElevenLabs API key on the server.";
      } else if (
        error.statusCode === 401 ||
        normalizedMessage.includes("api key") ||
        normalizedMessage.includes("unauthorized")
      ) {
        status = 401;
        code = "invalid_api_key";
        responseMessage = "Invalid ElevenLabs API key.";
      } else if (
        error.statusCode === 429 ||
        normalizedMessage.includes("rate limit")
      ) {
        status = 429;
        code = "rate_limited";
        responseMessage =
          "ElevenLabs rate limit reached. Please retry shortly.";
      } else if (
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        status = error.statusCode;
      }

      return NextResponse.json(
        { error: responseMessage, code, details: error.details },
        { status },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate voice" },
      { status: 500 },
    );
  }
}

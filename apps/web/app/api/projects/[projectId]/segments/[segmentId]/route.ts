import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

async function updateProjectStatus(projectId: string) {
  const db = getDb();
  const segmentsSnapshot = await db
    .collection("projects")
    .doc(projectId)
    .collection("segments")
    .get();
  const segments = segmentsSnapshot.docs.map((doc) => doc.data());

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; segmentId: string }> },
) {
  try {
    const { projectId, segmentId } = await params;
    const body = await request.json();
    const { scriptContent, voiceId, lastContentSnapshotId, lastContentHash } =
      body;

    if (!projectId || !segmentId) {
      return NextResponse.json(
        { error: "Missing projectId or segmentId" },
        { status: 400 },
      );
    }

    const hasScriptContent = typeof scriptContent !== "undefined";
    const hasVoiceId = typeof voiceId !== "undefined";
    const hasSnapshotId = typeof lastContentSnapshotId !== "undefined";
    const hasContentHash = typeof lastContentHash !== "undefined";

    if (!hasScriptContent && !hasVoiceId && !hasSnapshotId && !hasContentHash) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    if (hasScriptContent) {
      if (
        typeof scriptContent !== "string" ||
        scriptContent.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "Script content is required" },
          { status: 400 },
        );
      }
    }

    if (hasVoiceId) {
      if (typeof voiceId !== "string" || voiceId.trim().length === 0) {
        return NextResponse.json(
          { error: "Voice ID is required" },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, string> = {};

    if (hasScriptContent) {
      updateData.scriptContent = scriptContent;
    }
    if (hasVoiceId) {
      updateData.voiceId = voiceId;
    }
    if (lastContentSnapshotId) {
      updateData.lastContentSnapshotId = lastContentSnapshotId;
    }
    if (lastContentHash) {
      updateData.lastContentHash = lastContentHash;
    }

    const db = getDb();
    await db
      .collection("projects")
      .doc(projectId)
      .collection("segments")
      .doc(segmentId)
      .update(updateData);

    return NextResponse.json({
      id: segmentId,
      ...(hasScriptContent && { scriptContent }),
      ...(hasVoiceId && { voiceId }),
      ...(lastContentSnapshotId && { lastContentSnapshotId }),
      ...(lastContentHash && { lastContentHash }),
    });
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; segmentId: string }> },
) {
  try {
    const { projectId, segmentId } = await params;

    if (!projectId || !segmentId) {
      return NextResponse.json(
        { error: "Missing projectId or segmentId" },
        { status: 400 },
      );
    }

    const db = getDb();
    await db
      .collection("projects")
      .doc(projectId)
      .collection("segments")
      .doc(segmentId)
      .delete();

    await updateProjectStatus(projectId);

    return NextResponse.json({ id: segmentId, deleted: true });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 },
    );
  }
}

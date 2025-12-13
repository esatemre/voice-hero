import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Segment } from "@/lib/types";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const db = getDb();

    const body = await request.json().catch(() => ({}));

    if (body.type) {
      const { type, conditionValue } = body;
      const validTypes = [
        "new_visitor",
        "returning_visitor",
        "utm_source",
        "geo",
        "language",
      ];

      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: "Invalid segment type" },
          { status: 400 },
        );
      }

      if (
        (type === "utm_source" || type === "geo" || type === "language") &&
        !conditionValue
      ) {
        return NextResponse.json(
          {
            error:
              "conditionValue is required for utm_source, geo, and language segments",
          },
          { status: 400 },
        );
      }

      const docRef = db
        .collection("projects")
        .doc(projectId)
        .collection("segments")
        .doc();

      const newSegment: Segment = {
        id: docRef.id,
        projectId,
        type,
        conditionValue,
        scriptContent: "",
        createdAt: Date.now(),
      };

      await docRef.set(newSegment);
      await updateProjectStatus(projectId);

      return NextResponse.json(newSegment);
    }

    const defaultSegments: Omit<Segment, "id">[] = [
      {
        projectId,
        type: "new_visitor",
        scriptContent: "Welcome to our site! Check out our amazing features.",
        createdAt: Date.now(),
      },
      {
        projectId,
        type: "returning_visitor",
        scriptContent:
          "Welcome back! Here is what is new since your last visit.",
        createdAt: Date.now(),
      },
      {
        projectId,
        type: "utm_source",
        conditionValue: "ads",
        scriptContent:
          "Thanks for clicking our ad! Here is the special offer we promised.",
        createdAt: Date.now(),
      },
    ];

    const batch = db.batch();
    const createdSegments: Segment[] = [];

    defaultSegments.forEach((segment) => {
      const docRef = db
        .collection("projects")
        .doc(projectId)
        .collection("segments")
        .doc();
      const segmentWithId = { ...segment, id: docRef.id };
      batch.set(docRef, segmentWithId);
      createdSegments.push(segmentWithId);
    });

    await batch.commit();

    await updateProjectStatus(projectId);

    return NextResponse.json(createdSegments);
  } catch (error) {
    console.error("Error creating segments:", error);
    return NextResponse.json(
      { error: "Failed to create segments" },
      { status: 500 },
    );
  }
}

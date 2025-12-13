import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Page, PageSegment, Segment } from "@/lib/types";

type AnySegment = Segment | PageSegment;

function selectSegment(
  segments: AnySegment[],
  utmSource: string | null,
  isReturning: boolean,
  lang: string | null,
): AnySegment | undefined {
  let selected: AnySegment | undefined;

  if (utmSource) {
    selected = segments.find(
      (s) => s.type === "utm_source" && s.conditionValue === utmSource,
    );
  }

  if (!selected && isReturning) {
    selected = segments.find((s) => s.type === "returning_visitor");
  }

  if (!selected && lang) {
    selected = segments.find(
      (s) => s.type === "language" && lang.startsWith(s.conditionValue || ""),
    );
  }

  if (!selected) {
    selected = segments.find((s) => s.type === "new_visitor");
  }

  if (!selected && segments.length > 0) {
    selected = segments[0];
  }

  return selected;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const lang = searchParams.get("lang");
  const isReturning = searchParams.get("isReturning") === "true";
  const utmSource = searchParams.get("utmSource");
  const pageUrl = searchParams.get("pageUrl");

  if (!siteId) {
    return NextResponse.json(
      { error: "Missing siteId" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const db = getDb();
    const projectRef = db.collection("projects").doc(siteId);

    let pageId: string | null = null;

    if (pageUrl) {
      const pagesQuery = await projectRef
        .collection("pages")
        .where("url", "==", pageUrl)
        .limit(1)
        .get();

      if (!pagesQuery.empty) {
        const pageDoc = pagesQuery.docs[0];
        const pageData = pageDoc.data() as Page;

        if (pageData.voiceEnabled === false) {
          return NextResponse.json(
            { voiceDisabled: true },
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        pageId = pageData.id || pageDoc.id;

        const pageSegmentsSnapshot = await projectRef
          .collection("pages")
          .doc(pageId)
          .collection("segments")
          .get();

        if (!pageSegmentsSnapshot.empty) {
          const pageSegments = pageSegmentsSnapshot.docs.map(
            (doc) => doc.data() as PageSegment,
          );
          const selectedPageSegment = selectSegment(
            pageSegments,
            utmSource,
            isReturning,
            lang,
          );

          if (selectedPageSegment && selectedPageSegment.audioUrl) {
            return NextResponse.json(
              {
                audioUrl: selectedPageSegment.audioUrl,
                transcript: selectedPageSegment.scriptContent,
                label: "Overview",
                segmentId: selectedPageSegment.id,
                segmentType: selectedPageSegment.type,
              },
              {
                headers: {
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }
        }
      }
    }

    const segmentsRef = projectRef.collection("segments");
    const snapshot = await segmentsRef.get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "No segments found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const segments = snapshot.docs.map((doc) => doc.data() as Segment);

    const selectedSegment = selectSegment(
      segments,
      utmSource,
      isReturning,
      lang,
    );

    if (!selectedSegment || !selectedSegment.audioUrl) {
      return NextResponse.json(
        { error: "No matching segment with audio found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return NextResponse.json(
      {
        audioUrl: selectedSegment.audioUrl,
        transcript: selectedSegment.scriptContent,
        label: "Overview",
        segmentId: selectedSegment.id,
        segmentType: selectedSegment.type,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching playback:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

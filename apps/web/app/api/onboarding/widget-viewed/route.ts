import { NextResponse } from "next/server";
import { maybeSendOnboardingEmail } from "@/lib/onboarding-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    await maybeSendOnboardingEmail(projectId, "widget-install");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking widget view:", error);
    return NextResponse.json(
      { error: "Failed to track widget view" },
      { status: 500 },
    );
  }
}

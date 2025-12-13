import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { Project } from "@/lib/types";

async function verifyEmail(projectId: string, token: string | null) {
  if (!projectId || !token) {
    return { ok: false, status: 400, message: "Missing projectId or token" };
  }

  const db = getDb();
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    return { ok: false, status: 404, message: "Project not found" };
  }

  const project = projectDoc.data() as Project;

  if (project.emailVerified) {
    return { ok: true, status: 200, message: "Email already verified" };
  }

  if (!project.emailVerificationToken) {
    return { ok: false, status: 400, message: "No verification token" };
  }

  if (project.emailVerificationToken !== token) {
    return { ok: false, status: 400, message: "Invalid token" };
  }

  if (
    project.emailVerificationExpiresAt &&
    Date.now() > project.emailVerificationExpiresAt
  ) {
    return { ok: false, status: 400, message: "Token expired" };
  }

  await projectRef.update({
    emailVerified: true,
    emailVerifiedAt: Date.now(),
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
  });

  return { ok: true, status: 200, message: "Email verified" };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, token } = body;
    const result = await verifyEmail(projectId, token);
    return NextResponse.json(
      { success: result.ok, message: result.message },
      { status: result.status },
    );
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify email" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || "";
  const token = searchParams.get("token");

  const result = await verifyEmail(projectId, token);
  const redirectUrl = new URL(clientEnv.APP_URL);
  redirectUrl.pathname = `/dashboard/${projectId}`;
  redirectUrl.searchParams.set(
    "emailVerified",
    result.ok ? "1" : "0",
  );

  return NextResponse.redirect(redirectUrl);
}

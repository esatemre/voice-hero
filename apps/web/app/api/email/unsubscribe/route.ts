import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { Project } from "@/lib/types";

async function unsubscribeEmail(projectId: string, token: string | null) {
  if (!projectId) {
    return { ok: false, status: 400, message: "Missing projectId" };
  }

  const db = getDb();
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    return { ok: false, status: 404, message: "Project not found" };
  }

  const project = projectDoc.data() as Project;

  if (project.emailUnsubscribeToken && token !== project.emailUnsubscribeToken) {
    return { ok: false, status: 400, message: "Invalid token" };
  }

  await projectRef.update({
    emailOptOut: true,
  });

  return { ok: true, status: 200, message: "Unsubscribed" };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || "";
  const token = searchParams.get("token");

  const result = await unsubscribeEmail(projectId, token);
  
  // Fallback to request origin if APP_URL is not set
  const baseUrl = clientEnv.APP_URL || new URL(request.url).origin;
  const redirectUrl = new URL(baseUrl);
  redirectUrl.pathname = `/dashboard/${projectId}`;
  redirectUrl.searchParams.set("emailOptOut", result.ok ? "1" : "0");

  return NextResponse.redirect(redirectUrl);
}

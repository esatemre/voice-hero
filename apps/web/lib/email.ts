import { serverEnv } from "@/lib/env";
import { getServerFeatureFlag } from "@/lib/server-feature-flags";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

interface Smtp2GoResponse {
  data?: {
    succeeded?: number;
    failed?: number;
    errors?: string[];
  };
}

export async function isEmailConfigured() {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return false;
  }

  const enabled = await getServerFeatureFlag("email_onboarding_enabled");
  if (!enabled) {
    return false;
  }
  return Boolean(serverEnv.SMTP2GO_API_KEY && serverEnv.SMTP2GO_SENDER);
}

export async function sendEmail(params: SendEmailParams) {
  if (!serverEnv.SMTP2GO_API_KEY || !serverEnv.SMTP2GO_SENDER) {
    throw new Error("SMTP2GO is not configured");
  }

  const payload = {
    api_key: serverEnv.SMTP2GO_API_KEY,
    to: Array.isArray(params.to) ? params.to : [params.to],
    sender: serverEnv.SMTP2GO_SENDER,
    subject: params.subject,
    html_body: params.html,
    text_body: params.text,
    reply_to: params.replyTo || serverEnv.SMTP2GO_REPLY_TO,
  };

  const response = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: Smtp2GoResponse | null = null;
  try {
    data = (await response.json()) as Smtp2GoResponse;
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data?.data?.errors?.join(", ") || "Failed to send email";
    throw new Error(errorMessage);
  }

  if (data?.data?.failed && data.data.failed > 0) {
    throw new Error("Failed to deliver onboarding email");
  }

  return data;
}

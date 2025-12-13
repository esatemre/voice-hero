import { getDb } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import {
  buildGoLiveEmail,
  buildPageDiscoveryEmail,
  buildVoiceReadyEmail,
  buildWidgetInstallHelpEmail,
  buildWelcomeEmail,
} from "@/emails/onboarding";
import { Project } from "@/lib/types";

export type OnboardingEmailType =
  | "page-discovered"
  | "voice-ready"
  | "widget-install"
  | "go-live";

const FLAG_BY_TYPE: Record<OnboardingEmailType, string> = {
  "page-discovered": "pageDiscoveryEmailSentAt",
  "voice-ready": "voiceReadyEmailSentAt",
  "widget-install": "widgetInstallEmailSentAt",
  "go-live": "goLiveEmailSentAt",
};

function buildUnsubscribeUrl(project: Project) {
  if (!project.emailUnsubscribeToken) {
    return `${clientEnv.APP_URL}/api/email/unsubscribe?projectId=${project.id}`;
  }
  return `${clientEnv.APP_URL}/api/email/unsubscribe?projectId=${project.id}&token=${project.emailUnsubscribeToken}`;
}

function buildVerifyUrl(project: Project) {
  if (!project.emailVerificationToken) {
    return `${clientEnv.APP_URL}/dashboard/${project.id}`;
  }
  return `${clientEnv.APP_URL}/api/email/verify?projectId=${project.id}&token=${project.emailVerificationToken}`;
}

function shouldSkip(project: Project) {
  if (!project.email || project.emailOptOut) {
    return true;
  }
  return false;
}

export async function sendWelcomeEmail(project: Project, projectId: string) {
  if (!(await isEmailConfigured())) {
    return { sent: false, reason: "not_configured" };
  }
  if (shouldSkip(project)) return { sent: false, reason: "missing_email" };

  const onboarding = project.onboarding || {};
  if (onboarding.welcomeEmailSentAt) {
    return { sent: false, reason: "already_sent" };
  }

  if (!project.email) {
    throw new Error("Project email is required to send onboarding email");
  }

  const unsubscribeUrl = buildUnsubscribeUrl(project);
  const verifyUrl = buildVerifyUrl(project);
  const content = buildWelcomeEmail(project, verifyUrl, unsubscribeUrl);

  await sendEmail({
    to: project.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  const db = getDb();
  await db.collection("projects").doc(projectId).update({
    "onboarding.welcomeEmailSentAt": Date.now(),
  });

  return { sent: true };
}

export async function maybeSendOnboardingEmail(
  projectId: string,
  type: OnboardingEmailType,
) {
  if (!(await isEmailConfigured())) {
    return { sent: false, reason: "not_configured" };
  }

  const db = getDb();
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    return { sent: false, reason: "missing_project" };
  }

  const project = projectDoc.data() as Project;
  if (shouldSkip(project)) return { sent: false, reason: "missing_email" };

  const flagKey = FLAG_BY_TYPE[type];
  const onboarding = project.onboarding as
    | Record<string, number | undefined>
    | undefined;
  if (onboarding && onboarding[flagKey]) {
    return { sent: false, reason: "already_sent" };
  }

  const unsubscribeUrl = buildUnsubscribeUrl(project);
  let content;

  switch (type) {
    case "page-discovered":
      content = buildPageDiscoveryEmail(project, unsubscribeUrl);
      break;
    case "voice-ready":
      content = buildVoiceReadyEmail(project, unsubscribeUrl);
      break;
    case "widget-install":
      content = buildWidgetInstallHelpEmail(project, unsubscribeUrl);
      break;
    case "go-live":
      content = buildGoLiveEmail(project, unsubscribeUrl);
      break;
    default:
      return { sent: false, reason: "unknown_type" };
  }

  await sendEmail({
    to: project.email as string,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  await projectRef.update({
    [`onboarding.${flagKey}`]: Date.now(),
  });

  return { sent: true };
}

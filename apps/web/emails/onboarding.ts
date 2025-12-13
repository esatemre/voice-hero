import { clientEnv } from "@/lib/env";
import { Project } from "@/lib/types";

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function buildFooter(unsubscribeUrl: string) {
  return {
    html: `<p style="font-size:12px;color:#6b7280;margin-top:24px;">You are receiving this email because you started a VoiceHero project. <a href="${unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a></p>`,
    text: `\nYou are receiving this email because you started a VoiceHero project.\nUnsubscribe: ${unsubscribeUrl}\n`,
  };
}

function wrapHtml(body: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      ${body}
    </div>
  `;
}

function dashboardUrl(projectId: string) {
  return `${clientEnv.APP_URL}/dashboard/${projectId}`;
}

export function buildWelcomeEmail(
  project: Project,
  verifyUrl: string,
  unsubscribeUrl: string,
): EmailContent {
  const subject = "Welcome to VoiceHero! Your setup checklist";
  const body = `
    <h2 style="margin:0 0 12px;">Welcome to VoiceHero</h2>
    <p>Hi there, thanks for creating <strong>${project.name}</strong>. Here is your quick setup checklist:</p>
    <ol>
      <li>Discover your pages</li>
      <li>Create scripts for your segments</li>
      <li>Pick a voice and generate audio</li>
      <li>Install the widget on your site</li>
    </ol>
    <p>Verify your email to get onboarding updates:</p>
    <p><a href="${verifyUrl}">Verify your email</a></p>
    <p>Open your dashboard: <a href="${dashboardUrl(project.id)}">Go to VoiceHero</a></p>
  `;
  const footer = buildFooter(unsubscribeUrl);

  return {
    subject,
    html: wrapHtml(body + footer.html),
    text:
      `Welcome to VoiceHero.\n\n` +
      `Project: ${project.name}\n` +
      `Setup checklist:\n` +
      `1) Discover your pages\n2) Create scripts\n3) Pick a voice\n4) Install the widget\n\n` +
      `Verify your email: ${verifyUrl}\n` +
      `Dashboard: ${dashboardUrl(project.id)}\n` +
      footer.text,
  };
}

export function buildPageDiscoveryEmail(
  project: Project,
  unsubscribeUrl: string,
): EmailContent {
  const subject = "Your site is connected. Next: create a script";
  const body = `
    <h2 style="margin:0 0 12px;">Pages discovered</h2>
    <p>We found your first pages for <strong>${project.name}</strong>.</p>
    <p>Next step: generate scripts for your segments so visitors hear a tailored intro.</p>
    <p>Open your dashboard: <a href="${dashboardUrl(project.id)}">Create scripts</a></p>
  `;
  const footer = buildFooter(unsubscribeUrl);

  return {
    subject,
    html: wrapHtml(body + footer.html),
    text:
      `Pages discovered for ${project.name}.\n` +
      `Next: create scripts for your segments.\n` +
      `Dashboard: ${dashboardUrl(project.id)}\n` +
      footer.text,
  };
}

export function buildVoiceReadyEmail(
  project: Project,
  unsubscribeUrl: string,
): EmailContent {
  const subject = "Your voice is ready. Time to install the widget";
  const body = `
    <h2 style="margin:0 0 12px;">Your voice is ready</h2>
    <p>You generated your first voice for <strong>${project.name}</strong>.</p>
    <p>Next: install the VoiceHero widget to go live.</p>
    <p>Open your dashboard: <a href="${dashboardUrl(project.id)}">Get the widget code</a></p>
  `;
  const footer = buildFooter(unsubscribeUrl);

  return {
    subject,
    html: wrapHtml(body + footer.html),
    text:
      `Your voice is ready for ${project.name}.\n` +
      `Install the widget to go live.\n` +
      `Dashboard: ${dashboardUrl(project.id)}\n` +
      footer.text,
  };
}

export function buildWidgetInstallHelpEmail(
  project: Project,
  unsubscribeUrl: string,
): EmailContent {
  const subject = "Need help installing the VoiceHero widget?";
  const body = `
    <h2 style="margin:0 0 12px;">Need a hand?</h2>
    <p>If you have not installed the widget yet, this quick guide can help.</p>
    <p>Open your dashboard: <a href="${dashboardUrl(project.id)}">View widget instructions</a></p>
  `;
  const footer = buildFooter(unsubscribeUrl);

  return {
    subject,
    html: wrapHtml(body + footer.html),
    text:
      `Need help installing the widget for ${project.name}?\n` +
      `Dashboard: ${dashboardUrl(project.id)}\n` +
      footer.text,
  };
}

export function buildGoLiveEmail(
  project: Project,
  unsubscribeUrl: string,
): EmailContent {
  const subject = "VoiceHero is live on your site";
  const body = `
    <h2 style="margin:0 0 12px;">You are live</h2>
    <p>Your first playback event was recorded for <strong>${project.name}</strong>.</p>
    <p>Check analytics to keep improving your scripts.</p>
    <p>Open your dashboard: <a href="${dashboardUrl(project.id)}">View analytics</a></p>
  `;
  const footer = buildFooter(unsubscribeUrl);

  return {
    subject,
    html: wrapHtml(body + footer.html),
    text:
      `VoiceHero is live for ${project.name}.\n` +
      `View analytics: ${dashboardUrl(project.id)}\n` +
      footer.text,
  };
}

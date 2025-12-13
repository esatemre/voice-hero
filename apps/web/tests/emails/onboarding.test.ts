import { describe, it, expect } from "vitest";
import {
  buildWelcomeEmail,
  buildPageDiscoveryEmail,
} from "../../emails/onboarding";
import { Project } from "../../lib/types";

const project: Project = {
  id: "proj-1",
  ownerId: "demo-user",
  name: "VoiceHero Demo",
  baseUrl: "https://example.com",
  description: "Demo",
  tone: "professional",
  language: "en-US",
  status: {
    segmentsTotal: 0,
    segmentsWithAudio: 0,
    lastVoiceGeneratedAt: null,
    pagesTotal: 0,
    pagesVoiceEnabled: 0,
    lastScrapeAt: null,
  },
  createdAt: Date.now(),
};

describe("onboarding email templates", () => {
  it("builds welcome email with verification and unsubscribe links", () => {
    const content = buildWelcomeEmail(
      project,
      "https://example.com/verify",
      "https://example.com/unsubscribe",
    );

    expect(content.subject).toContain("Welcome");
    expect(content.html).toContain("VoiceHero Demo");
    expect(content.html).toContain("https://example.com/verify");
    expect(content.html).toContain("https://example.com/unsubscribe");
  });

  it("builds page discovery email with dashboard link", () => {
    const content = buildPageDiscoveryEmail(
      project,
      "https://example.com/unsubscribe",
    );

    expect(content.subject).toContain("site is connected");
    expect(content.text).toContain("https://example.com/unsubscribe");
  });
});

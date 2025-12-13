import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendWelcomeEmail } from "../../lib/onboarding-email";
import { Project } from "../../lib/types";

const mockSendEmail = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/email", () => ({
  isEmailConfigured: async () => true,
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    collection: () => ({
      doc: () => ({
        update: mockUpdate,
      }),
    }),
  }),
}));

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends welcome email when configured", async () => {
    const project: Project = {
      id: "proj-1",
      ownerId: "demo-user",
      name: "VoiceHero Demo",
      baseUrl: "https://example.com",
      description: "Demo",
      tone: "professional",
      language: "en-US",
      email: "team@example.com",
      emailVerificationToken: "token-123",
      emailUnsubscribeToken: "unsub-123",
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

    const result = await sendWelcomeEmail(project, "proj-1");

    expect(result.sent).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        "onboarding.welcomeEmailSentAt": expect.any(Number),
      }),
    );
  });
});

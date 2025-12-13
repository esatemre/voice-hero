import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/onboarding/widget-viewed/route";

const mockMaybeSend = vi.fn();

vi.mock("@/lib/onboarding-email", () => ({
  maybeSendOnboardingEmail: (...args: unknown[]) => mockMaybeSend(...args),
}));

describe("POST /api/onboarding/widget-viewed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks widget view for project", async () => {
    const request = new Request("http://localhost/api/onboarding/widget-viewed", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockMaybeSend).toHaveBeenCalledWith("proj-1", "widget-install");
  });
});

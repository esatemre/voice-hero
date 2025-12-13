import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "../../app/api/email/verify/route";

const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockDoc = vi.fn(() => ({
  get: mockGet,
  update: mockUpdate,
}));
const mockCollection = vi.fn(() => ({
  doc: mockDoc,
}));

const mockFirestore = {
  collection: mockCollection,
};

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockFirestore),
}));

describe("POST /api/email/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies email with valid token", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        emailVerificationToken: "token-123",
        emailVerificationExpiresAt: Date.now() + 10000,
      }),
    });

    const request = new Request("http://localhost/api/email/verify", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", token: "token-123" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerified: true,
      }),
    );
  });

  it("rejects invalid token", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        emailVerificationToken: "token-123",
        emailVerificationExpiresAt: Date.now() + 10000,
      }),
    });

    const request = new Request("http://localhost/api/email/verify", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", token: "bad-token" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

describe("GET /api/email/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects after verification", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        emailVerificationToken: "token-123",
        emailVerificationExpiresAt: Date.now() + 10000,
      }),
    });

    const request = new Request(
      "http://localhost/api/email/verify?projectId=proj-1&token=token-123",
    );

    const response = await GET(request as unknown as Request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location") || "";
    expect(location).toContain("/dashboard/proj-1");
    expect(location).toContain("emailVerified=1");
  });
});

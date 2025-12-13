import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../app/api/email/unsubscribe/route";

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

describe("GET /api/email/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes with valid token", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        emailUnsubscribeToken: "token-123",
      }),
    });

    const request = new Request(
      "http://localhost/api/email/unsubscribe?projectId=proj-1&token=token-123",
    );

    const response = await GET(request as unknown as Request);

    expect(response.status).toBe(307);
    expect(mockUpdate).toHaveBeenCalledWith({ emailOptOut: true });
    const location = response.headers.get("location") || "";
    expect(location).toContain("/dashboard/proj-1");
    expect(location).toContain("emailOptOut=1");
  });
});

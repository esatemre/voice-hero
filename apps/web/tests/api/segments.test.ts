import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/projects/[projectId]/segments/route";
import { Segment } from "../../lib/types";

// Mock the db module
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockProjectId = "test-project-id";

const mockSet = vi.fn().mockResolvedValue(undefined);

// Mock for subcollection document
const mockSegmentDoc = vi.fn(() => ({
  id: "mock-segment-id",
  set: mockSet,
}));

const mockSegmentsGet = vi.fn().mockResolvedValue({
  docs: [],
});
const mockSegmentsCollection = {
  doc: mockSegmentDoc,
  get: mockSegmentsGet,
};

// Mock for project document
const mockProjectUpdate = vi.fn().mockResolvedValue(undefined);
const mockProjectCollection = vi.fn(() => mockSegmentsCollection);
const mockProjectDoc = vi.fn(() => ({
  collection: mockProjectCollection,
  update: mockProjectUpdate,
}));

// Mock for projects collection
const mockProjectsCollection = vi.fn(() => ({
  doc: mockProjectDoc,
}));

const mockBatch = vi.fn(() => ({
  set: mockBatchSet,
  commit: mockBatchCommit,
}));

const mockFirestore = {
  collection: mockProjectsCollection,
  batch: mockBatch,
};

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockFirestore),
}));

describe("POST /api/projects/[projectId]/segments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create default segments for a project", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);

    // Verify all segments have correct structure
    const segments = data as Segment[];

    segments.forEach((segment) => {
      expect(segment).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          projectId: mockProjectId,
          type: expect.any(String),
          scriptContent: expect.any(String),
          createdAt: expect.any(Number),
        }),
      );
    });

    // Verify correct collections were accessed
    expect(mockProjectsCollection).toHaveBeenCalledWith("projects");
    expect(mockProjectDoc).toHaveBeenCalledWith(mockProjectId);
    expect(mockProjectCollection).toHaveBeenCalledWith("segments");

    // Verify batch operations
    expect(mockBatch).toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledTimes(3); // 3 default segments
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it("should create segments with correct types", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    const segments = data as Segment[];
    const types = segments.map((segment) => segment.type);
    expect(types).toContain("new_visitor");
    expect(types).toContain("returning_visitor");
    expect(types).toContain("utm_source");
  });

  it("should handle errors gracefully", async () => {
    mockBatchCommit.mockRejectedValueOnce(new Error("Database error"));

    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to create segments" });
  });

  it("should create a custom utm_source segment with condition value", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "utm_source",
          conditionValue: "meta_ads",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("utm_source");
    expect(data.conditionValue).toBe("meta_ads");
    expect(data.scriptContent).toBe("");
    expect(data.projectId).toBe(mockProjectId);
  });

  it("should create a custom geo segment with condition value", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "geo",
          conditionValue: "US",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("geo");
    expect(data.conditionValue).toBe("US");
  });

  it("should create a custom language segment with condition value", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "language",
          conditionValue: "es",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe("language");
    expect(data.conditionValue).toBe("es");
  });

  it("should reject utm_source segment without condition value", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "utm_source",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("conditionValue");
  });

  it("should reject geo segment without condition value", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "geo",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("conditionValue");
  });

  it("should reject language segment without condition value", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "language",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("conditionValue");
  });

  it("should reject invalid segment type", async () => {
    const request = new Request(
      `http://localhost/api/projects/${mockProjectId}/segments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invalid_type",
        }),
      },
    );

    const params = Promise.resolve({ projectId: mockProjectId });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid segment type");
  });
});

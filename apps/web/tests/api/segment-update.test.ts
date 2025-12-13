import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PUT,
  DELETE,
} from "../../app/api/projects/[projectId]/segments/[segmentId]/route";

const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockProjectUpdate = vi.fn().mockResolvedValue(undefined);
const mockSegmentDoc = vi.fn(() => ({
  update: mockUpdate,
  delete: mockDelete,
}));

const mockSegmentsGet = vi.fn().mockResolvedValue({
  docs: [],
});
const mockSegmentsCollection = vi.fn(() => ({
  doc: mockSegmentDoc,
  get: mockSegmentsGet,
}));
const mockProjectDoc = vi.fn(() => ({
  collection: mockSegmentsCollection,
  update: mockProjectUpdate,
}));
const mockProjectsCollection = vi.fn(() => ({
  doc: mockProjectDoc,
}));

const mockFirestore = {
  collection: mockProjectsCollection,
};

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockFirestore),
}));

describe("PUT /api/projects/[projectId]/segments/[segmentId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update segment script content", async () => {
    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "PUT",
        body: JSON.stringify({ scriptContent: "Updated script" }),
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "seg-1", scriptContent: "Updated script" });
    expect(mockProjectsCollection).toHaveBeenCalledWith("projects");
    expect(mockProjectDoc).toHaveBeenCalledWith("proj-1");
    expect(mockSegmentsCollection).toHaveBeenCalledWith("segments");
    expect(mockSegmentDoc).toHaveBeenCalledWith("seg-1");
    expect(mockUpdate).toHaveBeenCalledWith({
      scriptContent: "Updated script",
    });
  });

  it("should require script content", async () => {
    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "PUT",
        body: JSON.stringify({ scriptContent: "" }),
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should update segment voice selection", async () => {
    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "PUT",
        body: JSON.stringify({ voiceId: "voice-123" }),
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "seg-1", voiceId: "voice-123" });
    expect(mockUpdate).toHaveBeenCalledWith({ voiceId: "voice-123" });
  });

  it("should handle errors", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("Update failed"));

    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "PUT",
        body: JSON.stringify({ scriptContent: "Updated script" }),
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it("should save snapshot reference when provided", async () => {
    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "PUT",
        body: JSON.stringify({
          scriptContent: "Updated script",
          lastContentSnapshotId: "snapshot-123",
          lastContentHash: "hash-abc",
        }),
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lastContentSnapshotId).toBe("snapshot-123");
    expect(data.lastContentHash).toBe("hash-abc");
    expect(mockUpdate).toHaveBeenCalledWith({
      scriptContent: "Updated script",
      lastContentSnapshotId: "snapshot-123",
      lastContentHash: "hash-abc",
    });
  });
});

describe("DELETE /api/projects/[projectId]/segments/[segmentId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a segment successfully", async () => {
    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "DELETE",
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "seg-1", deleted: true });
    expect(mockProjectsCollection).toHaveBeenCalledWith("projects");
    expect(mockProjectDoc).toHaveBeenCalledWith("proj-1");
    expect(mockSegmentsCollection).toHaveBeenCalledWith("segments");
    expect(mockSegmentDoc).toHaveBeenCalledWith("seg-1");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("should handle delete errors", async () => {
    mockDelete.mockRejectedValueOnce(new Error("Delete failed"));

    const request = new Request(
      "http://localhost/api/projects/proj-1/segments/seg-1",
      {
        method: "DELETE",
      },
    );

    const params = Promise.resolve({ projectId: "proj-1", segmentId: "seg-1" });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

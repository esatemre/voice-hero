import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "../../app/api/projects/route";

// Mock the db module
const mockSet = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockDocId = "mock-doc-id";

// Mock for subcollection
const mockSubCollectionDoc = vi.fn(() => ({
  id: "mock-segment-id",
}));

const mockSubCollection = vi.fn(() => ({
  doc: mockSubCollectionDoc,
}));

const mockDoc = vi.fn(() => ({
  id: mockDocId,
  set: mockSet,
  collection: mockSubCollection, // Support subcollections
}));

const mockCollection = vi.fn(() => ({
  doc: mockDoc,
}));

const mockBatch = vi.fn(() => ({
  set: mockBatchSet,
  commit: mockBatchCommit,
}));

const mockFirestore = {
  collection: mockCollection,
  batch: mockBatch,
};

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockFirestore),
}));

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a project and default segments", async () => {
    const body = {
      name: "Test Project",
      baseUrl: "http://example.com",
      description: "A test project",
      tone: "friendly",
      language: "en",
      email: "team@example.com",
      aiSummary: "Summary",
      aiDetails: "Details",
    };

    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        id: mockDocId,
        name: body.name,
        email: body.email,
        ownerId: "demo-user",
        status: {
          segmentsTotal: 0,
          segmentsWithAudio: 0,
          lastVoiceGeneratedAt: null,
          pagesTotal: 0,
          pagesVoiceEnabled: 0,
          lastScrapeAt: null,
        },
      }),
    );

    // Verify Project creation
    expect(mockCollection).toHaveBeenCalledWith("projects");
    expect(mockDoc).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: body.name,
        id: mockDocId,
        email: body.email,
        status: {
          segmentsTotal: 0,
          segmentsWithAudio: 0,
          lastVoiceGeneratedAt: null,
          pagesTotal: 0,
          pagesVoiceEnabled: 0,
          lastScrapeAt: null,
        },
      }),
    );

    // Verify Segments created in project subcollection
    expect(mockSubCollection).toHaveBeenCalledWith("segments");
    expect(mockBatch).toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledTimes(3); // 3 default segments
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    mockSet.mockRejectedValueOnce(new Error("Database error"));

    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Project",
        baseUrl: "http://example.com",
        description: "Test",
        tone: "professional",
        language: "en-US",
        email: "owner@example.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to create project" });
  });

  it("should return 400 for missing email", async () => {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Project",
        baseUrl: "http://example.com",
        description: "Test",
        tone: "professional",
        language: "en-US",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Valid email is required");
  });
});

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return projects with status including pages", async () => {
    const mockProjects = [
      {
        id: "project-1",
        name: "Test Project 1",
        ownerId: "demo-user",
        baseUrl: "http://example.com",
        description: "A test project",
        tone: "professional" as const,
        language: "en-US",
        status: {
          segmentsTotal: 3,
          segmentsWithAudio: 2,
          lastVoiceGeneratedAt: 1234567890,
          pagesTotal: 0,
          pagesVoiceEnabled: 0,
          lastScrapeAt: null,
        },
        createdAt: 1234567890,
      },
      {
        id: "project-2",
        name: "Test Project 2",
        ownerId: "demo-user",
        baseUrl: "http://example2.com",
        description: "Another test project",
        tone: "casual" as const,
        language: "en-US",
        status: {
          segmentsTotal: 0,
          segmentsWithAudio: 0,
          lastVoiceGeneratedAt: null,
          pagesTotal: 0,
          pagesVoiceEnabled: 0,
          lastScrapeAt: null,
        },
        createdAt: 1234567891,
      },
    ];

    const mockDoc1 = {
      data: () => mockProjects[0],
    };
    const mockDoc2 = {
      data: () => mockProjects[1],
    };

    const mockSegmentsDoc = {
      data: () => ({
        id: "seg-1",
        projectId: "project-1",
        type: "new_visitor",
        scriptContent: "Test",
        audioUrl: "http://example.com/audio.mp3",
        createdAt: 1234567890,
      }),
    };

    const mockPageDoc = {
      data: () => ({
        id: "page-1",
        projectId: "project-1",
        url: "http://example.com/page1",
        path: "/page1",
        title: "Page 1",
        status: "scraped",
        lastScrapedAt: 1234567890,
        voiceEnabled: true,
        lastContentHash: "hash123",
      }),
    };

    let collectionName = "";
    mockCollection.mockImplementation((name: string) => {
      collectionName = name;
      if (name === "projects") {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [mockDoc1, mockDoc2],
          }),
          doc: mockDoc,
        };
      }
    });

    mockSubCollection.mockImplementation((name: string) => {
      if (name === "segments") {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [mockSegmentsDoc],
          }),
        };
      } else if (name === "pages") {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [mockPageDoc],
          }),
        };
      }
      return {};
    });

    mockDoc.mockImplementation(() => ({
      id: mockDocId,
      set: mockSet,
      collection: mockSubCollection,
    }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      id: "project-1",
      name: "Test Project 1",
      status: {
        segmentsTotal: 1,
        segmentsWithAudio: 1,
        lastVoiceGeneratedAt: 1234567890,
        pagesTotal: 1,
        pagesVoiceEnabled: 1,
        lastScrapeAt: 1234567890,
      },
    });
  });

  it("should compute page status aggregation", async () => {
    const mockProject = {
      id: "project-1",
      name: "Multi-page Project",
      ownerId: "demo-user",
      baseUrl: "http://example.com",
      description: "Project with multiple pages",
      tone: "professional" as const,
      language: "en-US",
      status: {
        segmentsTotal: 0,
        segmentsWithAudio: 0,
        lastVoiceGeneratedAt: null,
        pagesTotal: 0,
        pagesVoiceEnabled: 0,
        lastScrapeAt: null,
      },
      createdAt: 1234567890,
    };

    const mockProjectDoc = {
      data: () => mockProject,
    };

    const mockPage1 = {
      data: () => ({
        id: "page-1",
        projectId: "project-1",
        url: "http://example.com/page1",
        path: "/page1",
        title: "Page 1",
        status: "scraped",
        lastScrapedAt: 1234567890,
        voiceEnabled: true,
        lastContentHash: "hash1",
      }),
    };

    const mockPage2 = {
      data: () => ({
        id: "page-2",
        projectId: "project-1",
        url: "http://example.com/page2",
        path: "/page2",
        title: "Page 2",
        status: "scraped",
        lastScrapedAt: 1234567891,
        voiceEnabled: false,
        lastContentHash: "hash2",
      }),
    };

    let isProjectCollection = false;
    mockCollection.mockImplementation((name: string) => {
      isProjectCollection = name === "projects";
      if (isProjectCollection) {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [mockProjectDoc],
          }),
          doc: vi.fn(() => ({
            id: "project-1",
            collection: mockSubCollection,
          })),
        };
      }
    });

    mockSubCollection.mockImplementation((name: string) => {
      if (name === "segments") {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [],
          }),
        };
      } else if (name === "pages") {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [mockPage1, mockPage2],
          }),
        };
      }
      return {};
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0]).toMatchObject({
      id: "project-1",
      status: {
        segmentsTotal: 0,
        segmentsWithAudio: 0,
        lastVoiceGeneratedAt: null,
        pagesTotal: 2,
        pagesVoiceEnabled: 1,
        lastScrapeAt: 1234567891,
      },
    });
  });

  it("should handle errors gracefully", async () => {
    mockCollection.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error("Database error")),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch projects" });
  });
});

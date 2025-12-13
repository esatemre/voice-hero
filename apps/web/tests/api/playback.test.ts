import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../app/api/playback/route";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "@/lib/db";

describe("GET /api/playback", () => {
  const mockGet = vi.fn();

  // Setup mock chain: db.collection().doc().collection().get()
  const mockSegmentsRef = { get: mockGet };
  const mockProjectRef = { collection: vi.fn(() => mockSegmentsRef) };
  const mockProjectsCollection = { doc: vi.fn(() => mockProjectRef) };
  const mockFirestore = { collection: vi.fn(() => mockProjectsCollection) };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getDb as any).mockReturnValue(mockFirestore);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockSegments = (segments: any[]) => ({
    empty: segments.length === 0,
    docs: segments.map((s) => ({ data: () => s })),
  });

  it("should select UTM source segment", async () => {
    const segments = [
      { id: "seg-1", type: "new_visitor", audioUrl: "default.mp3" },
      {
        id: "seg-2",
        type: "utm_source",
        conditionValue: "ads",
        audioUrl: "ads.mp3",
      },
    ];
    mockGet.mockResolvedValue(createMockSegments(segments));

    const request = new Request(
      "http://localhost/api/playback?siteId=123&utmSource=ads",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.audioUrl).toBe("ads.mp3");
    expect(data.segmentId).toBe("seg-2");
    expect(data.segmentType).toBe("utm_source");
  });

  it("should select returning visitor segment", async () => {
    const segments = [
      { id: "seg-1", type: "new_visitor", audioUrl: "default.mp3" },
      { id: "seg-2", type: "returning_visitor", audioUrl: "returning.mp3" },
    ];
    mockGet.mockResolvedValue(createMockSegments(segments));

    const request = new Request(
      "http://localhost/api/playback?siteId=123&isReturning=true",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.audioUrl).toBe("returning.mp3");
    expect(data.segmentId).toBe("seg-2");
    expect(data.segmentType).toBe("returning_visitor");
  });

  it("should select language segment", async () => {
    const segments = [
      { id: "seg-1", type: "new_visitor", audioUrl: "default.mp3" },
      {
        id: "seg-3",
        type: "language",
        conditionValue: "es",
        audioUrl: "spanish.mp3",
      },
    ];
    mockGet.mockResolvedValue(createMockSegments(segments));

    const request = new Request(
      "http://localhost/api/playback?siteId=123&lang=es-ES",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.audioUrl).toBe("spanish.mp3");
    expect(data.segmentId).toBe("seg-3");
    expect(data.segmentType).toBe("language");
  });

  it("should fallback to new visitor", async () => {
    const segments = [
      { id: "seg-1", type: "new_visitor", audioUrl: "default.mp3" },
      { id: "seg-2", type: "returning_visitor", audioUrl: "returning.mp3" },
    ];
    mockGet.mockResolvedValue(createMockSegments(segments));

    const request = new Request("http://localhost/api/playback?siteId=123");
    const response = await GET(request);
    const data = await response.json();

    expect(data.audioUrl).toBe("default.mp3");
    expect(data.segmentId).toBe("seg-1");
    expect(data.segmentType).toBe("new_visitor");
  });

  it("should return 404 if no audio", async () => {
    const segments = [
      { type: "new_visitor" }, // No audioUrl
    ];
    mockGet.mockResolvedValue(createMockSegments(segments));

    const request = new Request("http://localhost/api/playback?siteId=123");
    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  it("should return voiceDisabled when page has voiceEnabled=false", async () => {
    const segments = [{ type: "new_visitor", audioUrl: "default.mp3" }];
    mockGet.mockResolvedValue(createMockSegments(segments));

    // Mock page lookup
    const mockPageGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ voiceEnabled: false }) }],
    });
    mockProjectRef.collection.mockImplementation((name: string) => {
      if (name === "pages") {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockPageGet,
            })),
          })),
        };
      }
      return mockSegmentsRef;
    });

    const request = new Request(
      "http://localhost/api/playback?siteId=123&pageUrl=https://example.com/disabled",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.voiceDisabled).toBe(true);
  });

  it("should return audio when page has voiceEnabled=true", async () => {
    const segments = [
      { id: "seg-1", type: "new_visitor", audioUrl: "default.mp3" },
    ];
    mockGet.mockResolvedValue(createMockSegments(segments));

    // Mock page lookup with empty page segments (fallback to project)
    const mockPageSegmentsGet = vi.fn().mockResolvedValue({
      empty: true,
      docs: [],
    });
    const mockPageDoc = {
      id: "page-123",
      collection: vi.fn(() => ({ get: mockPageSegmentsGet })),
    };
    const mockPageGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ voiceEnabled: true, id: "page-123" }), ref: mockPageDoc }],
    });
    mockProjectRef.collection.mockImplementation((name: string) => {
      if (name === "pages") {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockPageGet,
            })),
          })),
          doc: vi.fn(() => mockPageDoc),
        };
      }
      return mockSegmentsRef;
    });

    const request = new Request(
      "http://localhost/api/playback?siteId=123&pageUrl=https://example.com/enabled",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audioUrl).toBe("default.mp3");
    expect(data.segmentId).toBe("seg-1");
    expect(data.segmentType).toBe("new_visitor");
    expect(data.voiceDisabled).toBeUndefined();
  });

  it("should return audio when page not found (default behavior)", async () => {
    const segments = [{ id: "seg-1", type: "new_visitor", audioUrl: "default.mp3" }];
    mockGet.mockResolvedValue(createMockSegments(segments));

    // Mock page lookup returns empty (no page record)
    const mockPageGet = vi.fn().mockResolvedValue({
      empty: true,
      docs: [],
    });
    mockProjectRef.collection.mockImplementation((name: string) => {
      if (name === "pages") {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockPageGet,
            })),
          })),
        };
      }
      return mockSegmentsRef;
    });

    const request = new Request(
      "http://localhost/api/playback?siteId=123&pageUrl=https://example.com/unknown",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audioUrl).toBe("default.mp3");
    expect(data.segmentId).toBe("seg-1");
    expect(data.segmentType).toBe("new_visitor");
  });

  it("should use page-specific segment when available", async () => {
    const projectSegments = [
      {
        id: "proj-seg-1",
        type: "new_visitor",
        audioUrl: "project-default.mp3",
        scriptContent: "Project welcome",
      },
    ];
    const pageSegments = [
      {
        id: "page-seg-1",
        type: "new_visitor",
        audioUrl: "page-specific.mp3",
        scriptContent: "Page welcome",
      },
    ];

    // Mock page lookup with page doc reference for segments
    const mockPageSegmentsGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: pageSegments.map((s) => ({ data: () => s })),
    });
    const mockPageDoc = {
      id: "page-123",
      collection: vi.fn(() => ({ get: mockPageSegmentsGet })),
    };
    const mockPageGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [
        {
          data: () => ({ voiceEnabled: true, id: "page-123" }),
          ref: mockPageDoc,
        },
      ],
    });

    mockProjectRef.collection.mockImplementation((name: string) => {
      if (name === "pages") {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockPageGet,
            })),
          })),
          doc: vi.fn(() => mockPageDoc),
        };
      }
      return {
        get: vi.fn().mockResolvedValue(createMockSegments(projectSegments)),
      };
    });

    const request = new Request(
      "http://localhost/api/playback?siteId=123&pageUrl=https://example.com/specific",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audioUrl).toBe("page-specific.mp3");
    expect(data.segmentId).toBe("page-seg-1");
    expect(data.segmentType).toBe("new_visitor");
  });

  it("should fallback to project segment when page has no matching segment", async () => {
    const projectSegments = [
      {
        id: "proj-seg-1",
        type: "new_visitor",
        audioUrl: "project-default.mp3",
        scriptContent: "Project welcome",
      },
    ];

    // Mock page lookup with empty page segments
    const mockPageSegmentsGet = vi.fn().mockResolvedValue({
      empty: true,
      docs: [],
    });
    const mockPageDoc = {
      id: "page-123",
      collection: vi.fn(() => ({ get: mockPageSegmentsGet })),
    };
    const mockPageGet = vi.fn().mockResolvedValue({
      empty: false,
      docs: [
        {
          data: () => ({ voiceEnabled: true, id: "page-123" }),
          ref: mockPageDoc,
        },
      ],
    });

    mockGet.mockResolvedValue(createMockSegments(projectSegments));

    mockProjectRef.collection.mockImplementation((name: string) => {
      if (name === "pages") {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockPageGet,
            })),
          })),
          doc: vi.fn(() => mockPageDoc),
        };
      }
      return { get: mockGet };
    });

    const request = new Request(
      "http://localhost/api/playback?siteId=123&pageUrl=https://example.com/fallback",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audioUrl).toBe("project-default.mp3");
    expect(data.segmentId).toBe("proj-seg-1");
    expect(data.segmentType).toBe("new_visitor");
  });
});

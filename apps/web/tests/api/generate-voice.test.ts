import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/generate-voice/route";

// Mock dependencies
vi.mock("@/lib/elevenlabs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/elevenlabs")>();
  return {
    ...actual,
    generateVoice: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  return {
    ...actual,
    saveAudioFile: vi.fn(),
    verifyStorageAccess: vi.fn(),
  };
});

import { ElevenLabsError, generateVoice } from "@/lib/elevenlabs";
import { getDb } from "@/lib/db";
import { saveAudioFile, verifyStorageAccess } from "@/lib/storage";

describe("POST /api/generate-voice", () => {
  const mockUpdate = vi.fn();

  // Create a recursive mock structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDocObj: any = {
    update: mockUpdate,
  };

  // Mock for segments collection (returned by doc().collection('segments'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockSegmentsCollection: any = {
    doc: vi.fn(() => mockDocObj),
    get: vi.fn().mockResolvedValue({
      docs: [],
    }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockCollectionObj: any = {
    doc: vi.fn(() => mockDocObj),
  };

  // Allow chaining: doc().collection()
  mockDocObj.collection = vi.fn(() => mockSegmentsCollection);

  const mockFirestore = { collection: vi.fn(() => mockCollectionObj) };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getDb as any).mockReturnValue(mockFirestore);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (verifyStorageAccess as any).mockResolvedValue(undefined);
  });

  it("should generate voice, save file, and update db", async () => {
    const mockBuffer = new ArrayBuffer(8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (generateVoice as any).mockResolvedValue(mockBuffer);

    // Mock Storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (saveAudioFile as any).mockResolvedValue(
      "https://storage.googleapis.com/test-bucket/audio/test.mp3",
    );

    const request = new Request("http://localhost/api/generate-voice", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello",
        voiceId: "voice-123",
        projectId: "proj-1",
        segmentId: "seg-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audioUrl).toBe(
      "https://storage.googleapis.com/test-bucket/audio/test.mp3",
    );

    // Verify Voice Generationbs call
    expect(generateVoice).toHaveBeenCalledWith("Hello", "voice-123");

    // Verify Storage call
    expect(saveAudioFile).toHaveBeenCalledWith(
      mockBuffer,
      expect.stringContaining("proj-1-seg-1"),
    );

    // Verify DB updates
    // First: Update segment with audioUrl
    expect(mockFirestore.collection).toHaveBeenCalledWith("projects");
    expect(mockCollectionObj.doc).toHaveBeenCalledWith("proj-1");
    expect(mockDocObj.collection).toHaveBeenCalledWith("segments");
    expect(mockSegmentsCollection.doc).toHaveBeenCalledWith("seg-1");
    expect(mockUpdate).toHaveBeenNthCalledWith(1, {
      audioUrl: "https://storage.googleapis.com/test-bucket/audio/test.mp3",
      voiceId: "voice-123",
    });

    // Second: Update project status
    expect(mockFirestore.collection).toHaveBeenCalledTimes(3); // Twice for update, once for status check
    expect(mockCollectionObj.doc).toHaveBeenCalledTimes(3);
    expect(mockDocObj.collection).toHaveBeenCalledTimes(2);
    expect(mockSegmentsCollection.get).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenNthCalledWith(2, {
      "status.segmentsTotal": 0,
      "status.segmentsWithAudio": 0,
      "status.lastVoiceGeneratedAt": null,
    });
  });

  it("should return invalid api key error details", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (generateVoice as any).mockRejectedValue(
      new ElevenLabsError("Invalid api key", { statusCode: 401 }),
    );

    const request = new Request("http://localhost/api/generate-voice", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello",
        voiceId: "voice-123",
        projectId: "proj-1",
        segmentId: "seg-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("invalid_api_key");
    expect(data.error).toBeDefined();
  });

  it("should return model deprecation guidance", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (generateVoice as any).mockRejectedValue(
      new ElevenLabsError("Model deprecated", { statusCode: 400 }),
    );

    const request = new Request("http://localhost/api/generate-voice", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello",
        voiceId: "voice-123",
        projectId: "proj-1",
        segmentId: "seg-1",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("model_deprecated");
    expect(data.error).toContain("eleven_turbo_v2_5");
  });
});

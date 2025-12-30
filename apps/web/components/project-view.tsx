"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Project,
  ScriptOptions,
  Segment,
  VoiceProfile,
} from "@/lib/types";
import { clientEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  MessageSquareText,
  Play,
  Loader2,
  Wand2,
  Plus,
  Trash2,
} from "lucide-react";

import AnalyticsView from "@/components/analytics-view";
import PagesView from "@/components/pages-view";
import PageSegmentsView from "@/components/page-segments-view";
import ContentChangeBanner from "@/components/content-change-banner";
import VoiceProfilesView from "@/components/voice-profiles-view";
import ScriptWizard from "@/components/script-wizard";
import ScriptCritiquePanel from "@/components/script-critique-panel";
import VisitorSimulator from "@/components/visitor-simulator";
import InteractionsView from "@/components/interactions-view";

import ProjectSettingsDialog from "@/components/project-settings-dialog";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const DEFAULT_VOICE_LABEL = "Default (Rachel)";

interface ProjectViewProps {
  project: Project;
  initialSegments: Segment[];
}

export default function ProjectView({
  project: initialProject,
  initialSegments,
}: ProjectViewProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [initializing, setInitializing] = useState(false);
  const [segmentErrors, setSegmentErrors] = useState<Record<string, string>>(
    {},
  );
  const [voiceErrors, setVoiceErrors] = useState<Record<string, string>>({});
  const [savingScripts, setSavingScripts] = useState<Record<string, boolean>>(
    {},
  );
  const [voiceSaving, setVoiceSaving] = useState<Record<string, boolean>>({});
  const [scriptErrors, setScriptErrors] = useState<Record<string, string>>({});
  const [latestContentHash, setLatestContentHash] = useState<string | null>(
    null,
  );
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState("");
  const [scriptWizardOpen, setScriptWizardOpen] = useState(false);
  const [scriptWizardSegment, setScriptWizardSegment] = useState<Segment | null>(
    null,
  );
  const [critiqueOpen, setCritiqueOpen] = useState(false);
  const [critiqueSegment, setCritiqueSegment] = useState<Segment | null>(null);
  const [addSegmentDialogOpen, setAddSegmentDialogOpen] = useState(false);
  const [newSegmentType, setNewSegmentType] = useState<
    "new_visitor" | "returning_visitor" | "utm_source" | "geo" | "language"
  >("new_visitor");
  const [newSegmentCondition, setNewSegmentCondition] = useState("");
  const [addSegmentLoading, setAddSegmentLoading] = useState(false);
  const [addSegmentError, setAddSegmentError] = useState("");
  const [deletingSegments, setDeletingSegments] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState("segments");
  const [integrationViewed, setIntegrationViewed] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLatestContentHash();
    fetchPages();
    fetchVoices();
  }, []);

  const fetchLatestContentHash = async () => {
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/pages`);
      if (res.ok) {
        const pages: Page[] = await res.json();
        const scrapedPages = pages.filter((p) => p.lastContentHash);
        if (scrapedPages.length > 0) {
          const mostRecent = scrapedPages.sort(
            (a, b) => (b.lastScrapedAt || 0) - (a.lastScrapedAt || 0),
          )[0];
          setLatestContentHash(mostRecent.lastContentHash);
        }
      }
    } catch (e) {
      console.error("Failed to fetch pages for content hash:", e);
    }
  };

  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/pages`);
      if (!res.ok) throw new Error("Failed to fetch pages");
      const data: Page[] = await res.json();
      setPages(data);
    } catch (e) {
      console.error("Failed to fetch pages:", e);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchVoices = async () => {
    setVoicesLoading(true);
    setVoicesError("");
    try {
      const res = await fetch("/api/voices");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch voices");
      }
      setVoices(data?.voices || []);
    } catch (error: unknown) {
      console.error("Failed to fetch voices:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch voices";
      setVoicesError(message);
    } finally {
      setVoicesLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "integration" && !integrationViewed) {
      setIntegrationViewed(true);
      void fetch("/api/onboarding/widget-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
    }
  };

  const shouldShowContentBanner = (segment: Segment) => {
    if (!latestContentHash) return false;
    if (!segment.scriptContent) return false;
    if (!segment.lastContentHash) return true;
    return segment.lastContentHash !== latestContentHash;
  };

  const [savedScripts, setSavedScripts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialSegments.map((segment) => [
        segment.id,
        segment.scriptContent || "",
      ]),
    ),
  );

  // Helper to update local state
  const updateSegment = (segmentId: string, updates: Partial<Segment>) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, ...updates } : s)),
    );
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleInitializeDefaults = async () => {
    setInitializing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/segments`, {
        method: "POST",
      });
      if (res.ok) {
        const newSegments = await res.json();
        setSegments(newSegments);
        setSavedScripts(
          Object.fromEntries(
            newSegments.map((segment: Segment) => [
              segment.id,
              segment.scriptContent || "",
            ]),
          ),
        );
      }
    } catch (error) {
      console.error("Error initializing segments:", error);
    } finally {
      setInitializing(false);
    }
  };

  const handleGenerateScript = (segment: Segment) => {
    setSegmentErrors((prev) => ({ ...prev, [segment.id]: "" }));
    setScriptErrors((prev) => ({ ...prev, [segment.id]: "" }));
    setScriptWizardSegment(segment);
    setScriptWizardOpen(true);
  };

  const handleOpenCritique = (segment: Segment) => {
    setCritiqueSegment(segment);
    setCritiqueOpen(true);
  };

  const handleGenerateVoice = async (segment: Segment) => {
    if (!segment.scriptContent) return;
    setLoading((prev) => ({ ...prev, [segment.id]: true }));
    setSegmentErrors((prev) => ({ ...prev, [segment.id]: "" }));
    try {
      const voiceId = segment.voiceId || DEFAULT_VOICE_ID;
      const res = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: segment.scriptContent,
          projectId: project.id,
          segmentId: segment.id,
          voiceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSegmentErrors((prev) => ({
          ...prev,
          [segment.id]: data?.error || "Failed to generate voice.",
        }));
        return;
      }
      if (data.audioUrl) {
        updateSegment(segment.id, { audioUrl: data.audioUrl });
        setSegmentErrors((prev) => ({ ...prev, [segment.id]: "" }));
      }
    } catch (error) {
      console.error("Error generating voice:", error);
      setSegmentErrors((prev) => ({
        ...prev,
        [segment.id]: "Failed to generate voice. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [segment.id]: false }));
    }
  };

  const handleVoiceChange = async (segment: Segment, voiceId: string) => {
    setVoiceSaving((prev) => ({ ...prev, [segment.id]: true }));
    setVoiceErrors((prev) => ({ ...prev, [segment.id]: "" }));
    try {
      const res = await fetch(
        `/api/projects/${project.id}/segments/${segment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceId }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setVoiceErrors((prev) => ({
          ...prev,
          [segment.id]: data?.error || "Failed to save voice selection.",
        }));
        return;
      }
      updateSegment(segment.id, { voiceId: data.voiceId || voiceId });
    } catch (error) {
      console.error("Error saving voice selection:", error);
      setVoiceErrors((prev) => ({
        ...prev,
        [segment.id]: "Failed to save voice selection. Please try again.",
      }));
    } finally {
      setVoiceSaving((prev) => ({ ...prev, [segment.id]: false }));
    }
  };

  const handleApplyScript = (segmentId: string, script: string) => {
    updateSegment(segmentId, {
      scriptContent: script,
      lastContentHash: latestContentHash || undefined,
    });
    setSegmentErrors((prev) => ({ ...prev, [segmentId]: "" }));
    setScriptErrors((prev) => ({ ...prev, [segmentId]: "" }));
  };

  const saveScriptDefaults = async (options: ScriptOptions) => {
    const payload = {
      name: project.name,
      baseUrl: project.baseUrl,
      description: project.description,
      tone: project.tone,
      language: project.language,
      aiSummary: project.aiSummary ?? "",
      aiDetails: project.aiDetails ?? "",
      scriptDefaults: options,
    };

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to save defaults.");
    }
    setProject((prev) => ({ ...prev, scriptDefaults: options }));
  };

  const handleSaveScript = async (segment: Segment) => {
    if (!segment.scriptContent) return;
    const confirmed = window.confirm("Save script changes?");
    if (!confirmed) return;
    setSavingScripts((prev) => ({ ...prev, [segment.id]: true }));
    setScriptErrors((prev) => ({ ...prev, [segment.id]: "" }));
    try {
      const res = await fetch(
        `/api/projects/${project.id}/segments/${segment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scriptContent: segment.scriptContent,
            lastContentHash: segment.lastContentHash || latestContentHash,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setScriptErrors((prev) => ({
          ...prev,
          [segment.id]: data?.error || "Failed to save script.",
        }));
        return;
      }
      updateSegment(segment.id, {
        scriptContent: data.scriptContent,
        lastContentHash: data.lastContentHash,
      });
      setSavedScripts((prev) => ({
        ...prev,
        [segment.id]: data.scriptContent || "",
      }));
    } catch (error) {
      console.error("Error saving script:", error);
      setScriptErrors((prev) => ({
        ...prev,
        [segment.id]: "Failed to save script. Please try again.",
      }));
    } finally {
      setSavingScripts((prev) => ({ ...prev, [segment.id]: false }));
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const handleAddSegment = async () => {
    setAddSegmentLoading(true);
    setAddSegmentError("");
    try {
      const body:
        | { type: "new_visitor"; conditionValue?: string }
        | { type: "returning_visitor"; conditionValue?: string }
        | { type: "utm_source"; conditionValue?: string }
        | { type: "geo"; conditionValue?: string }
        | { type: "language"; conditionValue?: string }
        | {
            type:
              | "new_visitor"
              | "returning_visitor"
              | "utm_source"
              | "geo"
              | "language";
            conditionValue?: string;
          } = { type: newSegmentType };
      if (
        newSegmentType === "utm_source" ||
        newSegmentType === "geo" ||
        newSegmentType === "language"
      ) {
        if (!newSegmentCondition.trim()) {
          setAddSegmentError("Condition value is required");
          setAddSegmentLoading(false);
          return;
        }
        body.conditionValue = newSegmentCondition.trim();
      }

      const res = await fetch(`/api/projects/${project.id}/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddSegmentError(data?.error || "Failed to add segment");
        return;
      }
      setSegments((prev) => [...prev, data]);
      setAddSegmentDialogOpen(false);
      setNewSegmentType("new_visitor");
      setNewSegmentCondition("");
    } catch (error) {
      console.error("Error adding segment:", error);
      setAddSegmentError("Failed to add segment. Please try again.");
    } finally {
      setAddSegmentLoading(false);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this segment?",
    );
    if (!confirmed) return;

    setDeletingSegments((prev) => ({ ...prev, [segmentId]: true }));
    try {
      const res = await fetch(
        `/api/projects/${project.id}/segments/${segmentId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data?.error || "Failed to delete segment");
        return;
      }
      setSegments((prev) => prev.filter((s) => s.id !== segmentId));
      setSavedScripts((prev) => {
        const newScripts = { ...prev };
        delete newScripts[segmentId];
        return newScripts;
      });
    } catch (error) {
      console.error("Error deleting segment:", error);
      alert("Failed to delete segment. Please try again.");
    } finally {
      setDeletingSegments((prev) => ({ ...prev, [segmentId]: false }));
    }
  };

  const baseVoiceOptions = voices.some((voice) => voice.id === DEFAULT_VOICE_ID)
    ? voices
    : [
        {
          id: DEFAULT_VOICE_ID,
          name: DEFAULT_VOICE_LABEL,
        },
        ...voices,
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.baseUrl}</p>
        </div>
        {mounted ? (
          <ProjectSettingsDialog
            project={project}
            onUpdate={handleProjectUpdate}
          />
        ) : (
          <Button variant="outline" disabled>
            Settings
          </Button>
        )}
      </div>

      {mounted ? (
        <>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="segments">Segments & Scripts</TabsTrigger>
              <TabsTrigger value="page-segments">Page Segments</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="voices">Voices</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="feedback">Voice Feedback</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="segments" className="space-y-4">
              <div className="flex items-center justify-between">
                {voicesError && (
                  <div className="flex items-start gap-2 text-sm text-red-600">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <span>{voicesError}</span>
                  </div>
                )}
                <Dialog
                  open={addSegmentDialogOpen}
                  onOpenChange={setAddSegmentDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Segment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Segment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="segment-type">Segment Type</Label>
                        <Select
                          value={newSegmentType}
                          onValueChange={(value) =>
                            setNewSegmentType(
                              value as
                                | "new_visitor"
                                | "returning_visitor"
                                | "utm_source"
                                | "geo"
                                | "language",
                            )
                          }
                        >
                          <SelectTrigger id="segment-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new_visitor">
                              New Visitor
                            </SelectItem>
                            <SelectItem value="returning_visitor">
                              Returning Visitor
                            </SelectItem>
                            <SelectItem value="utm_source">
                              UTM Source
                            </SelectItem>
                            <SelectItem value="geo">Geo Location</SelectItem>
                            <SelectItem value="language">Language</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(newSegmentType === "utm_source" ||
                        newSegmentType === "geo" ||
                        newSegmentType === "language") && (
                        <div className="space-y-2">
                          <Label htmlFor="segment-condition">
                            {newSegmentType === "utm_source"
                              ? "UTM Source"
                              : newSegmentType === "geo"
                                ? "Country Code"
                                : "Language Code"}
                          </Label>
                          <Input
                            id="segment-condition"
                            value={newSegmentCondition}
                            onChange={(e) =>
                              setNewSegmentCondition(e.target.value)
                            }
                            placeholder={
                              newSegmentType === "utm_source"
                                ? "e.g., google, meta"
                                : newSegmentType === "geo"
                                  ? "e.g., US, CA"
                                  : "e.g., es, fr"
                            }
                          />
                        </div>
                      )}
                      {addSegmentError && (
                        <div className="text-sm text-red-600">
                          {addSegmentError}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAddSegment}
                        disabled={addSegmentLoading}
                      >
                        {addSegmentLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Segment"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* If no segments, show button to init defaults */}
                {segments.length === 0 && (
                  <Card key="no-segments" className="col-span-full">
                    <CardHeader>
                      <CardTitle>No Segments Configured</CardTitle>
                      <CardDescription>
                        Initialize default segments to get started.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleInitializeDefaults}
                        disabled={initializing}
                      >
                        {initializing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          "Initialize Defaults"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {segments.map((segment) => {
                  const savedScript = savedScripts[segment.id] ?? "";
                  const currentScript = segment.scriptContent || "";
                  const isDirty = savedScript !== currentScript;
                  const selectedVoiceId = segment.voiceId || DEFAULT_VOICE_ID;
                  const voiceOptions =
                    segment.voiceId &&
                    !baseVoiceOptions.some(
                      (voice) => voice.id === segment.voiceId,
                    )
                      ? [
                          {
                            id: segment.voiceId,
                            name: "Custom voice (unavailable)",
                          },
                          ...baseVoiceOptions,
                        ]
                      : baseVoiceOptions;
                  return (
                    <Card key={segment.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg capitalize">
                            {segment.type.replace("_", " ")}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {segment.audioUrl && (
                              <Badge variant="secondary">Ready</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteSegment(segment.id)}
                              disabled={deletingSegments[segment.id]}
                            >
                              {deletingSegments[segment.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          {segment.type === "utm_source"
                            ? `Source: ${segment.conditionValue}`
                            : segment.type === "language"
                              ? `Lang: ${segment.conditionValue}`
                              : "Standard visitor"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                        {shouldShowContentBanner(segment) && (
                          <ContentChangeBanner
                            key="content-banner"
                            onRegenerate={() => handleGenerateScript(segment)}
                            loading={loading[segment.id]}
                          />
                        )}
                        <div key="script-controls" className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Script
                            </label>
                            <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleGenerateScript(segment)}
                              disabled={loading[segment.id]}
                            >
                              {loading[segment.id] ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              ) : (
                                <Wand2 className="mr-2 h-3 w-3" />
                              )}
                              {segment.scriptContent
                                ? "Regenerate Script"
                                : "Generate Script"}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleOpenCritique(segment)}
                              disabled={!segment.scriptContent}
                            >
                              <MessageSquareText className="mr-2 h-3 w-3" />
                              Critique
                            </Button>
                          </div>
                        </div>
                          {isDirty && (
                            <div key="previous-script" className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Previous Script
                              </label>
                              <Textarea
                                value={savedScript}
                                readOnly
                                placeholder="No previous script yet."
                                className="min-h-[100px] text-sm bg-muted/60"
                              />
                            </div>
                          )}
                          {isDirty && (
                            <label key="new-script-label" className="text-xs font-medium text-muted-foreground">
                              New Script
                            </label>
                          )}
                          <Textarea
                            value={segment.scriptContent}
                            onChange={(e) => {
                              updateSegment(segment.id, {
                                scriptContent: e.target.value,
                              });
                              setSegmentErrors((prev) => ({
                                ...prev,
                                [segment.id]: "",
                              }));
                              setScriptErrors((prev) => ({
                                ...prev,
                                [segment.id]: "",
                              }));
                            }}
                            className="min-h-[100px] text-sm"
                            placeholder="Script will appear here..."
                          />
                          {scriptErrors[segment.id] && (
                            <div className="flex items-start gap-2 text-sm text-red-600">
                              <AlertTriangle className="mt-0.5 h-4 w-4" />
                              <span>{scriptErrors[segment.id]}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Voice</label>
                            {voicesLoading && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Loading voices...
                              </div>
                            )}
                          </div>
                          <Select
                            value={selectedVoiceId}
                            onValueChange={(value) =>
                              handleVoiceChange(segment, value)
                            }
                            disabled={voicesLoading || voiceSaving[segment.id]}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent>
                              {voiceOptions.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  {voice.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {voiceErrors[segment.id] && (
                            <div className="flex items-start gap-2 text-sm text-red-600">
                              <AlertTriangle className="mt-0.5 h-4 w-4" />
                              <span>{voiceErrors[segment.id]}</span>
                            </div>
                          )}
                        </div>

                        {segment.audioUrl && (
                          <div className="rounded-md bg-muted p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">
                                Voice Preview
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => playAudio(segment.audioUrl!)}
                              >
                                <Play className="mr-2 h-3 w-3" />
                                Listen
                              </Button>
                            </div>
                            <audio
                              className="w-full"
                              controls
                              src={segment.audioUrl}
                            />
                          </div>
                        )}
                      </CardContent>
                      <div className="p-6 pt-0 mt-auto">
                        {isDirty ? (
                          <Button
                            className="w-full"
                            variant="success"
                            onClick={() => handleSaveScript(segment)}
                            disabled={
                              savingScripts[segment.id] || !currentScript
                            }
                          >
                            {savingScripts[segment.id] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Script"
                            )}
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleGenerateVoice(segment)}
                            disabled={
                              loading[segment.id] || !segment.scriptContent
                            }
                          >
                            {loading[segment.id]
                              ? "Generating..."
                              : segment.audioUrl
                                ? "Regenerate Voice"
                                : "Generate Voice"}
                          </Button>
                        )}
                        {segmentErrors[segment.id] && (
                          <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{segmentErrors[segment.id]}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="pages">
              <PagesView projectId={project.id} baseUrl={project.baseUrl} />
            </TabsContent>

            <TabsContent value="voices">
              <VoiceProfilesView />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsView projectId={project.id} />
            </TabsContent>

            <TabsContent value="feedback">
              <InteractionsView projectId={project.id} />
            </TabsContent>

            <TabsContent value="integration">
              <Card>
                <CardHeader>
                  <CardTitle>Integration</CardTitle>
                  <CardDescription>
                    Add this code to your website to enable VoiceHero.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted p-4">
                    <code className="text-sm break-all">
                      {`<script src="${clientEnv.APP_URL}/widget.js" data-site-id="${project.id}" data-api-url="${clientEnv.APP_URL}" defer></script>`}
                    </code>
                  </div>

                  <div className="mt-8 space-y-4">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MessageSquareText className="h-5 w-5" />
                          Voice Feedback Collection
                        </CardTitle>
                        <CardDescription>
                          Your widget includes a built-in microphone feature that allows visitors 
                          to provide instant voice feedback about your voice pitch.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>
                            <strong>How it works:</strong> Visitors can click the microphone button 
                            in the widget and speak their feedback. Their voice is automatically 
                            transcribed and saved to your <strong>Voice Feedback</strong> tab for review.
                          </p>
                          <p>
                            <strong>Benefits:</strong> Collect real-time insights about what users think 
                            about your voice pitch, gather suggestions for improvement, and understand 
                            user sentiment without any additional setup.
                          </p>
                          <p className="text-xs pt-2">
                            💡 <strong>Tip:</strong> Check the <strong>Voice Feedback</strong> tab to 
                            see all collected feedback and insights.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <h3 className="text-lg font-semibold">
                      Troubleshooting & FAQ
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="cors">
                        <AccordionTrigger>
                          Widget not appearing due to CORS restrictions?
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              If the widget is not appearing on your site, it
                              might be due to Cross-Origin Resource Sharing
                              (CORS) restrictions. If you are self-hosting or
                              have strict security policies, you may need to add
                              the following configuration to your server:
                            </p>
                            <div className="rounded-md bg-muted p-4">
                              <pre className="text-xs overflow-x-auto whitespace-pre">
{`// next.config.js or next.config.ts
async headers() {
  return [
    {
      source: "/widget.js",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET" },
      ],
    },
  ];
},`}
                              </pre>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <strong>Note:</strong> For Vercel, Netlify, or
                              other platforms, check their documentation for
                              adding custom headers to static files.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cors-nextjs-proxy">
                        <AccordionTrigger>
                          Using Next.js? Eliminate CORS with a same-origin proxy?
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              If you're using Next.js, you can eliminate CORS
                              issues entirely by using a same-origin proxy. This
                              makes the widget fetch from your own domain, and
                              Next.js forwards the requests to VoiceHero.
                            </p>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-semibold mb-2">
                                  1. Update your widget code to use a
                                  same-origin path:
                                </p>
                                <div className="rounded-md bg-muted p-4">
                                  <pre className="text-xs overflow-x-auto whitespace-pre">
{`<script 
  src="https://voicehero.prodfact.com/widget.js" 
  data-site-id="YOUR_SITE_ID" 
  data-api-url="/voicehero" 
  defer
></script>`}
                                  </pre>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold mb-2">
                                  2. Add a rewrite rule in your{" "}
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    next.config.js
                                  </code>{" "}
                                  or{" "}
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    next.config.ts
                                  </code>
                                  :
                                </p>
                                <div className="rounded-md bg-muted p-4">
                                  <pre className="text-xs overflow-x-auto whitespace-pre">
{`// next.config.js or next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/voicehero/api/:path*',
        destination: 'https://voicehero.prodfact.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;`}
                                  </pre>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <strong>How it works:</strong> The widget now
                              fetches from <code className="text-xs bg-muted px-1 py-0.5 rounded">/voicehero/api/...</code> (same
                              origin), and Next.js automatically proxies these
                              requests to VoiceHero. This eliminates CORS
                              restrictions since all requests appear to come
                              from your own domain.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Note:</strong> Replace{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                voicehero.prodfact.com
                              </code>{" "}
                              with your actual VoiceHero domain if different.
                              Restart your Next.js dev server after making
                              changes.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="csp-nextjs">
                        <AccordionTrigger>
                          Content Security Policy (CSP) blocking widget in
                          Next.js?
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              If you're using Next.js with Content Security
                              Policy headers, you need to allow the VoiceHero
                              script and API connections. Update your{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                next.config.js
                              </code>{" "}
                              file:
                            </p>
                            <div className="rounded-md bg-muted p-4">
                              <pre className="text-xs overflow-x-auto whitespace-pre">
{`// next.config.js
const nextConfig = {
  async headers() {
    const voiceHeroDomain = process.env.NEXT_PUBLIC_APP_URL
      ?.replace(/^https?:\\/\\//, '') || 'voicehero.prodfact.com';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              \`script-src 'self' 'unsafe-eval' 'unsafe-inline' https://\${voiceHeroDomain}\`,
              \`connect-src 'self' https://\${voiceHeroDomain}\`,
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "frame-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;`}
                              </pre>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <strong>Important:</strong> Replace{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                voicehero.prodfact.com
                              </code>{" "}
                              with your actual VoiceHero domain (or use{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                NEXT_PUBLIC_APP_URL
                              </code>
                              ). Restart your Next.js dev server after making
                              changes.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="csp-general">
                        <AccordionTrigger>
                          Content Security Policy (CSP) blocking widget in
                          other frameworks?
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              If you're using React, Vue, Angular, or other
                              frameworks with CSP headers, add the following
                              directives:
                            </p>
                            <div className="rounded-md bg-muted p-4">
                              <pre className="text-xs overflow-x-auto whitespace-pre">
{`Content-Security-Policy:
  script-src 'self' 'unsafe-inline' https://voicehero.prodfact.com;
  connect-src 'self' https://voicehero.prodfact.com;`}
                              </pre>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <strong>Note:</strong> Replace{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                voicehero.prodfact.com
                              </code>{" "}
                              with your actual VoiceHero domain.
                            </p>
                            <div className="space-y-2 text-xs text-muted-foreground">
                              <p>
                                <strong>For React (Create React App):</strong>{" "}
                                Add to <code className="bg-muted px-1 py-0.5 rounded">public/index.html</code> meta tag or configure in build tools.
                              </p>
                              <p>
                                <strong>For Vue:</strong> Add to{" "}
                                <code className="bg-muted px-1 py-0.5 rounded">public/index.html</code> or configure in{" "}
                                <code className="bg-muted px-1 py-0.5 rounded">vue.config.js</code>.
                              </p>
                              <p>
                                <strong>For Angular:</strong> Configure in{" "}
                                <code className="bg-muted px-1 py-0.5 rounded">angular.json</code> or use meta tags.
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="script-tag">
                        <AccordionTrigger>
                          Where should I place the script tag?
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Place the script tag in the{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                &lt;head&gt;
                              </code>{" "}
                              or before the closing{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                &lt;/body&gt;
                              </code>{" "}
                              tag of your HTML:
                            </p>
                            <div className="rounded-md bg-muted p-4">
                              <pre className="text-xs overflow-x-auto whitespace-pre">
{`<!DOCTYPE html>
<html>
  <head>
    <!-- Other head content -->
    <script 
      src="${clientEnv.APP_URL}/widget.js" 
      data-site-id="${project.id}" 
      data-api-url="${clientEnv.APP_URL}" 
      defer
    ></script>
  </head>
  <body>
    <!-- Your page content -->
  </body>
</html>`}
                              </pre>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              The <code className="text-xs bg-muted px-1 py-0.5 rounded">defer</code> attribute ensures
                              the script loads after the HTML is parsed, which
                              is recommended for better performance.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="console-errors">
                        <AccordionTrigger>
                          Seeing console errors or network failures?
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              If you're seeing errors in the browser console,
                              check the following:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                              <li>
                                <strong>404 errors:</strong> Verify the{" "}
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  data-api-url
                                </code>{" "}
                                matches your VoiceHero deployment URL
                              </li>
                              <li>
                                <strong>CORS errors:</strong> See the CORS
                                troubleshooting section above
                              </li>
                              <li>
                                <strong>CSP errors:</strong> See the CSP
                                troubleshooting sections above
                              </li>
                              <li>
                                <strong>Network errors:</strong> Check that your
                                site ID is correct and the project is active
                              </li>
                            </ul>
                            <p className="text-xs text-muted-foreground">
                              Open your browser's Developer Tools (F12) and
                              check the Console and Network tabs for specific
                              error messages.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8">
                <VisitorSimulator projectId={project.id} />
              </div>
            </TabsContent>

            <TabsContent value="page-segments">
              {loadingPages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Loading pages...
                </div>
              ) : pages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground text-center">
                  No pages discovered yet. Go to the Pages tab to discover pages
                  for your site.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Select a Page</h4>
                    <Select
                      value={selectedPageId || ""}
                      onValueChange={(value) => setSelectedPageId(value)}
                    >
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title || page.path}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPageId ? (
                    <PageSegmentsView
                      projectId={project.id}
                      page={pages.find((p) => p.id === selectedPageId)!}
                      projectName={project.name}
                      projectDescription={project.description}
                      projectTone={project.tone}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-sm text-muted-foreground text-center">
                      Select a page to view and manage its specific segments.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <ScriptWizard
            open={scriptWizardOpen}
            onOpenChange={(open) => {
              setScriptWizardOpen(open);
              if (!open) {
                setScriptWizardSegment(null);
              }
            }}
            project={project}
            segment={scriptWizardSegment}
            onApplyScript={handleApplyScript}
            onSaveDefaults={saveScriptDefaults}
          />
          <ScriptCritiquePanel
            open={critiqueOpen}
            onOpenChange={(open) => {
              setCritiqueOpen(open);
              if (!open) {
                setCritiqueSegment(null);
              }
            }}
            segment={critiqueSegment}
            tone={project.tone}
            language={project.language}
            scriptDefaults={project.scriptDefaults}
            onApplyRewrite={handleApplyScript}
          />
        </>
      ) : (
        <div className="space-y-4">
          <div className="h-9 w-56 rounded-lg bg-muted" aria-hidden="true" />
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
            Loading project tools...
          </div>
        </div>
      )}
    </div>
  );
}

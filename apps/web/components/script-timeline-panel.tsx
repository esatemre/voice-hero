"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentSnapshot, PageSegment, ScriptVersion } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ScriptTimelinePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  pageId: string;
  segment: PageSegment | null;
  onRestore: (segment: PageSegment) => void;
}

type TimelineEntry =
  | { type: "version"; createdAt: number; data: ScriptVersion }
  | { type: "snapshot"; createdAt: number; data: ContentSnapshot };

function formatTimestamp(value: number) {
  return new Date(value).toLocaleString();
}

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function ScriptTimelinePanel({
  open,
  onOpenChange,
  projectId,
  pageId,
  segment,
  onRestore,
}: ScriptTimelinePanelProps) {
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [snapshots, setSnapshots] = useState<ContentSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !segment) return;

    const loadTimeline = async () => {
      setLoading(true);
      setError("");
      try {
        const [versionsRes, snapshotsRes] = await Promise.all([
          fetch(
            `/api/projects/${projectId}/pages/${pageId}/segments/${segment.id}/versions`,
          ),
          fetch(`/api/projects/${projectId}/pages/${pageId}/snapshots`),
        ]);

        const versionsData = await versionsRes.json();
        const snapshotsData = await snapshotsRes.json();

        if (!versionsRes.ok) {
          throw new Error(versionsData?.error || "Failed to load versions");
        }
        if (!snapshotsRes.ok) {
          throw new Error(snapshotsData?.error || "Failed to load snapshots");
        }

        setVersions(versionsData || []);
        setSnapshots(snapshotsData || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load timeline.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [open, segment, projectId, pageId]);

  const entries = useMemo(() => {
    const versionEntries: TimelineEntry[] = versions.map((version) => ({
      type: "version",
      createdAt: version.createdAt,
      data: version,
    }));
    const snapshotEntries: TimelineEntry[] = snapshots.map((snapshot) => ({
      type: "snapshot",
      createdAt: snapshot.createdAt,
      data: snapshot,
    }));
    return [...versionEntries, ...snapshotEntries].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }, [versions, snapshots]);

  const handleRestore = async (versionId: string) => {
    if (!segment) return;
    setRestoringId(versionId);
    setError("");
    try {
      const res = await fetch(
        `/api/projects/${projectId}/pages/${pageId}/segments/${segment.id}/versions/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to restore version");
      }
      onRestore(data as PageSegment);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to restore version.";
      setError(message);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Version Timeline</DialogTitle>
          <DialogDescription>
            Review content snapshots and script versions for this page segment.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading timeline...
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
            No versions or snapshots recorded yet.
          </div>
        ) : (
          <Accordion type="single" collapsible>
            {entries.map((entry) => {
              const id =
                entry.type === "version"
                  ? `version-${entry.data.id}`
                  : `snapshot-${entry.data.id}`;
              return (
                <AccordionItem key={id} value={id}>
                  <AccordionTrigger>
                    <div className="flex w-full flex-col gap-1 text-left">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {entry.type === "version" ? "Script" : "Snapshot"}
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatTimestamp(entry.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {entry.type === "version"
                          ? `Source: ${
                              entry.data.source || "manual"
                            }`
                          : "Source: scrape"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {entry.type === "version" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Word count: {countWords(entry.data.scriptContent)}
                          </span>
                          {entry.data.voiceId && (
                            <span>Voice: {entry.data.voiceId}</span>
                          )}
                        </div>
                        <Textarea
                          value={entry.data.scriptContent}
                          readOnly
                          className="min-h-[120px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRestore(entry.data.id)}
                          disabled={restoringId === entry.data.id}
                        >
                          {restoringId === entry.data.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Restore this version
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">
                            {entry.data.raw.title || entry.data.raw.headline}
                          </span>
                        </div>
                        {entry.data.processed.summary && (
                          <div>{entry.data.processed.summary}</div>
                        )}
                        <div className="text-xs">
                          Content hash: {entry.data.contentHash}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

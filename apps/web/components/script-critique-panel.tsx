"use client";

import { useCallback, useEffect, useState } from "react";
import { ScriptCritique, ScriptOptions, Segment, Tone } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

interface ScriptCritiquePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: Segment | null;
  tone: Tone;
  language: string;
  scriptDefaults?: ScriptOptions;
  onApplyRewrite: (segmentId: string, script: string) => void;
}

export default function ScriptCritiquePanel({
  open,
  onOpenChange,
  segment,
  tone,
  language,
  scriptDefaults,
  onApplyRewrite,
}: ScriptCritiquePanelProps) {
  const [critique, setCritique] = useState<ScriptCritique | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runCritique = useCallback(async () => {
    if (!segment?.scriptContent) {
      setError("Add a script before requesting critique.");
      return;
    }

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const effectiveTone = scriptDefaults?.tone || tone;
      const effectiveLanguage = scriptDefaults?.language || language;

      const res = await fetch("/api/script-critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          script: segment.scriptContent,
          segmentType: segment.type,
          tone: effectiveTone,
          language: effectiveLanguage,
          lengthSeconds: scriptDefaults?.lengthSeconds,
          wordCount: scriptDefaults?.wordCount,
          ctaFocus: scriptDefaults?.ctaFocus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to critique script");
      }

      setCritique(data as ScriptCritique);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Critique request timed out."
          : err instanceof Error
            ? err.message
            : "Failed to critique script.";
      setError(message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [segment, scriptDefaults, tone, language]);

  useEffect(() => {
    if (!open) return;
    setCritique(null);
    setError("");
    if (segment?.scriptContent) {
      runCritique();
    }
  }, [open, segment?.id, segment?.scriptContent, runCritique]);

  const handleApply = () => {
    if (!segment || !critique?.revisedScript) return;
    onApplyRewrite(segment.id, critique.revisedScript);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:left-auto sm:right-0 sm:top-0 sm:translate-x-0 sm:translate-y-0 sm:h-screen sm:w-full sm:max-w-lg sm:rounded-none sm:overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Script Critique</DialogTitle>
          <DialogDescription>
            Review strengths, issues, and an improved rewrite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!segment?.scriptContent && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>Add a script to request critique.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating critique...
            </div>
          ) : critique ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Score {critique.score}/10</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runCritique}
                  disabled={loading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Strengths</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {critique.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Weaknesses</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {critique.weaknesses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Suggestions</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {critique.suggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Revised Script</h4>
                <Textarea value={critique.revisedScript} readOnly />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
              No critique generated yet.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleApply} disabled={!critique?.revisedScript}>
            Apply rewrite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

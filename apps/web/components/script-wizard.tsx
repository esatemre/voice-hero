"use client";

import { useEffect, useState } from "react";
import { Project, ScriptOptions, Segment, Tone } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Loader2, RotateCcw, Wand2 } from "lucide-react";

type LengthUnit = "seconds" | "words";

interface ScriptWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  segment: Segment | null;
  onApplyScript: (segmentId: string, script: string) => void;
  onSaveDefaults: (options: ScriptOptions) => Promise<void>;
}

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
  { value: "energetic", label: "Energetic" },
];

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

export default function ScriptWizard({
  open,
  onOpenChange,
  project,
  segment,
  onApplyScript,
  onSaveDefaults,
}: ScriptWizardProps) {
  const [step, setStep] = useState<"options" | "preview">("options");
  const [tone, setTone] = useState<Tone>(project.tone);
  const [language, setLanguage] = useState(project.language);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("seconds");
  const [lengthValue, setLengthValue] = useState(20);
  const [ctaFocus, setCtaFocus] = useState("");
  const [saveDefaults, setSaveDefaults] = useState(false);
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const defaults = project.scriptDefaults;
    setStep("options");
    setScript("");
    setError("");
    setSaveDefaults(false);
    setTone(defaults?.tone || project.tone);
    setLanguage(defaults?.language || project.language);
    if (defaults?.wordCount) {
      setLengthUnit("words");
      setLengthValue(defaults.wordCount);
    } else if (defaults?.lengthSeconds) {
      setLengthUnit("seconds");
      setLengthValue(defaults.lengthSeconds);
    } else {
      setLengthUnit("seconds");
      setLengthValue(20);
    }
    setCtaFocus(defaults?.ctaFocus || "");
  }, [open, project, segment?.id]);

  const buildOptions = (): ScriptOptions => {
    const options: ScriptOptions = {
      tone,
      language,
      ctaFocus: ctaFocus.trim() || undefined,
    };
    if (lengthUnit === "seconds" && lengthValue > 0) {
      options.lengthSeconds = lengthValue;
    }
    if (lengthUnit === "words" && lengthValue > 0) {
      options.wordCount = lengthValue;
    }
    return options;
  };

  const handleGenerate = async () => {
    if (!segment) return;
    setError("");
    if (!lengthValue || lengthValue <= 0) {
      setError("Length must be greater than zero.");
      return;
    }
    setLoading(true);
    try {
      const options = buildOptions();
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: project.name,
          productDescription: project.description,
          segmentType: segment.type,
          tone: options.tone || project.tone,
          language: options.language,
          lengthSeconds: options.lengthSeconds,
          wordCount: options.wordCount,
          ctaFocus: options.ctaFocus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate script");
      }
      setScript(data.script || "");
      setStep("preview");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate script.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!segment || !script) return;
    setError("");
    try {
      if (saveDefaults) {
        setSavingDefaults(true);
        await onSaveDefaults(buildOptions());
      }
      onApplyScript(segment.id, script);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save script defaults.";
      setError(message);
    } finally {
      setSavingDefaults(false);
    }
  };

  const isPreview = step === "preview";
  const segmentLabel = segment?.type.replace("_", " ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Script Generation Wizard</DialogTitle>
          <DialogDescription>
            {segmentLabel
              ? `Generate a script for ${segmentLabel}.`
              : "Generate a script with custom settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {isPreview ? (
            <div className="space-y-3">
              <label className="text-sm font-medium">Preview</label>
              <Textarea value={script} readOnly className="min-h-[160px]" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tone</label>
                <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Length</label>
                <div className="grid gap-2 md:grid-cols-[160px_1fr]">
                  <Select
                    value={lengthUnit}
                    onValueChange={(value) => setLengthUnit(value as LengthUnit)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="words">Words</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={Number.isNaN(lengthValue) ? "" : lengthValue}
                    onChange={(event) =>
                      setLengthValue(Number(event.target.value))
                    }
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">CTA focus (optional)</label>
                <Input
                  value={ctaFocus}
                  onChange={(event) => setCtaFocus(event.target.value)}
                  placeholder="Book a demo, start a trial, request pricing..."
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-muted-foreground/20 p-3">
                <div>
                  <p className="text-sm font-medium">Save as defaults</p>
                  <p className="text-xs text-muted-foreground">
                    Use these settings for future script generation.
                  </p>
                </div>
                <Switch checked={saveDefaults} onCheckedChange={setSaveDefaults} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isPreview ? (
            <>
              <Button variant="outline" onClick={() => setStep("options")}>
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Regenerate
              </Button>
              <Button
                onClick={handleAccept}
                disabled={savingDefaults || !script}
              >
                {savingDefaults ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Use script
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate preview
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

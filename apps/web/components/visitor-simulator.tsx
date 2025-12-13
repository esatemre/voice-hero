"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Loader2 } from "lucide-react";

interface VisitorSimulatorProps {
  projectId: string;
}

export default function VisitorSimulator({ projectId }: VisitorSimulatorProps) {
  const [pageUrl, setPageUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [language, setLanguage] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    audioUrl: string;
    transcript: string;
    label: string;
    segmentId: string;
    segmentType: string;
  } | null>(null);
  const [error, setError] = useState("");

  const commonLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
  ];

  const handleRunSimulation = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const params = new URLSearchParams({
        siteId: projectId,
        ...(pageUrl && { pageUrl }),
        ...(utmSource && { utmSource }),
        ...(language && { lang: language }),
        ...(isReturning && { isReturning: "true" }),
      });

      const res = await fetch(`/api/playback?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Simulation failed");
        return;
      }

      if (data.voiceDisabled) {
        setError("Voice is disabled for this page");
        return;
      }

      setResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
      setError("Failed to run simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (result?.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.play();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test as Visitor</CardTitle>
        <CardDescription>
          Preview what audio visitors will hear based on different contexts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="page-url">Page URL (optional)</Label>
            <Input
              id="page-url"
              placeholder="https://yoursite.com/page"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utm-source">UTM Source (optional)</Label>
            <Input
              id="utm-source"
              placeholder="e.g., google, meta_ads"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language (optional)</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {commonLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-2">
              <Label htmlFor="returning">Returning Visitor</Label>
              <Switch
                id="returning"
                checked={isReturning}
                onCheckedChange={setIsReturning}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              "Run Simulation"
            )}
          </Button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        {result && (
          <div className="space-y-4 rounded-lg border bg-muted p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Selected Segment</h4>
                <div className="text-sm text-muted-foreground">
                  <span className="inline-block bg-primary/10 px-2 py-1 rounded text-xs font-medium text-primary mr-2">
                    {result.segmentType.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ID: {result.segmentId.slice(0, 8)}...
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={playAudio}>
                <Play className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Transcript</Label>
              <div className="rounded-md bg-background p-3 text-sm">
                {result.transcript}
              </div>
            </div>

            <audio controls className="w-full" src={result.audioUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

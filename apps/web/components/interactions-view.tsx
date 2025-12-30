"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, MessageSquare, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Interaction {
  id: string;
  transcription: string;
  timestamp: string;
  createdAt: string;
}

interface InteractionsData {
  interactions: Interaction[];
  total: number;
}

interface InteractionsViewProps {
  projectId: string;
}

export default function InteractionsView({ projectId }: InteractionsViewProps) {
  const [data, setData] = useState<InteractionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/interactions?limit=100`);
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        }
      } catch (error) {
        console.error("Error fetching interactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Failed to load voice feedback.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-xs text-muted-foreground">
              Voice feedback collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Feedback</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.interactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Displayed below
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlight */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Feedback Collection
          </CardTitle>
          <CardDescription>
            Collect instant voice feedback from visitors about your voice pitch. 
            Users can speak directly into the widget microphone, and their feedback 
            is automatically transcribed and saved here for analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>How it works:</strong> Visitors click the microphone button in the widget 
              and speak their feedback. The audio is transcribed using AI and saved to your 
              interaction pool for review.
            </p>
            <p>
              <strong>Use cases:</strong> Understand what users think about your voice pitch, 
              gather suggestions for improvement, and identify common questions or concerns.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Feedback</CardTitle>
          <CardDescription>
            Recent voice feedback from visitors about your voice pitch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.interactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No feedback yet</p>
              <p className="text-sm">
                Voice feedback from visitors will appear here once they use the microphone feature.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed">
                        {interaction.transcription || "(No transcription available)"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {formatDate(interaction.timestamp || interaction.createdAt)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


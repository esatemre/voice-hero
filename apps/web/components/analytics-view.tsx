"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2, Play, Users, MessageSquare, Clock } from "lucide-react";

interface AnalyticsStats {
  totalPlays: number;
  uniqueVisitors: number;
  completions: number;
  listenThroughRate: number;
  conversationStarts: number;
  conversationRate: number;
  avgResponseTime: number;
  segmentBreakdown: Record<
    string,
    { plays: number; completions: number; engagementRate: number }
  >;
  versionBreakdown: Record<
    string,
    { plays: number; completions: number; engagementRate: number }
  >;
  pageBreakdown: Record<
    string,
    { plays: number; completions: number; engagementRate: number }
  >;
}

interface AnalyticsViewProps {
  projectId: string;
}

export default function AnalyticsView({ projectId }: AnalyticsViewProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/analytics/stats?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  // Transform segment data for chart
  const segmentData = Object.entries(stats.segmentBreakdown).map(
    ([name, data]) => ({
      name: name.replace("_", " "),
      plays: data.plays,
      completions: data.completions,
    })
  );

  // Transform page data for chart
  const pageData = Object.entries(stats.pageBreakdown).map(([url, data]) => ({
    name: new URL(url).pathname || url,
    plays: data.plays,
    completions: data.completions,
    engagementRate: data.engagementRate,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlays}</div>
            <p className="text-xs text-muted-foreground">
              {stats.uniqueVisitors} unique visitors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Listen Through Rate
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.listenThroughRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completions} full completions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversation Rate
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.conversationStarts} conversations started
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">AI processing time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Segment</CardTitle>
            <CardDescription>
              Comparing plays and completions across different user segments.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="plays"
                    name="Total Plays"
                    fill="#000000"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completions"
                    name="Completions"
                    fill="#888888"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {pageData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance by Page</CardTitle>
              <CardDescription>
                Comparing plays and completions across different pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="plays"
                      name="Total Plays"
                      fill="#000000"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completions"
                      name="Completions"
                      fill="#888888"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import LiveFeed from '@/components/analytics/LiveFeed';
import { motion } from 'framer-motion';

interface AnalyticsStats {
    totalPlays: number;
    uniqueVisitors: number;
    completions: number;
    listenThroughRate: number;
    conversationStarts: number;
    conversationRate: number;
    avgResponseTime: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    segmentBreakdown: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    versionBreakdown: Record<string, any>;
}

export default function AnalyticsDashboard() {
    const params = useParams();
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState('7d');

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const endDate = new Date();
            const startDate = new Date();

            if (dateRange === '7d') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (dateRange === '30d') {
                startDate.setDate(endDate.getDate() - 30);
            }

            const query = new URLSearchParams({
                projectId: params.projectId as string,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            const res = await fetch(`/api/analytics/stats?${query}`);
            if (!res.ok) throw new Error('Failed to load stats');

            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, params.projectId, setLoading, setStats, setError]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]); // fetchStats is now a stable dependency due to useCallback

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading analytics...</span>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-500">
                {error || 'Failed to load analytics'}
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setDateRange('7d')}
                        className={`px-4 py-2 rounded-lg transition-colors ${dateRange === '7d' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setDateRange('30d')}
                        className={`px-4 py-2 rounded-lg transition-colors ${dateRange === '30d' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                <motion.div variants={item}>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Plays</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalPlays}</div>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Unique Visitors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Listen-Through Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.listenThroughRate}%</div>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item}>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Avg Response Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(stats.avgResponseTime / 1000).toFixed(1)}s</div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Charts & Live Feed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Segment Breakdown */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Visitor Segments</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={Object.entries(stats?.segmentBreakdown || {}).map(([key, value]) => ({
                                    name: key,
                                    ...value,
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="plays" fill="#8884d8" name="Plays" />
                                <Bar dataKey="engagementRate" fill="#82ca9d" name="Engagement %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Version Performance */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Version Performance (A/B)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={Object.entries(stats?.versionBreakdown || {}).map(([key, value]) => ({
                                    name: key,
                                    ...value,
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="engagementRate" fill="#ffc658" name="Engagement Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Live Feed */}
                <div className="col-span-1 h-[400px]">
                    <LiveFeed projectId={params.projectId as string} />
                </div>
            </motion.div>
        </div>
    );
}

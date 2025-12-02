import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const projectId = searchParams.get('projectId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        const db = getDb();
        let query = db
            .collection('projects')
            .doc(projectId)
            .collection('analytics')
            .where('projectId', '==', projectId);

        // Apply date filtering if provided
        if (startDate) {
            query = query.where('timestamp', '>=', new Date(startDate));
        }
        if (endDate) {
            query = query.where('timestamp', '<=', new Date(endDate));
        }

        // Limit to last 10,000 events to prevent timeouts
        // TODO: Implement aggregation for long-term scalability
        query = query.limit(10000);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return NextResponse.json({
                totalPlays: 0,
                uniqueVisitors: 0,
                completions: 0,
                listenThroughRate: 0,
                conversationStarts: 0,
                conversationRate: 0,
                avgResponseTime: 0,
                segmentBreakdown: {},
                versionBreakdown: {},
            });
        }

        // Process events to calculate metrics
        const sessions = new Set<string>();
        let totalPlays = 0;
        let completions = 0;
        let conversationStarts = 0;
        const responseTimes: number[] = [];

        const segmentStats: Record<string, { plays: number; completions: number; engagementRate: number }> = {};
        const versionStats: Record<string, { plays: number; completions: number; engagementRate: number }> = {};

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            sessions.add(data.sessionId);

            // Count plays
            if (data.eventType === 'audio.play') {
                totalPlays++;

                // Initialize segment stats
                if (!segmentStats[data.segmentType]) {
                    segmentStats[data.segmentType] = { plays: 0, completions: 0, engagementRate: 0 };
                }
                segmentStats[data.segmentType].plays++;

                // Initialize version stats
                if (data.audioVersion) {
                    if (!versionStats[data.audioVersion]) {
                        versionStats[data.audioVersion] = { plays: 0, completions: 0, engagementRate: 0 };
                    }
                    versionStats[data.audioVersion].plays++;
                }
            }

            // Count completions
            if (data.eventType === 'audio.complete') {
                completions++;

                if (segmentStats[data.segmentType]) {
                    segmentStats[data.segmentType].completions++;
                }

                if (data.audioVersion && versionStats[data.audioVersion]) {
                    versionStats[data.audioVersion].completions++;
                }
            }

            // Count conversations
            if (data.eventType === 'conversation.start') {
                conversationStarts++;
            }

            // Track response times
            if (data.eventType === 'ai.response' && data.metadata?.responseTime) {
                responseTimes.push(data.metadata.responseTime);
            }
        });

        // Calculate engagement rates for segments
        Object.keys(segmentStats).forEach((segment) => {
            const stats = segmentStats[segment];
            stats.engagementRate = stats.plays > 0
                ? Math.round((stats.completions / stats.plays) * 100)
                : 0;
        });

        // Calculate engagement rates for versions
        Object.keys(versionStats).forEach((version) => {
            const stats = versionStats[version];
            stats.engagementRate = stats.plays > 0
                ? Math.round((stats.completions / stats.plays) * 100)
                : 0;
        });

        const uniqueVisitors = sessions.size;
        const listenThroughRate = totalPlays > 0
            ? Math.round((completions / totalPlays) * 100)
            : 0;
        const conversationRate = totalPlays > 0
            ? Math.round((conversationStarts / totalPlays) * 100)
            : 0;
        const avgResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;

        return NextResponse.json({
            totalPlays,
            uniqueVisitors,
            completions,
            listenThroughRate,
            conversationStarts,
            conversationRate,
            avgResponseTime,
            segmentBreakdown: segmentStats,
            versionBreakdown: versionStats,
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics stats' },
            { status: 500 }
        );
    }
}

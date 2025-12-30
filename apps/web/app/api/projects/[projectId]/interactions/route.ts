import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const db = getDb();
        const interactionsRef = db
            .collection('projects')
            .doc(projectId)
            .collection('interactions')
            .orderBy('timestamp', 'desc')
            .limit(limit);

        const snapshot = await interactionsRef.get();

        if (snapshot.empty) {
            return NextResponse.json({
                interactions: [],
                total: 0,
            });
        }

        const interactions = snapshot.docs.map((doc) => ({
            id: doc.id,
            transcription: doc.data().transcription || '',
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        }));

        // Get total count
        const totalSnapshot = await db
            .collection('projects')
            .doc(projectId)
            .collection('interactions')
            .count()
            .get();

        const total = totalSnapshot.data()?.count || 0;

        return NextResponse.json({
            interactions,
            total,
        });
    } catch (error) {
        console.error('Error fetching interactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interactions' },
            { status: 500 }
        );
    }
}


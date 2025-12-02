import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { Project, Segment } from '@/lib/types';
import ProjectView from '@/components/project-view';

interface PageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ProjectPage({ params }: PageProps) {
    const { projectId } = await params;

    const db = getDb();
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
        notFound();
    }

    const project = projectDoc.data() as Project;

    // Fetch segments
    const segmentsSnapshot = await getDb().collection('projects').doc(projectId).collection('segments').get();
    const segments = segmentsSnapshot.docs.map(doc => doc.data() as Segment);

    return <ProjectView project={project} initialSegments={segments} />;
}

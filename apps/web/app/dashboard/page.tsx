import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDb } from '@/lib/db';
import { Project } from '@/lib/types';


export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const db = getDb();
    const projectsSnapshot = await db.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => doc.data() as Project);

    return (
        <div className="grid gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Projects</h1>
                <Link href="/dashboard/new">
                    <Button>New Project</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Projects Yet</CardTitle>
                            <CardDescription>Create your first project to get started.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/dashboard/new">
                                <Button variant="outline" className="w-full">Create Project</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    projects.map((project) => (
                        <Link key={project.id} href={`/dashboard/${project.id}`}>
                            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle>{project.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        {project.baseUrl}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

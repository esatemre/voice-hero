import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
    // In a real app, fetch projects here.
    // For MVP, we'll just show a "Create Project" empty state or a list if we have one.

    return (
        <div className="grid gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Projects</h1>
                <Link href="/dashboard/new">
                    <Button>New Project</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder for project list */}
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
            </div>
        </div>
    );
}

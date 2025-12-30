import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Project } from "@/lib/types";
import {
  FolderKanban,
  FileText,
  Volume2,
  Globe,
  Sparkles,
  Plus,
} from "lucide-react";
import ProjectCard from "@/components/project-card";
import { getServerFeatureFlag } from "@/lib/server-feature-flags";

export const dynamic = "force-dynamic";

async function getProjects() {
  try {
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      const headersList = await headers();
      const host = headersList.get('host') || 'localhost:3000';
      baseUrl = `http://${host}`;
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const res = await fetch(`${baseUrl}/api/projects`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('Failed to fetch projects:', res.status, errorText);
        throw new Error(`Failed to fetch projects: ${res.status} ${res.statusText}`);
      }
      
      return res.json() as Promise<Project[]>;
    } catch (error) {
      clearTimeout(timeout);
      console.error('Error fetching projects:', error);
      // Return empty array on error to prevent page crash
      return [] as Project[];
    }
  } catch (error) {
    console.error('Error in getProjects:', error);
    return [] as Project[];
  }
}


export default async function DashboardPage() {
  const projects = await getProjects();
  const newProjectCreationEnabled = await getServerFeatureFlag(
    "new_project_creation_enabled",
  );

  const totalProjects = projects.length;
  const totalSegments = projects.reduce(
    (sum, p) => sum + p.status.segmentsTotal,
    0
  );
  const totalVoiceEnabled = projects.reduce(
    (sum, p) => sum + p.status.segmentsWithAudio,
    0
  );
  const totalPagesDiscovered = projects.reduce(
    (sum, p) => sum + p.status.pagesTotal,
    0
  );
  const totalPagesVoiceEnabled = projects.reduce(
    (sum, p) => sum + p.status.pagesVoiceEnabled,
    0
  );

  return (
    <div className="grid gap-6 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your voice-enabled projects
          </p>
        </div>
        {newProjectCreationEnabled && (
          <Link href="/dashboard/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Projects
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pages Discovered
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalPagesDiscovered}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pages Voice Enabled
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {totalPagesVoiceEnabled}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Segments
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalSegments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Volume2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Segments with Voice
                  </p>
                  <p className="text-3xl font-bold mt-1">{totalVoiceEnabled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">No Projects Yet</CardTitle>
              <CardDescription className="text-base">
                Create your first project to get started with voice-enabled
                content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newProjectCreationEnabled ? (
                <Link href="/dashboard/new">
                  <Button size="lg" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Project
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Project creation is currently disabled.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  );
}

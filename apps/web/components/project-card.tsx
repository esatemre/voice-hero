"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/types";
import {
  FileText,
  Volume2,
  Globe,
  Clock,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    segmentsTotal,
    segmentsWithAudio,
    lastVoiceGeneratedAt,
    pagesTotal,
    pagesVoiceEnabled,
    lastScrapeAt,
  } = project.status;

  let statusBadge: React.ReactNode;
  if (pagesTotal === 0 && segmentsTotal === 0) {
    statusBadge = <Badge variant="outline">Not set up</Badge>;
  } else if (pagesVoiceEnabled === 0 && segmentsWithAudio === 0) {
    statusBadge = <Badge variant="secondary">Needs voice</Badge>;
  } else if (pagesVoiceEnabled < pagesTotal || segmentsWithAudio < segmentsTotal) {
    statusBadge = (
      <Badge variant="default">
        Voice on {pagesVoiceEnabled} of {pagesTotal} pages
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge variant="default">
        Voice active on all {pagesTotal} pages
      </Badge>
    );
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to delete project");
      }

      // Refresh the page to update the project list
      router.refresh();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete project. Please try again."
      );
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/dashboard/${project.id}`);
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg cursor-pointer h-full flex flex-col"
        onClick={handleCardClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {statusBadge}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive relative z-20"
                onClick={handleDelete}
                title="Delete project"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="line-clamp-2 mt-2">
            {project.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{project.baseUrl}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            {pagesTotal > 0 && (
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-500/10 p-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pages</p>
                  <p className="text-sm font-semibold">
                    {pagesVoiceEnabled}/{pagesTotal}
                  </p>
                </div>
              </div>
            )}
            {segmentsTotal > 0 && (
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-orange-500/10 p-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Segments</p>
                  <p className="text-sm font-semibold">
                    {segmentsWithAudio}/{segmentsTotal}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1.5 mt-auto pt-2">
            {lastScrapeAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Scraped {formatDate(lastScrapeAt)}</span>
              </div>
            )}
            {lastVoiceGeneratedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="h-3 w-3" />
                <span>Voice generated {formatDate(lastVoiceGeneratedAt)}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action
              cannot be undone and will permanently delete:
            </DialogDescription>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>All pages and their content</li>
              <li>All segments and scripts</li>
              <li>All voice audio files</li>
              <li>All analytics data</li>
            </ul>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


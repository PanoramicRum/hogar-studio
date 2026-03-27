"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectDialog } from "@/components/projects/ProjectForm";
import { useGuest } from "@/components/providers/GuestProvider";

interface Project {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  coverImageUrl?: string | null;
  _count: { images: number; elements: number; designFiles: number };
  images: { url: string }[];
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const { isGuest, projects: guestProjects } = useGuest();
  const router = useRouter();
  const t = useTranslations();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setProjects(
        guestProjects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          updatedAt: p.updatedAt,
          coverImageUrl: p.coverImageUrl,
          _count: p._count,
          images: p.images.map((i) => ({ url: i.url })),
        }))
      );
      setLoading(false);
      return;
    }
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          setProjects(data);
          setLoading(false);
        });
    }
  }, [status, router, isGuest, guestProjects]);

  if (!isGuest && (status === "loading" || loading)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("projects.title")}</h1>
          {isGuest && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
              Guest mode — projects are stored in memory only
            </p>
          )}
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-muted-foreground/30 mb-4" style={{ fontSize: "64px" }}>folder_open</span>
          <p className="text-lg text-muted-foreground mb-4">
            {t("dashboard.noProjects")}
          </p>
          <NewProjectDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
    coverImageUrl?: string | null;
    _count: { images: number; elements: number; designFiles: number };
    images: { url: string }[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations();
  const thumbnail = project.coverImageUrl || project.images[0]?.url;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group rounded-xl overflow-hidden surface-container-low hover:shadow-ambient transition-all hover:scale-[1.02] cursor-pointer">
        <div className="w-full h-48 bg-muted overflow-hidden flex items-center justify-center">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-4xl text-muted-foreground/30 font-bold">
              {project.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-bold text-base">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>image</span>
              {project._count.images}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>palette</span>
              {project._count.designFiles}
            </span>
            <span className="ml-auto">
              {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

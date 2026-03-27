"use client";

import { ProjectSidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useParams } from "next/navigation";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="flex flex-1">
      <ProjectSidebar projectId={projectId} />
      <div className="flex-1 min-h-0 overflow-auto pb-16 md:pb-0">{children}</div>
      <MobileBottomNav />
    </div>
  );
}

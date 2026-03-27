"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/projects/ImageUploader";
import { RecommendationsPanel } from "@/components/designs/RecommendationsPanel";
import { Link } from "@/i18n/navigation";
import { useGuest } from "@/components/providers/GuestProvider";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  images: { id: string; type: string; url: string; filename: string }[];
  elements: { id: string; name: string; type: string }[];
  designFiles: { id: string; name: string; style: string; status: string; _count: { renders: number } }[];
  _count: { images: number; elements: number; designFiles: number };
}

export default function ProjectOverviewPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { isGuest, getProject: getGuestProject } = useGuest();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      const gp = getGuestProject(params.id as string);
      if (gp) {
        setProject({
          id: gp.id,
          name: gp.name,
          description: gp.description,
          images: gp.images,
          elements: gp.elements,
          designFiles: gp.designFiles,
          _count: gp._count,
        });
      }
      setLoading(false);
      return;
    }
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch(`/api/projects/${params.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then(setProject)
        .catch(() => router.push("/projects"))
        .finally(() => setLoading(false));
    }
  }, [status, params.id, router, isGuest, getGuestProject]);

  function refreshProject() {
    if (isGuest) {
      const gp = getGuestProject(params.id as string);
      if (gp) setProject({ id: gp.id, name: gp.name, description: gp.description, images: gp.images, elements: gp.elements, designFiles: gp.designFiles, _count: gp._count });
      return;
    }
    fetch(`/api/projects/${params.id}`)
      .then((res) => res.json())
      .then(setProject);
  }

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("projects.images")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project._count.images}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("projects.elements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project._count.elements}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("projects.designs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project._count.designFiles}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="images">
        <TabsList>
          <TabsTrigger value="images">{t("projects.images")}</TabsTrigger>
          <TabsTrigger value="designs">{t("projects.designs")}</TabsTrigger>
          <TabsTrigger value="elements">{t("projects.elements")}</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4 space-y-4">
          <ImageUploader projectId={project.id} onUploadComplete={() => {
            refreshProject();
            toast.info("Go to the Floor Plan Editor and calibrate the scale for accurate measurements.", { duration: 6000 });
          }} />
          {project.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.images.map((image) => (
                <div key={image.id} className="relative rounded-lg overflow-hidden border group">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-background/80 backdrop-blur px-2 py-1 rounded">
                      {image.type === "FLOOR_PLAN" ? t("images.floorPlan") : t("images.photo")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="designs" className="mt-4">
          {project.designFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">{t("designs.title")}</p>
              <Link href={`/projects/${project.id}/designs`}>
                <Button variant="outline">{t("designs.newDesign")}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.designFiles.map((file) => (
                <Link key={file.id} href={`/projects/${project.id}/designs/${file.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{file.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs dark:bg-amber-900/20 dark:text-amber-200">
                        {file.style}
                      </span>
                      <p>{file._count.renders} renders</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="elements" className="mt-4">
          {project.elements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">{t("elements.title")}</p>
              <Link href={`/projects/${project.id}/elements`}>
                <Button variant="outline">{t("elements.addElement")}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {project.elements.map((el) => (
                <div key={el.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="font-medium">{el.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {el.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Recommendations */}
      <RecommendationsPanel projectId={project.id} />
    </div>
  );
}

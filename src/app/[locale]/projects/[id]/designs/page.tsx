"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGuest } from "@/components/providers/GuestProvider";
import { StyleSelector } from "@/components/designs/StyleSelector";

interface DesignFile {
  id: string;
  name: string;
  style: string;
  status: string;
  _count: { renders: number };
  renders: { imageUrl: string }[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  GENERATING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function DesignsPage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const projectId = params.id as string;

  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newStyle, setNewStyle] = useState("modern");
  const [newName, setNewName] = useState("");

  const { getProject: getGuestProject } = useGuest();

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") { router.push("/login"); return; }
    if (!isGuest && status !== "authenticated") return;

    if (isGuest) {
      const gp = getGuestProject(projectId);
      setDesigns((gp?.designFiles || []).map((d) => ({ ...d, createdAt: d.renders[0]?.createdAt || new Date().toISOString() })));
      setLoading(false);
      return;
    }

    fetch(`/api/projects/${projectId}/designs`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDesigns(data); })
      .finally(() => setLoading(false));
  }, [status, projectId, router, isGuest, getGuestProject]);

  async function handleCreate() {
    const res = await fetch(`/api/projects/${projectId}/designs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName || `Design - ${newStyle}`, style: newStyle }),
    });
    if (res.ok) {
      const design = await res.json();
      setOpen(false);
      router.push(`/projects/${projectId}/designs/${design.id}`);
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">{t("common.loading")}</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("designs.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
          >
            {t("designs.newDesign")}
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("designs.newDesign")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("designs.designName")}</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Design" />
              </div>
              <div className="space-y-2">
                <Label>{t("designs.style")}</Label>
                <StyleSelector selectedStyle={newStyle} onSelect={setNewStyle} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={handleCreate}>{t("common.create")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {designs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-4">No design files yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((design) => (
            <Link key={design.id} href={`/projects/${projectId}/designs/${design.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="w-full h-32 bg-muted rounded-md mb-2 overflow-hidden flex items-center justify-center">
                    {design.renders[0] ? (
                      <img src={design.renders[0].imageUrl} alt={design.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-muted-foreground/40">AI</span>
                    )}
                  </div>
                  <CardTitle className="text-sm">{design.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs dark:bg-amber-900/20 dark:text-amber-200">
                      {design.style}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[design.status] || ""}`}>
                      {t(`designs.${design.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{design._count.renders} renders</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

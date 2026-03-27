"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGuest } from "@/components/providers/GuestProvider";
import { FurnitureFromURL } from "@/components/elements/FurnitureFromURL";
import { FurnitureFromPhoto } from "@/components/elements/FurnitureFromPhoto";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";

interface Element {
  id: string;
  name: string;
  type: string;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  furnitureUrl: string | null;
  furnitureData: Record<string, string> | null;
}

const ELEMENT_TYPES = ["sofa", "bed", "table", "chair", "desk", "shelf", "lamp", "rug", "cabinet", "other"];

export default function ElementsPage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const projectId = params.id as string;

  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("sofa");
  const [formWidth, setFormWidth] = useState("1.0");
  const [formHeight, setFormHeight] = useState("1.0");
  const [formUrl, setFormUrl] = useState("");
  const [formStore, setFormStore] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formMaterial, setFormMaterial] = useState("");
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showPhotoImport, setShowPhotoImport] = useState(false);

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") { router.push("/login"); return; }
    if (!isGuest && status !== "authenticated") return;
    fetchElements();
  }, [status, projectId, router]);

  function fetchElements() {
    fetch(`/api/projects/${projectId}/elements`)
      .then((r) => r.json())
      .then(setElements)
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    const ppm = 100; // default scale
    const newElement = {
      id: `el-${Date.now()}`,
      name: formName,
      type: formType,
      x: 100,
      y: 100,
      width: parseFloat(formWidth) * ppm,
      height: parseFloat(formHeight) * ppm,
      rotation: 0,
      furnitureUrl: formUrl || undefined,
      furnitureData: {
        ...(formStore && { store: formStore }),
        ...(formPrice && { price: formPrice }),
        ...(formColor && { color: formColor }),
        ...(formMaterial && { material: formMaterial }),
      },
    };

    // Save via batch update (append to existing)
    const allElements = [
      ...elements.map((el) => ({
        id: el.id,
        name: el.name,
        type: el.type,
        x: el.positionX || 0,
        y: el.positionY || 0,
        width: el.width || 100,
        height: el.height || 100,
        rotation: el.rotation || 0,
        furnitureUrl: el.furnitureUrl || undefined,
        furnitureData: el.furnitureData || undefined,
      })),
      newElement,
    ];

    const res = await fetch(`/api/projects/${projectId}/elements`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elements: allElements }),
    });

    if (res.ok) {
      toast.success("Element added");
      setOpen(false);
      resetForm();
      fetchElements();
    }
  }

  async function handleDelete(elementId: string) {
    const remaining = elements
      .filter((el) => el.id !== elementId)
      .map((el) => ({
        id: el.id,
        name: el.name,
        type: el.type,
        x: el.positionX || 0,
        y: el.positionY || 0,
        width: el.width || 100,
        height: el.height || 100,
        rotation: el.rotation || 0,
        furnitureUrl: el.furnitureUrl || undefined,
        furnitureData: el.furnitureData || undefined,
      }));

    await fetch(`/api/projects/${projectId}/elements`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elements: remaining }),
    });
    toast.success("Element deleted");
    fetchElements();
  }

  function resetForm() {
    setFormName(""); setFormType("sofa"); setFormWidth("1.0"); setFormHeight("1.0");
    setFormUrl(""); setFormStore(""); setFormPrice(""); setFormColor(""); setFormMaterial("");
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">{t("common.loading")}</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t("elements.title")}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowUrlImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg surface-container-high hover:shadow-ambient transition-all"
            style={{ color: "#6f5100" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>link</span>
            Import from URL
          </button>
          <button onClick={() => setShowPhotoImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg surface-container-high hover:shadow-ambient transition-all"
            style={{ color: "#6f5100" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_a_photo</span>
            Import from Photo
          </button>
          <Link href={`/projects/${projectId}/elements/create`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg surface-container-high hover:shadow-ambient transition-all"
            style={{ color: "#6f5100" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
            Create Custom
          </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-full transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #6f5100, #8b6914)" }}
          >
            {t("elements.addElement")}
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("elements.addElement")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("elements.name")}</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Living room sofa" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("elements.type")}</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  {ELEMENT_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`elements.types.${type}`)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width (m)</Label>
                  <Input type="number" step="0.01" value={formWidth} onChange={(e) => setFormWidth(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Depth (m)</Label>
                  <Input type="number" step="0.01" value={formHeight} onChange={(e) => setFormHeight(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("elements.link")}</Label>
                <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://store.com/product" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("elements.store")}</Label>
                  <Input value={formStore} onChange={(e) => setFormStore(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("elements.price")}</Label>
                  <Input value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("elements.color")}</Label>
                  <Input value={formColor} onChange={(e) => setFormColor(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("elements.material")}</Label>
                  <Input value={formMaterial} onChange={(e) => setFormMaterial(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={handleCreate} disabled={!formName}>{t("common.create")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Import dialogs */}
      {showUrlImport && (
        <FurnitureFromURL projectId={projectId} onClose={() => setShowUrlImport(false)} onCreated={fetchElements} />
      )}
      {showPhotoImport && (
        <FurnitureFromPhoto projectId={projectId} onClose={() => setShowPhotoImport(false)} onCreated={fetchElements} />
      )}

      {elements.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No furniture elements yet</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">{t("elements.name")}</th>
                <th className="text-left p-3 font-medium">{t("elements.type")}</th>
                <th className="text-left p-3 font-medium">{t("elements.dimensions")}</th>
                <th className="text-left p-3 font-medium">{t("elements.link")}</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {elements.map((el) => (
                <tr key={el.id} className="border-t">
                  <td className="p-3 font-medium">{el.name}</td>
                  <td className="p-3">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">{t(`elements.types.${el.type}`)}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {el.width && el.height
                      ? `${(el.width / 100).toFixed(1)} x ${(el.height / 100).toFixed(1)}m`
                      : "-"}
                  </td>
                  <td className="p-3">
                    {el.furnitureUrl ? (
                      <a href={el.furnitureUrl} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline text-xs truncate block max-w-40">
                        {el.furnitureUrl}
                      </a>
                    ) : "-"}
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(el.id)} className="text-red-600 hover:text-red-700">
                      {t("common.delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

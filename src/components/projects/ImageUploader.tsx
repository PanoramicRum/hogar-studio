"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGuest } from "@/components/providers/GuestProvider";

interface ImageUploaderProps {
  projectId: string;
  onUploadComplete: () => void;
}

export function ImageUploader({ projectId, onUploadComplete }: ImageUploaderProps) {
  const t = useTranslations();
  const { isGuest, getProject, updateProject } = useGuest();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageType, setImageType] = useState<"PHOTO" | "FLOOR_PLAN">("PHOTO");

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true);

      for (const file of Array.from(files)) {
        try {
          // Step 1: Upload to S3 (works for both guest and authenticated)
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", projectId);

          const headers: Record<string, string> = {};
          if (isGuest) headers["x-guest-mode"] = "true";

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers,
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            toast.error(err.error || "Upload failed");
            continue;
          }

          const uploadData = await uploadRes.json();

          if (isGuest) {
            // Store image record in guest context
            const gp = getProject(projectId);
            if (gp) {
              updateProject(projectId, {
                images: [
                  ...gp.images,
                  {
                    id: `img-${Date.now()}`,
                    type: imageType,
                    url: uploadData.url,
                    filename: uploadData.filename,
                    metadata: {
                      width: uploadData.width,
                      height: uploadData.height,
                      key: uploadData.key,
                      thumbnailKey: uploadData.thumbnailKey,
                      thumbnailUrl: uploadData.thumbnailUrl,
                    },
                  },
                ],
              });
            }
          } else {
            // Step 2: Save image record via API
            await fetch(`/api/projects/${projectId}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: uploadData.url,
                filename: uploadData.filename,
                type: imageType,
                metadata: {
                  width: uploadData.width,
                  height: uploadData.height,
                  key: uploadData.key,
                  thumbnailKey: uploadData.thumbnailKey,
                  thumbnailUrl: uploadData.thumbnailUrl,
                },
              }),
            });
          }

          toast.success(`${file.name} uploaded`);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setUploading(false);
      onUploadComplete();
    },
    [projectId, imageType, onUploadComplete, isGuest, getProject, updateProject]
  );

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">{t("images.type")}:</label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={imageType === "PHOTO" ? "default" : "outline"}
            onClick={() => setImageType("PHOTO")}
          >
            {t("images.photo")}
          </Button>
          <Button
            size="sm"
            variant={imageType === "FLOOR_PLAN" ? "default" : "outline"}
            onClick={() => setImageType("FLOOR_PLAN")}
          >
            {t("images.floorPlan")}
          </Button>
        </div>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="space-y-2">
          <span className="material-symbols-outlined text-muted-foreground/40" style={{ fontSize: "32px" }}>cloud_upload</span>
          <p className="text-sm text-muted-foreground">
            {uploading ? t("common.loading") : t("images.dragDrop")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("images.formats")} &middot; {t("images.maxSize")}
          </p>
        </div>
      </div>
    </div>
  );
}

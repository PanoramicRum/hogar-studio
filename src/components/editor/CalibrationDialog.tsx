"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEditorStore } from "@/stores/editorStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CalibrationDialog() {
  const t = useTranslations("editor");
  const { calibrationPoints, setScale, resetCalibration } = useEditorStore();
  const [distance, setDistance] = useState("");

  if (calibrationPoints.length < 2) return null;

  const pixelDist = Math.sqrt(
    Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) +
    Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
  );

  function handleConfirm() {
    const meters = parseFloat(distance);
    if (meters > 0) {
      setScale({
        pixelsPerMeter: pixelDist / meters,
        calibrated: true,
      });
      resetCalibration();
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-background border rounded-lg shadow-lg p-4 w-80">
      <p className="text-sm mb-3">{t("calibrateInstructions")}</p>
      <p className="text-xs text-muted-foreground mb-2">
        Pixel distance: {Math.round(pixelDist)}px
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{t("distanceMeters")}</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="2.80"
            className="h-8"
            autoFocus
          />
        </div>
        <Button size="sm" onClick={handleConfirm} disabled={!distance || parseFloat(distance) <= 0}>
          {t("calibrate")}
        </Button>
        <Button size="sm" variant="outline" onClick={resetCalibration}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

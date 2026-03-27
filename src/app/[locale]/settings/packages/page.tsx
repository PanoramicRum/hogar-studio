"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PackageCard } from "@/components/packages/PackageCard";
import { useGuest } from "@/components/providers/GuestProvider";

interface PackageInfo {
  id: string;
  name: string;
  type: string;
  version: string;
  description: string;
  author: { name: string; url?: string };
  license: string;
  tags?: string[];
  styleCount: number;
  furnitureCount: number;
}

export default function PackagesPage() {
  const { status } = useSession();
  const { isGuest } = useGuest();
  const router = useRouter();
  const t = useTranslations();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest && status === "unauthenticated") { router.push("/login"); return; }
    if (!isGuest && status !== "authenticated") return;

    fetch("/api/packages")
      .then((r) => r.json())
      .then(setPackages)
      .finally(() => setLoading(false));
  }, [status, router, isGuest]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">{t("common.loading")}</p></div>;
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
        <p className="text-muted-foreground mt-1">
          Installed packages providing styles and furniture for your projects
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Installed Packages</h2>
        <p className="text-sm text-muted-foreground">
          Add packages by placing them in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">packages/</code> directory and restarting the app.
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No packages installed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      <div className="border-t pt-6 space-y-2">
        <h2 className="text-lg font-semibold">Create Your Own Package</h2>
        <p className="text-sm text-muted-foreground">
          Create a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">hogar-package.json</code> manifest
          in a new directory under <code className="bg-muted px-1.5 py-0.5 rounded text-xs">packages/</code>.
          See the community repository for templates and examples.
        </p>
      </div>
    </div>
  );
}

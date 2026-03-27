import type { Metadata } from "next";
import SharePageClient from "./SharePageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const baseUrl = process.env.AUTH_URL || "http://localhost:3100";
    const res = await fetch(`${baseUrl}/api/shares/${id}`, { cache: "no-store" });
    if (!res.ok) return { title: "Hogar Studio — Shared Design" };

    const data = await res.json();

    return {
      title: `${data.projectName} — Hogar Studio`,
      description: `Interior design${data.roomName ? ` — ${data.roomName}` : ""}${data.style ? ` in ${data.style} style` : ""}. Created with Hogar Studio.`,
      openGraph: {
        title: `${data.projectName} — Hogar Studio`,
        description: `Check out this interior design${data.roomName ? ` of ${data.roomName}` : ""}. What do you think?`,
        images: data.imageUrl ? [{ url: data.imageUrl, width: 1024, height: 1024 }] : [],
        type: "article",
        siteName: "Hogar Studio",
      },
      twitter: {
        card: "summary_large_image",
        title: `${data.projectName} — Hogar Studio`,
        description: `Interior design render. Share your opinion!`,
        images: data.imageUrl ? [data.imageUrl] : [],
      },
    };
  } catch {
    return { title: "Hogar Studio — Shared Design" };
  }
}

export default function SharePage() {
  return <SharePageClient />;
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "newest";

  const where: Record<string, unknown> = { published: true };
  if (type) where.type = type;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const orderBy = sort === "popular" ? { downloads: "desc" as const }
    : sort === "rating" ? { rating: "desc" as const }
    : { createdAt: "desc" as const };

  const items = await prisma.marketplaceItem.findMany({
    where,
    include: {
      user: { select: { name: true } },
      _count: { select: { reviews: true } },
    },
    orderBy,
    take: 50,
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, title, description, previewImageUrl, data } = await request.json();

  if (!type || !title || !data) {
    return NextResponse.json({ error: "type, title, and data are required" }, { status: 400 });
  }

  const item = await prisma.marketplaceItem.create({
    data: {
      userId: session.user.id,
      type,
      title,
      description: description || "",
      previewImageUrl: previewImageUrl || null,
      data,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const providers = await prisma.furnitureProvider.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(providers);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, website, country, zone, categories, logoUrl } = await request.json();

  if (!name || !website || !country || !zone) {
    return NextResponse.json({ error: "name, website, country, zone required" }, { status: 400 });
  }

  const provider = await prisma.furnitureProvider.create({
    data: {
      name, website, country, zone,
      categories: categories || [],
      logoUrl: logoUrl || null,
    },
  });

  return NextResponse.json(provider, { status: 201 });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  const { furnitureType, furnitureName, zone } = await request.json();

  if (!furnitureType) {
    return NextResponse.json({ error: "furnitureType required" }, { status: 400 });
  }

  // Determine user zone
  const userZone = zone || (session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { zone: true } }))?.zone
    : null) || "global";

  // Find matching products from providers in the user's zone
  const products = await prisma.providerProduct.findMany({
    where: {
      category: { contains: furnitureType, mode: "insensitive" },
      provider: {
        active: true,
        OR: [
          { zone: userZone },
          { zone: "global" },
        ],
      },
    },
    include: {
      provider: { select: { name: true, website: true, logoUrl: true, zone: true } },
    },
    orderBy: { price: "asc" },
    take: 10,
  });

  return NextResponse.json(products);
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    include: {
      user: { select: { name: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// Install (increment downloads)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { downloads: { increment: 1 } },
  });

  const item = await prisma.marketplaceItem.findUnique({ where: { id: itemId } });
  return NextResponse.json({ data: item?.data });
}

// Review
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  const { rating, comment } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating 1-5 required" }, { status: 400 });
  }

  const review = await prisma.marketplaceReview.upsert({
    where: { itemId_userId: { itemId, userId: session.user.id } },
    create: { itemId, userId: session.user.id, rating, comment },
    update: { rating, comment },
  });

  // Update average rating
  const avg = await prisma.marketplaceReview.aggregate({
    where: { itemId },
    _avg: { rating: true },
  });
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { rating: avg._avg.rating || 0 },
  });

  return NextResponse.json(review);
}

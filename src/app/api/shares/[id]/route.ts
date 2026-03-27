import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const share = await prisma.sharedLink.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "desc" } },
      user: { select: { name: true } },
    },
  });

  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // Increment view count
  await prisma.sharedLink.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json(share);
}

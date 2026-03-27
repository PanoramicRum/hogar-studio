import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const shareSchema = z.object({
  imageUrl: z.string().url("Valid image URL required"),
  projectName: z.string().max(200).optional(),
  roomName: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  perspective: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  expiresInDays: z.number().positive().max(365).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { imageUrl, projectName, roomName, style, perspective, description, expiresInDays } = parsed.data;

  const share = await prisma.sharedLink.create({
    data: {
      userId: session.user.id,
      imageUrl,
      projectName: projectName || "Untitled",
      roomName: roomName || null,
      style: style || null,
      perspective: perspective || null,
      description: description || null,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null,
    },
  });

  return NextResponse.json({ id: share.id, url: `/share/${share.id}` }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shares = await prisma.sharedLink.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shares);
}

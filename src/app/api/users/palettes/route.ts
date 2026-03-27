import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([]);

  const palettes = await prisma.colorPalette.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(palettes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, colors, projectId } = await request.json();

  if (!name || !colors) {
    return NextResponse.json({ error: "Name and colors are required" }, { status: 400 });
  }

  const palette = await prisma.colorPalette.create({
    data: {
      userId: session.user.id,
      projectId: projectId || null,
      name,
      colors,
    },
  });

  return NextResponse.json(palette, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  await prisma.colorPalette.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ success: true });
}

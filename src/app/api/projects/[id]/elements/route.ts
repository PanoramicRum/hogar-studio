import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const elements = await prisma.projectElement.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(elements);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { elements } = await request.json();

  // Delete all existing elements and recreate (batch upsert)
  await prisma.projectElement.deleteMany({ where: { projectId: id } });

  if (elements && elements.length > 0) {
    await prisma.projectElement.createMany({
      data: elements.map((el: {
        id: string;
        name: string;
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        furnitureUrl?: string;
        furnitureData?: Record<string, unknown>;
      }) => ({
        id: el.id,
        projectId: id,
        name: el.name,
        type: el.type,
        positionX: el.x,
        positionY: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
        furnitureUrl: el.furnitureUrl || null,
        furnitureData: el.furnitureData || null,
      })),
    });
  }

  return NextResponse.json({ success: true, count: elements?.length || 0 });
}

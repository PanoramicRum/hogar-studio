import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isGuestMode) {
    const project = await prisma.project.findFirst({
      where: { id, userId: session!.user!.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const { name, type, width, height, height3d, color, furnitureUrl, furnitureData, imageUrl } = await request.json();

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const element = await prisma.projectElement.create({
    data: {
      projectId: id,
      name,
      type,
      width: width || 100,
      height: height || 100,
      height3d: height3d || 0.6,
      color: color || null,
      furnitureUrl: furnitureUrl || null,
      furnitureData: furnitureData || null,
      imageUrl: imageUrl || null,
      isCustom: true,
      positionX: 0,
      positionY: 0,
    },
  });

  return NextResponse.json(element, { status: 201 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const elements = await prisma.projectElement.findMany({
    where: { projectId: id, isCustom: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(elements);
}

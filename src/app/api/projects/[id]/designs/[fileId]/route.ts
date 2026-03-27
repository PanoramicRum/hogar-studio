import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;

  const designFile = await prisma.designFile.findFirst({
    where: {
      id: fileId,
      project: { id, userId: session.user.id },
    },
    include: {
      renders: { orderBy: { createdAt: "desc" } },
      project: { select: { images: { orderBy: { createdAt: "desc" } } } },
    },
  });

  if (!designFile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(designFile);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;
  const existing = await prisma.designFile.findFirst({
    where: { id: fileId, project: { id, userId: session.user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, style, aiParams } = await request.json();

  const designFile = await prisma.designFile.update({
    where: { id: fileId },
    data: {
      ...(name !== undefined && { name }),
      ...(style !== undefined && { style }),
      ...(aiParams !== undefined && { aiParams }),
    },
  });

  return NextResponse.json(designFile);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;
  const existing = await prisma.designFile.findFirst({
    where: { id: fileId, project: { id, userId: session.user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.designFile.delete({ where: { id: fileId } });
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const styles = await prisma.userStyle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(styles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, prompt, negativePrompt, color } = await request.json();

  if (!name || !prompt) {
    return NextResponse.json({ error: "Name and prompt are required" }, { status: 400 });
  }

  const style = await prisma.userStyle.create({
    data: {
      userId: session.user.id,
      name,
      prompt,
      negativePrompt: negativePrompt || "blurry, distorted, low quality",
      color: color || "#6b7280",
    },
  });

  return NextResponse.json(style, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  await prisma.userStyle.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ success: true });
}

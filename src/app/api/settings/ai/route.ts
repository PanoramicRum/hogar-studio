import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProviderKeyStatus, saveUserKey, removeUserKey } from "@/lib/ai-keys";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || null;

  const keyStatus = await getProviderKeyStatus(userId);
  const settings = userId
    ? await prisma.userSettings.findUnique({ where: { userId }, select: { defaultDigitizer: true, defaultGenerator: true } })
    : null;

  return NextResponse.json({
    keys: keyStatus,
    defaults: {
      digitizer: settings?.defaultDigitizer || "auto",
      generator: settings?.defaultGenerator || "auto",
    },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save API keys" }, { status: 401 });
  }

  const body = await request.json();

  // Save a provider key
  if (body.provider && body.key) {
    try {
      await saveUserKey(session.user.id, body.provider, body.key);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
    }
  }

  // Save default provider preferences
  if (body.defaultDigitizer !== undefined || body.defaultGenerator !== undefined) {
    const data: Record<string, string | null> = {};
    if (body.defaultDigitizer !== undefined) data.defaultDigitizer = body.defaultDigitizer === "auto" ? null : body.defaultDigitizer;
    if (body.defaultGenerator !== undefined) data.defaultGenerator = body.defaultGenerator === "auto" ? null : body.defaultGenerator;

    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });
  }

  const keyStatus = await getProviderKeyStatus(session.user.id);
  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id }, select: { defaultDigitizer: true, defaultGenerator: true } });

  return NextResponse.json({
    keys: keyStatus,
    defaults: {
      digitizer: settings?.defaultDigitizer || "auto",
      generator: settings?.defaultGenerator || "auto",
    },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage API keys" }, { status: 401 });
  }

  const { provider } = await request.json();
  if (!provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  try {
    await removeUserKey(session.user.id, provider);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }

  const keyStatus = await getProviderKeyStatus(session.user.id);
  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id }, select: { defaultDigitizer: true, defaultGenerator: true } });

  return NextResponse.json({
    keys: keyStatus,
    defaults: {
      digitizer: settings?.defaultDigitizer || "auto",
      generator: settings?.defaultGenerator || "auto",
    },
  });
}

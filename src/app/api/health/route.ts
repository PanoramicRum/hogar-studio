import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  // S3/MinIO
  try {
    const res = await fetch(`${process.env.S3_ENDPOINT || "http://storage:9000"}/minio/health/live`, { signal: AbortSignal.timeout(3000) });
    checks.storage = res.ok ? "ok" : "error";
  } catch {
    checks.storage = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}

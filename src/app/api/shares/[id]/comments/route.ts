import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

const commentSchema = z.object({
  authorName: z.string().min(1, "Name is required").max(100),
  text: z.string().min(1, "Comment is required").max(2000),
  reaction: z.enum(["love", "like", "hmm", "change"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const { id } = await params;
  const { allowed } = rateLimit(ip, 5, 3600000, `comment:${id}`); // 5 per hour per share
  if (!allowed) return rateLimitResponse();

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const share = await prisma.sharedLink.findUnique({ where: { id } });
  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comment = await prisma.shareComment.create({
    data: {
      shareId: id,
      authorName: parsed.data.authorName.trim(),
      text: parsed.data.text.trim(),
      reaction: parsed.data.reaction || null,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

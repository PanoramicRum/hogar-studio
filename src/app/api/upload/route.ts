import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/s3";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const isGuestMode = request.headers.get("x-guest-mode") === "true";
  const session = await auth();
  if (!isGuestMode && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPG, PNG, or WEBP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Max 20MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");

  // Upload original
  const originalKey = `projects/${projectId}/${timestamp}-${baseName}.${ext}`;
  const originalUrl = await uploadFile(buffer, originalKey, file.type);

  // Generate and upload thumbnail
  const thumbnailBuffer = await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const thumbnailKey = `projects/${projectId}/thumbnails/${timestamp}-${baseName}.jpg`;
  const thumbnailUrl = await uploadFile(thumbnailBuffer, thumbnailKey, "image/jpeg");

  // Get image metadata
  const metadata = await sharp(buffer).metadata();

  return NextResponse.json({
    url: originalUrl,
    thumbnailUrl,
    filename: file.name,
    key: originalKey,
    thumbnailKey,
    width: metadata.width,
    height: metadata.height,
  });
}

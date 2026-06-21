import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = formData.get("type") as string || "avatar"; // avatar or banner

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = file.name.split(".").pop();
    const filename = `${uploadType}-${session.user.id}-${uniqueSuffix}.${extension}`;

    // Ensure the upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // already exists
    }

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    // Update user profile image in the database if it's an avatar upload
    if (uploadType === "avatar") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: fileUrl },
      });
    }

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error("File upload failed:", error);
    return NextResponse.json({ error: error.message || "File upload failed" }, { status: 500 });
  }
}
import { prisma } from "@/lib/db";

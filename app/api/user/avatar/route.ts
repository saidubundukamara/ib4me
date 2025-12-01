import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { CloudinaryService } from "@/lib/cloudinary";

// POST /api/user/avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse FormData (file upload)
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5MB" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await CloudinaryService.uploadBuffer(buffer, {
      folder: `users/${userId}/avatar`,
      resource_type: "image",
    });

    return NextResponse.json({
      message: "Avatar uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

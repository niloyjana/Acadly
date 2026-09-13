import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership } from "@/lib/permissions";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// Fail loudly at import time if these aren't configured — a silent
// "placeholder" fallback would let uploads appear to work while quietly
// hitting a fake host, which is far harder to debug than a startup crash.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const spaceId = formData.get("spaceId") as string | null;

    if (!file || !spaceId) {
      return NextResponse.json({ error: "File and spaceId are required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be smaller than 20 MB." }, { status: 413 });
    }

    await requireMembership(spaceId, userId);

    const ext = file.name.split('.').pop();
    const storageKey = `${spaceId}/${userId}-${nanoid(10)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Security: Verify magic numbers instead of trusting client MIME type (PRD §19)
    const { fileTypeFromBuffer } = await import("file-type");
    const typeInfo = await fileTypeFromBuffer(buffer);
    const safeMimeType = typeInfo?.mime || "application/octet-stream";

    const { error: uploadError } = await supabase.storage
      .from("acadly-submissions")
      .upload(storageKey, buffer, {
        contentType: safeMimeType,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "File upload failed." }, { status: 500 });
    }

    const fileAsset = await prisma.fileAsset.create({
      data: {
        uploaderId: userId,
        spaceId: spaceId,
        filename: file.name,
        storageKey,
        fileType: safeMimeType,
        size: file.size,
      },
    });

    return NextResponse.json({ fileId: fileAsset.id }, { status: 201 });
  });
}

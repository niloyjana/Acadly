import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership } from "@/lib/permissions";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const spaceId = formData.get("spaceId") as string | null;

    if (!file || !spaceId) {
      return NextResponse.json({ error: "File and spaceId are required" }, { status: 400 });
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

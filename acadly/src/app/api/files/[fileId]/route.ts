import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, withApiErrors } from "@/lib/api-helpers";
import { requireMembership, NotFoundError } from "@/lib/permissions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  return withApiErrors(async () => {
    const userId = await requireUserId();
    const fileAsset = await prisma.fileAsset.findUnique({
      where: { id: params.fileId },
    });
    
    if (!fileAsset) throw new NotFoundError("File not found.");

    // Must be an active member of the space the file belongs to
    await requireMembership(fileAsset.spaceId, userId);

    // Create a short-lived signed URL for downloading
    const { data, error } = await supabase.storage
      .from("acadly-submissions")
      .createSignedUrl(fileAsset.storageKey, 60 * 5); // 5 minutes

    if (error || !data) {
      console.error("Supabase signed URL error:", error);
      return NextResponse.json({ error: "Could not generate download link." }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  });
}

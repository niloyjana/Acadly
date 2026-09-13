import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/permissions";

/** Reads the signed-in user's id from the JWT session, or throws 401. */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError("Sign in required.");
  return session.user.id;
}

/**
 * Wraps a route handler so every thrown permission/lookup error becomes the
 * right HTTP status with a plain-language message (PRD §46: no stack traces
 * to the user), instead of every route hand-rolling its own try/catch.
 */
export function withApiErrors(handler: () => Promise<NextResponse>) {
  return handler().catch((err: unknown) => {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError || err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  });
}

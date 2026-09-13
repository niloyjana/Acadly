import { withAuth } from "next-auth/middleware";

// Protects everything under the (app) group. API routes enforce their own
// auth via requireUserId() so they return clean JSON 401s instead of a
// redirect. See PRD §31: "Authorization must be enforced on the backend."
export default withAuth({
  pages: { signIn: "/" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/spaces/:path*",
    "/join/:path*",
    "/create-space/:path*",
  ],
};

import { prisma } from "@/lib/prisma";
import type { GroupRole, SpaceMember } from "@prisma/client";

/**
 * PRD §12: "Frontend button visibility alone is NOT considered security."
 * Every protected API route must call requireMembership()/requireRole()
 * from here — never trust a role or spaceId sent from the client body.
 */

export class ForbiddenError extends Error {
  status = 403;
}
export class UnauthorizedError extends Error {
  status = 401;
}
export class NotFoundError extends Error {
  status = 404;
}

const ROLE_RANK: Record<GroupRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  TEAM_LEAD: 2,
  CORE_ORGANIZER: 3,
  OWNER: 4,
};

/** Fetches the caller's ACTIVE membership row for a space, or null. */
export async function getActiveMembership(
  spaceId: string,
  userId: string
): Promise<SpaceMember | null> {
  return prisma.spaceMember.findFirst({
    where: { spaceId, userId, status: "ACTIVE" },
  });
}

/** Throws if the user has no active membership in the space. Returns the membership otherwise. */
export async function requireMembership(spaceId: string, userId: string) {
  const membership = await getActiveMembership(spaceId, userId);
  if (!membership) {
    throw new ForbiddenError("You are not an active member of this space.");
  }
  return membership;
}

/** Throws unless the caller's role is at least `minRole` in the role hierarchy. */
export async function requireRole(spaceId: string, userId: string, minRole: GroupRole) {
  const membership = await requireMembership(spaceId, userId);
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`This action requires the ${minRole} role or higher.`);
  }
  return membership;
}

// ---- Named capability checks (PRD §6 role tables) ----

export const can = {
  manageSpace: (role: GroupRole) => role === "OWNER",
  regenerateInviteCode: (role: GroupRole) => role === "OWNER",
  approveMembers: (role: GroupRole) => ROLE_RANK[role] >= ROLE_RANK.CORE_ORGANIZER,
  createEvent: (role: GroupRole) => ROLE_RANK[role] >= ROLE_RANK.CORE_ORGANIZER,
  createTask: (role: GroupRole) => ROLE_RANK[role] >= ROLE_RANK.TEAM_LEAD,
  reviewSubmission: (role: GroupRole) => ROLE_RANK[role] >= ROLE_RANK.TEAM_LEAD,
  submitTask: (role: GroupRole) => ROLE_RANK[role] >= ROLE_RANK.MEMBER,
  viewSpace: (role: GroupRole) => ROLE_RANK[role] >= ROLE_RANK.VIEWER,
};

import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@aratc/database";
import { config } from "../../config";
import { ApiError, UnauthorizedError, ValidationError } from "../../lib/errors";
import {
  type LoginInput,
  type RegisterInput,
  SELF_SERVICE_ROLES,
  type SelfServiceRole,
} from "@aratc/shared";

/**
 * Resolve the role a visitor may self-assign at registration.
 *
 * SECURITY: this is the authoritative server-side check. Even though the
 * shared registerSchema restricts accountType, the service never trusts
 * upstream validation — only roles in SELF_SERVICE_ROLES are permitted.
 * Privileged roles (content_admin, school_admin, super_admin) can only be
 * granted by an existing admin through the admin users UI.
 */
export function resolveSelfServiceRole(accountType: unknown): SelfServiceRole {
  if (accountType === undefined || accountType === null || accountType === "") {
    return "student";
  }
  if (
    typeof accountType === "string" &&
    (SELF_SERVICE_ROLES as readonly string[]).includes(accountType)
  ) {
    return accountType as SelfServiceRole;
  }
  throw new ValidationError("Invalid account type");
}

export async function registerUser(input: RegisterInput) {
  // Check if email already exists (production-ready: returns clear error)
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ValidationError("Email already registered");
  }

  const passwordHash = await hash(input.password, 10);

  // Assign role — server-side allowlist only (see resolveSelfServiceRole)
  const roleName = resolveSelfServiceRole(input.accountType);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      status: "ACTIVE",
      roles: {
        create: {
          role: {
            connect: { name: roleName },
          },
        },
      },
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  const learnerProfile = await prisma.learnerProfile.create({
    data: {
      userId: user.id,
      currentStage: "BASIC_EDUCATION",
      currentGradeLevel: "GRADE_7",
    },
  });

  const roles = user.roles.map((ur) => ur.role.name);
  const token = generateToken(user.id, roles);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    },
    learnerProfile,
    // Additive field (organization switcher / active org context).
    memberships: [],
    token,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      learnerProfile: true,
      // Additive: return active memberships so the frontend can auto-select an
      // organization context (and populate the org switcher) immediately on
      // login, before /api/me is fetched.
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          organization: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isPasswordValid = await compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new UnauthorizedError("Account is not active");
  }

  const roles = user.roles.map((ur) => ur.role.name);
  const token = generateToken(user.id, roles);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    },
    learnerProfile: user.learnerProfile,
    // Additive field (organization switcher / active org context).
    memberships: user.memberships.map((m) => ({
      id: m.id,
      role: m.role,
      organization: m.organization,
    })),
    token,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      learnerProfile: {
        include: {
          currentProgram: true,
        },
      },
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          organization: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((ur) => ur.role.name),
    learnerProfile: user.learnerProfile,
    // Additive field — organization switcher data. Empty until memberships exist.
    memberships: user.memberships.map((m) => ({
      id: m.id,
      role: m.role,
      organization: m.organization,
    })),
  };
}

function generateToken(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@aratc/database";
import { config } from "../../config";
import { ApiError, UnauthorizedError, ValidationError } from "../../lib/errors";
import type { LoginInput, RegisterInput } from "@aratc/shared";

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ValidationError("Email already registered");
  }

  const passwordHash = await hash(input.password, 10);

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
            connect: { name: "student" },
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
  };
}

function generateToken(userId: string, roles: string[]): string {
  return jwt.sign({ userId, roles }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

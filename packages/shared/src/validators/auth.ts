import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Roles a visitor may self-assign at registration.
 *
 * This mirrors the shared registerSchema enum, but the backend NEVER trusts
 * upstream validation alone (defense in depth): the service re-checks every
 * registration role here, so admin-level roles can never be self-assigned
 * even if validation rules change or a client bypasses the schema.
 */
export const SELF_SERVICE_ROLES = ["student", "parent", "teacher"] as const;

export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    accountType: z.enum(["student", "parent", "teacher"]).default("student"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const ROLES = {
  STUDENT: "student",
  PARENT: "parent",
  TEACHER: "teacher",
  SCHOOL_ADMIN: "school_admin",
  CONTENT_ADMIN: "content_admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

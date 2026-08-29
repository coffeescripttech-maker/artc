declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRoles?: string[];
      /** Set by resolveOrgContext middleware after server-side membership verification. */
      organizationId?: string;
      membership?: {
        role: string;
      };
    }
  }
}

export {};

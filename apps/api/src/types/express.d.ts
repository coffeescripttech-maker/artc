declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRoles?: string[];
    }
  }
}

export {};

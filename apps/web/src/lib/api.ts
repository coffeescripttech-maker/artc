const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const activeOrg =
    typeof window !== "undefined"
      ? localStorage.getItem("activeOrganizationId")
      : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Attach verified org context only for authenticated, non-auth requests.
  // The org-context middleware requires auth, so adding the header on
  // login/register would reject them.
  if (token && activeOrg && !path.startsWith("/api/auth/")) {
    headers.set("x-organization-id", activeOrg);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      typeof data.error === "object" && data.error && "message" in data.error
        ? String(data.error.message)
        : "Something went wrong";
    throw new Error(message);
  }

  return data;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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

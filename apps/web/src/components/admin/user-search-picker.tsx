"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Input } from "@/components/ui";
import { Loader2, Search, X } from "lucide-react";

export interface SearchedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

/**
 * Debounced user-search picker used by membership forms ("Assign
 * organization admin", "Add Member"). Replaces paste-a-raw-user-ID with
 * type-name/email-and-pick. Backed by GET /api/organizations/users/search
 * (authorized for platform admins + org OWNER/ADMIN — enforced server-side).
 */
export function UserSearchPicker({
  onSelect,
  placeholder = "Search by name or email…",
}: {
  onSelect: (user: SearchedUser | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchedUser | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (selected) return; // don't search while a user is chosen
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = (await apiRequest(
          `/api/organizations/users/search?q=${encodeURIComponent(q)}`,
        )) as { users: SearchedUser[] };
        setResults(data.users ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {selected.firstName} {selected.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
        </div>
        <button
          type="button"
          aria-label="Clear selection"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelected(null);
            setQuery("");
            setResults([]);
            onSelect(null);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/60"
              onClick={() => {
                setSelected(u);
                setOpen(false);
                onSelect(u);
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                {(u.firstName?.[0] ?? "?") + (u.lastName?.[0] ?? "")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.firstName} {u.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              {u.roles.length > 0 && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {u.roles[0].replace(/_/g, " ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-lg">
          No users found for “{query.trim()}”
        </div>
      )}
    </div>
  );
}

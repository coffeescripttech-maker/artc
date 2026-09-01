"use client";

// CS#23.3 — hook that resolves which organizations the signed-in user can
// administer (platform admins: every org; otherwise OWNER/ADMIN memberships).
// Org-scoped pages use this instead of trusting an organizationId from the URL.

import { useCallback, useEffect, useState } from "react";
import {
  fetchMyMemberships,
  fetchOrganizations,
  getActiveOrgId,
  setActiveOrgId,
  MyMembership,
  OrganizationWithCounts,
} from "./org-api";

export interface ManageableOrgsState {
  loading: boolean;
  error: string | null;
  isPlatformAdmin: boolean;
  organizations: OrganizationWithCounts[];
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
}

export function useManageableOrgs(): ManageableOrgsState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationWithCounts[]>([]);
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMyMemberships();
        if (cancelled) return;
        const adminRoles: OrganizationWithCounts[] = me
          .filter((m) => m.role === "OWNER" || m.role === "ADMIN")
          .map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            type: m.organization.type,
            memberCount: 0,
            programCount: 0,
          }));

        let list: OrganizationWithCounts[];
        try {
          const orgList = await fetchOrganizations();
          if (cancelled) return;
          setIsPlatformAdmin(true);
          const known = new Set(orgList.map((o) => o.id));
          list = [...orgList, ...adminRoles.filter((a) => !known.has(a.id))];
        } catch {
          // Not a platform admin — fall back to manageable orgs only.
          list = adminRoles;
        }
        if (cancelled) return;
        setOrganizations(list);

        const persisted = getActiveOrgId();
        const fromPersisted = list.find((o) => o.id === persisted);
        setSelectedOrgIdState(fromPersisted?.id ?? list[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load organizations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedOrgId = useCallback((id: string | null) => {
    if (id) setActiveOrgId(id);
    setSelectedOrgIdState(id);
  }, []);

  return { loading, error, isPlatformAdmin, organizations, selectedOrgId, setSelectedOrgId };
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import {
  fetchMyMemberships,
  fetchOrganizations,
  fetchOrgMembers,
  grantMembership,
  removeMembership,
  updateMembership,
  getActiveOrgId,
  setActiveOrgId,
  type MyMembership,
  type OrganizationWithCounts,
  type OrgMember,
  type OrgRole,
} from "@/lib/org-api";
import { Search, UserPlus, Trash2, X, Users, ShieldCheck } from "lucide-react";
import { UserSearchPicker, type SearchedUser } from "@/components/admin/user-search-picker";

const ROLE_OPTIONS: OrgRole[] = ["OWNER", "ADMIN", "TEACHER", "LEARNER"];

const roleBadgeClass: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-green-100 text-green-700",
  TEACHER: "bg-purple-100 text-purple-700",
  LEARNER: "bg-blue-100 text-blue-700",
};

const statusBadgeClass: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function displayName(m: OrgMember): string {
  if (m.user) return `${m.user.firstName} ${m.user.lastName}`;
  return m.userId;
}

function initialsOf(m: OrgMember): string {
  if (m.user) {
    return `${m.user.firstName?.[0] ?? ""}${m.user.lastName?.[0] ?? ""}`.toUpperCase();
  }
  return "??";
}

export default function AdminMembersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [myMemberships, setMyMemberships] = useState<MyMembership[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationWithCounts[]>(
    [],
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [search, setSearch] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantUser, setGrantUser] = useState<SearchedUser | null>(null);
  const [grantRole, setGrantRole] = useState<OrgRole>("LEARNER");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);

  // Discover which organizations this admin can manage. Platform admins get
  // the full list; org admins fall back to their OWNER/ADMIN memberships.
  // A 403 from the platform list simply means "not a platform admin".
  const loadOrgChoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetchMyMemberships();
      setMyMemberships(me);

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

      let platformAdmin = false;
      try {
        const orgList = await fetchOrganizations();
        platformAdmin = true;
        setIsPlatformAdmin(true);
        const known = new Set(orgList.map((o) => o.id));
        setOrganizations([...orgList, ...adminRoles.filter((a) => !known.has(a.id))]);
      } catch {
        setIsPlatformAdmin(false);
        setOrganizations(adminRoles);
      }
      void platformAdmin;

      const persisted = getActiveOrgId();
      setSelectedOrgId((current) => {
        if (current && organizations.some((o) => o.id === current)) {
          return current;
        }
        const fromPersisted = organizations.find((o) => o.id === persisted);
        return fromPersisted?.id ?? organizations[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMembers = useCallback(async (orgId: string) => {
    try {
      const list = await fetchOrgMembers(orgId);
      setMembers(list);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load organization members",
      );
    }
  }, []);

  useEffect(() => {
    loadOrgChoices();
  }, [loadOrgChoices]);

  useEffect(() => {
    if (selectedOrgId) {
      setMembers([]);
      loadMembers(selectedOrgId);
      setActiveOrgId(selectedOrgId);
    }
  }, [selectedOrgId, loadMembers]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        displayName(m).toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q),
    );
  }, [members, search]);

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);

  const handleGrant = async () => {
    if (!selectedOrgId || !grantUser) return;
    setGrantError(null);
    try {
      await grantMembership(selectedOrgId, grantUser.id, grantRole);
      setGrantOpen(false);
      setGrantUser(null);
      setGrantRole("LEARNER");
      await loadMembers(selectedOrgId);
    } catch (e) {
      setGrantError(e instanceof Error ? e.message : "Failed to add member");
    }
  };

  const handleRoleChange = async (member: OrgMember, role: OrgRole) => {
    if (!selectedOrgId || role === member.role) return;
    setRoleBusyId(member.id);
    try {
      const updated = await updateMembership(selectedOrgId, member.id, {
        role,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleRemove = async () => {
    if (!selectedOrgId || !removeTarget) return;
    await removeMembership(selectedOrgId, removeTarget.id);
    setRemoveTarget(null);
    await loadMembers(selectedOrgId);
  };

  const canManage =
    isPlatformAdmin ||
    myMemberships.some(
      (m) =>
        m.organization.id === selectedOrgId &&
        (m.role === "OWNER" || m.role === "ADMIN"),
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-arc-slate-50">
        <DashboardHeader
          title="Organization Members"
          subtitle="Manage members of your organizations"
        />
        <div className="p-6 text-sm text-arc-slate-500">Loading…</div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-arc-slate-50">
        <DashboardHeader
          title="Organization Members"
          subtitle="Manage members of your organizations"
        />
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-arc-slate-100 flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-arc-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-arc-navy-900 mb-1">
              No organizations to manage
            </h3>
            <p className="text-sm text-arc-slate-500 max-w-md">
              You are not an admin of any organization yet. Organization
              memberships are granted by a platform administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-arc-slate-50">
      <DashboardHeader
        title="Organization Members"
        subtitle={
          selectedOrg
            ? `Members of ${selectedOrg.name}`
            : "Manage members of your organizations"
        }
      />

      <div className="p-6 space-y-4">
        {error && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Toolbar: org picker + search + grant */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedOrgId ?? ""}
            onChange={(e) => setSelectedOrgId(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm font-medium text-arc-navy-900 focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {isPlatformAdmin ? ` (${o.memberCount} members)` : ""}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="pl-9 border-arc-slate-200"
            />
          </div>

          {canManage && (
            <Button
              variant="accent"
              onClick={() => {
                setGrantError(null);
                setGrantOpen(true);
              }}
              className="ml-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>

        {/* Members list */}
        <Card>
          <CardContent className="p-0">
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="h-12 w-12 rounded-xl bg-arc-slate-100 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-arc-slate-400" />
                </div>
                <p className="text-sm font-medium text-arc-navy-900">
                  No members found
                </p>
                <p className="text-xs text-arc-slate-500 mt-1">
                  {search
                    ? "Try a different search."
                    : "This organization has no members yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-arc-slate-100">
                {filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-arc-slate-50/60 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-arc-navy-100 text-arc-navy-700 text-xs font-semibold">
                        {initialsOf(m)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-arc-navy-900 truncate">
                        {displayName(m)}
                      </div>
                      <div className="text-xs text-arc-slate-500 truncate">
                        {m.user?.email ?? m.userId}
                      </div>
                    </div>
                    <Badge
                      className={`${roleBadgeClass[m.role] ?? "bg-arc-slate-100 text-arc-slate-700"} border-transparent`}
                    >
                      {m.role}
                    </Badge>
                    <Badge
                      className={`${statusBadgeClass[m.status] ?? "bg-arc-slate-100 text-arc-slate-700"} border-transparent`}
                    >
                      {m.status}
                    </Badge>
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          disabled={roleBusyId === m.id}
                          onChange={(e) =>
                            handleRoleChange(m, e.target.value as OrgRole)
                          }
                          className="h-8 px-2 rounded-lg border border-arc-slate-200 bg-white text-xs text-arc-navy-900 focus:outline-none focus:ring-2 focus:ring-arc-navy-500 disabled:opacity-50"
                          aria-label={`Change role for ${displayName(m)}`}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setRemoveTarget(m)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label={`Remove ${displayName(m)}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Add Member modal */}
      {grantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-arc-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
              <h2 className="text-lg font-bold text-arc-navy-900">
                Add Member to {selectedOrg?.name}
              </h2>
              <button
                onClick={() => setGrantOpen(false)}
                className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">
                  User
                </label>
                <UserSearchPicker onSelect={(u) => setGrantUser(u)} />
                <p className="text-xs text-arc-slate-500 mt-1">
                  Search by name or email, then pick the account to add.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-2">
                  Organization Role
                </label>
                <select
                  value={grantRole}
                  onChange={(e) => setGrantRole(e.target.value as OrgRole)}
                  className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              {grantError && <p className="text-sm text-red-600">{grantError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-arc-slate-100 bg-arc-slate-50">
              <Button
                variant="outline"
                onClick={() => setGrantOpen(false)}
                className="border-arc-slate-200"
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleGrant}
                disabled={grantUser === null}
              >
                Add Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove member confirmation */}
      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title={`Remove ${removeTarget ? displayName(removeTarget) : ""}?`}
        description="Their membership will be cancelled. The member can be re-added later; history is preserved."
        confirmLabel="Remove Member"
        variant="danger"
      />
    </div>
  );
}


"use client";

// CS#23.3 §11–§18 — real Parent management. No mock data: parents come from
// the organization API (parent-role members), linked students are org-scoped,
// and every mutation is permission-gated + enforced server-side.

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Badge, Button, Input, Avatar, AvatarFallback } from "@/components/ui";
import { useManageableOrgs } from "@/lib/use-manageable-orgs";
import { usePermissions } from "@/lib/permissions";
import {
  createOrgUser,
  fetchOrgMembers,
  fetchOrgParents,
  linkParentStudent,
  unlinkParentStudent,
  OrgMember,
  OrgParent,
} from "@/lib/org-api";
import { Search, UserPlus, Link as LinkIcon, Eye, Users, X } from "lucide-react";

function nameOf(p: OrgParent): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export default function ParentsPage() {
  const { loading, error: orgError, organizations, selectedOrgId, setSelectedOrgId } =
    useManageableOrgs();
  const { hasPermission } = usePermissions();

  const [parents, setParents] = useState<OrgParent[]>([]);
  const [students, setStudents] = useState<OrgMember[]>([]);
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [addError, setAddError] = useState<string | null>(null);

  const [detail, setDetail] = useState<OrgParent | null>(null);

  const [linkParent, setLinkParent] = useState<OrgParent | null>(null);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkOpen, setLinkOpenState] = useState(false);

  const canRead = hasPermission("parents.read");
  const canManage = hasPermission("parents.manage");
  const canCreate = hasPermission("users.create");

  const loadParents = useCallback(async (orgId: string) => {
    try {
      setListError(null);
      setParents(await fetchOrgParents(orgId));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load parents");
      setParents([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedOrgId) return;
    if (canRead) {
      setParents([]);
      loadParents(selectedOrgId);
      fetchOrgMembers(selectedOrgId, { systemRole: "student" })
        .then(setStudents)
        .catch(() => setStudents([]));
    } else {
      setParents([]);
      setStudents([]);
    }
  }, [selectedOrgId, canRead, loadParents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter(
      (p) => nameOf(p).toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    );
  }, [parents, search]);

  const totalParents = parents.length;
  const activeParents = parents.filter((p) => p.status === "ACTIVE").length;
  const totalLinks = parents.reduce((sum, p) => sum + p.linkedStudents.length, 0);

  const handleAdd = async () => {
    if (!selectedOrgId) return;
    setBusy(true);
    setAddError(null);
    try {
      await createOrgUser(selectedOrgId, {
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        password: addForm.password,
        role: "parent",
        membershipRole: "LEARNER",
      });
      setAddOpen(false);
      setAddForm({ firstName: "", lastName: "", email: "", password: "" });
      await loadParents(selectedOrgId);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to create parent");
    } finally {
      setBusy(false);
    }
  };

  const handleLink = async () => {
    if (!selectedOrgId || !linkParent || !linkStudentId) return;
    setBusy(true);
    setLinkError(null);
    try {
      await linkParentStudent(selectedOrgId, linkParent.userId, linkStudentId);
      setLinkOpenState(false);
      setLinkParent(null);
      setLinkStudentId("");
      await loadParents(selectedOrgId);
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : "Failed to link student");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (parentUserId: string, studentUserId: string) => {
    if (!selectedOrgId) return;
    setBusy(true);
    try {
      await unlinkParentStudent(selectedOrgId, parentUserId, studentUserId);
      await loadParents(selectedOrgId);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to unlink student");
    } finally {
      setBusy(false);
    }
  };

  const openLink = (p: OrgParent) => {
    setLinkParent(p);
    setLinkStudentId("");
    setLinkError(null);
    setLinkOpenState(true);
  };

  return (
    <>
      <DashboardHeader title="Parents" subtitle="Manage real parent accounts and student links" />
      <div className="p-6 space-y-4">
        {(orgError || listError) && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <span>{orgError ?? listError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedOrgId ?? ""}
            onChange={(e) => setSelectedOrgId(e.target.value || null)}
            className="h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm font-medium text-arc-navy-900 focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
            aria-label="Organization"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parents…"
              className="pl-9 border-arc-slate-200"
            />
          </div>
          {canRead && canCreate && (
            <Button variant="accent" onClick={() => setAddOpen(true)} className="ml-auto">
              <UserPlus className="h-4 w-4 mr-2" /> Add Parent
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{totalParents}</div>
                <div className="text-sm text-arc-slate-500">Total Parents</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{activeParents}</div>
                <div className="text-sm text-arc-slate-500">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{totalLinks}</div>
                <div className="text-sm text-arc-slate-500">Linked Students</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Users className="h-12 w-12 text-arc-slate-300 mb-3" />
                <p className="text-sm font-medium text-arc-navy-900">No parents found</p>
                <p className="text-xs text-arc-slate-500 mt-1">
                  {search
                    ? "Try a different search."
                    : "Add your first parent account to get started."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-arc-slate-100">
                {filtered.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-arc-navy-100 text-arc-navy-700 text-xs font-semibold">
                        {`${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 basis-40">
                      <div className="text-sm font-medium text-arc-navy-900 truncate">{nameOf(p)}</div>
                      <div className="text-xs text-arc-slate-500 truncate">{p.email}</div>
                    </div>
                    <div className="min-w-0 basis-52 flex-1">
                      {p.linkedStudents.length === 0 ? (
                        <span className="text-xs text-arc-slate-400">No students linked</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {p.linkedStudents.map((s) => (
                            <Badge
                              key={s.id}
                              className="bg-arc-slate-100 text-arc-navy-800 border-transparent text-xs font-normal"
                            >
                              {s.firstName} {s.lastName}
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleUnlink(p.userId, s.userId)}
                                  aria-label={`Unlink ${s.firstName} ${s.lastName}`}
                                  className="ml-1 text-arc-slate-400 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={`${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-arc-slate-100 text-arc-slate-600"} border-transparent`}
                    >
                      {p.status}
                    </Badge>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => setDetail(p)}
                        aria-label={`View ${nameOf(p)}`}
                        className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors text-arc-slate-500 hover:text-arc-navy-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openLink(p)}
                          aria-label={`Link student to ${nameOf(p)}`}
                          className="p-2 rounded-lg hover:bg-arc-slate-100 transition-colors text-arc-slate-500 hover:text-arc-navy-900"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    {detail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-arc-navy-950/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
              <h2 className="text-lg font-bold text-arc-navy-900">{nameOf(detail)}</h2>
              <button onClick={() => setDetail(null)} aria-label="Close" className="p-2 rounded-lg hover:bg-arc-slate-100">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-arc-slate-400">Email</div>
              <div className="text-arc-navy-900">{detail.email}</div>
              <div className="text-xs uppercase tracking-wide text-arc-slate-400">Membership role</div>
              <div className="text-arc-navy-900">{detail.membershipRole}</div>
              <div className="text-xs uppercase tracking-wide text-arc-slate-400">Status</div>
              <Badge className={`${detail.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-arc-slate-100 text-arc-slate-600"} border-transparent`}>
                {detail.status}
              </Badge>
              <div className="pt-2 text-xs uppercase tracking-wide text-arc-slate-400">
                Linked students ({detail.linkedStudents.length})
              </div>
              {detail.linkedStudents.length === 0 ? (
                <p className="text-xs text-arc-slate-500">No students linked.</p>
              ) : (
                <ul className="space-y-1 text-xs text-arc-navy-900">
                  {detail.linkedStudents.map((s) => (
                    <li key={s.id}>
                      {s.firstName} {s.lastName} <span className="text-arc-slate-400">· {s.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-arc-navy-950/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
              <h2 className="text-lg font-bold text-arc-navy-900">Add Parent</h2>
              <button onClick={() => setAddOpen(false)} aria-label="Close" className="p-2 rounded-lg hover:bg-arc-slate-100">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {addError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{addError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-1">First name</label>
                  <Input value={addForm.firstName} onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Last name</label>
                  <Input value={addForm.lastName} onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Email</label>
                <Input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-arc-navy-900 mb-1">Temporary password</label>
                <Input type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <p className="text-xs text-arc-slate-500">
                Creates a real user account with the <strong>parent</strong> role and membership in this
                organization. Capabilities are managed by your platform administrator.
              </p>
              <Button variant="accent" onClick={handleAdd} disabled={busy} className="w-full">
                {busy ? "Creating…" : "Create Parent"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {linkOpen && linkParent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-arc-navy-950/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-arc-xl w-full max-w-md my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-arc-slate-100 bg-arc-slate-50">
              <h2 className="text-lg font-bold text-arc-navy-900">
                Link Student to {nameOf(linkParent)}
              </h2>
              <button onClick={() => setLinkOpenState(false)} aria-label="Close" className="p-2 rounded-lg hover:bg-arc-slate-100">
                <X className="h-5 w-5 text-arc-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {linkError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{linkError}</div>
              )}
              <select
                value={linkStudentId}
                onChange={(e) => setLinkStudentId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm text-arc-navy-900 focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                aria-label="Student"
              >
                <option value="">Select a student…</option>
                {students.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.user ? `${s.user.firstName} ${s.user.lastName} (${s.user.email})` : s.userId}
                  </option>
                ))}
              </select>
              <p className="text-xs text-arc-slate-500">
                Only students who are active members of this organization can be linked. Cross-organization
                linking is rejected by the server.
              </p>
              <Button variant="accent" onClick={handleLink} disabled={busy || !linkStudentId} className="w-full">
                {busy ? "Linking…" : "Link Student"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
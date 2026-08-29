"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  Skeleton,
  Input,
  Label,
} from "@/components/ui";
import {
  fetchPlatformOrganization,
  updatePlatformOrganization,
  invitePlatformOrgAdmin,
  deletePlatformOrganization,
  uploadOrgImage,
  type PlatformOrgDetail,
  type PlatformOrgMember,
} from "@/lib/platform-api";
import { updateMembership, removeMembership, type OrgRole } from "@/lib/org-api";
import { toast } from "@/lib/toast";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { EmptyState } from "@/components/branding/empty-state";
import { UserSearchPicker, type SearchedUser } from "@/components/admin/user-search-picker";
import {
  Loader2,
  UserPlus,
  ShieldCheck,
  Settings2,
  Users,
  ShieldAlert,
  Trash2,
  CalendarDays,
  ImagePlus,
  Upload,
  Building2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard";

const ROLE_OPTIONS = ["OWNER", "ADMIN", "TEACHER", "LEARNER"] as const;

const statusBadgeClass: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function PlatformOrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const orgId = params?.id;

  const [org, setOrg] = useState<PlatformOrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review mode (teacher_auto_publish policy)
  const [reviewMode, setReviewMode] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  // Invite admin
  const [inviteUser, setInviteUser] = useState<SearchedUser | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Member management
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlatformOrgMember | null>(null);

  // Delete org
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Organization image
  const [imgUrl, setImgUrl] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const router = useRouter();

  // Sync the draft image URL whenever the org loads
  useEffect(() => {
    if (org) setImgUrl(org.imageUrl ?? "");
  }, [org]);

  const handleImageFile = async (file: File) => {
    setImgUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const url = await uploadOrgImage(base64, file.type, file.name);
      setImgUrl(url);
      toast.success("Image uploaded — press Save to apply");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setImgUploading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!org) return;
    setSavingImage(true);
    try {
      // empty string clears the image (backend deletes metadata.imageUrl)
      await updatePlatformOrganization(org.id, { imageUrl: imgUrl.trim() });
      setOrg({ ...org, imageUrl: imgUrl.trim() || null });
      toast.success(imgUrl.trim() ? "Organization image updated" : "Organization image removed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update image";
      toast.error(msg);
    } finally {
      setSavingImage(false);
    }
  };

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformOrganization(orgId);
      setOrg(data);
      setReviewMode(data.reviewMode);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSavePolicy = async (next: boolean) => {
    if (!org) return;
    setSavingPolicy(true);
    setPolicySaved(false);
    try {
      await updatePlatformOrganization(org.id, {
        settings: { teacher_auto_publish: !next },
      });
      setReviewMode(next);
      setPolicySaved(true);
      toast.success(
        next
          ? "Content review is now required before publishing"
          : "Creators can now publish directly",
      );
      setTimeout(() => setPolicySaved(false), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save policy";
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleInvite = async () => {
    if (!org || !inviteUser) return;
    setInviting(true);
    setInviteError(null);
    try {
      await invitePlatformOrgAdmin(org.id, inviteUser.id);
      toast.success(
        `${inviteUser.firstName} ${inviteUser.lastName} assigned as organization admin`,
      );
      setInviteUser(null);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to invite admin";
      setInviteError(msg);
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (m: PlatformOrgMember, role: string) => {
    if (!org || role === m.role) return;
    setRoleBusyId(m.id);
    try {
      await updateMembership(org.id, m.id, { role: role as OrgRole });
      toast.success(`${m.user.firstName} ${m.user.lastName} is now ${role}`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!org || !removeTarget) return;
    try {
      await removeMembership(org.id, removeTarget.id);
      toast.success(
        `${removeTarget.user.firstName} ${removeTarget.user.lastName} removed from ${org.name}`,
      );
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove member");
    } finally {
      setRemoveTarget(null);
    }
  };

  const handleDeleteOrg = async () => {
    if (!org) return;
    setDeleting(true);
    try {
      await deletePlatformOrganization(org.id);
      toast.success(`${org.name} deleted`);
      router.push("/platform/organizations");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete organization");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-arc-slate-50">
        <DashboardHeader title="Organization" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-arc-slate-50">
        <DashboardHeader
          title="Organization"
          breadcrumbs={[{ label: "Organizations", href: "/platform/organizations" }]}
        />
        <div className="p-6">
          <Card><CardContent className="pt-6 text-sm text-red-600">{error ?? "Organization not found"}</CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arc-slate-50">
      <DashboardHeader
        title={org.name}
        subtitle={`/${org.slug} · ${org.memberCount} member${org.memberCount === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Organizations", href: "/platform/organizations" },
          { label: org.name },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        }
      />
      <div className="p-6 space-y-6">
      {/* Summary — compact, matches /admin/programs stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-arc-navy-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-arc-navy-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-arc-navy-900">{org.members.length}</div>
              <div className="text-xs text-arc-slate-500">Members</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${org.status === "ARCHIVED" ? "bg-red-100" : "bg-green-100"}`}>
              <ShieldAlert className={`h-4 w-4 ${org.status === "ARCHIVED" ? "text-red-600" : "text-green-600"}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-arc-navy-900">
                {org.status === "ARCHIVED" ? "Suspended" : "Active"}
              </div>
              <div className="text-xs text-arc-slate-500">Status</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Settings2 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-arc-navy-900">
                {org.reviewMode ? "Review" : "Direct"}
              </div>
              <div className="text-xs text-arc-slate-500">Content policy</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization image */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-gradient-to-br from-arc-navy-50 to-arc-navy-100 flex items-center justify-center">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={`${org.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-arc-navy-300" />
              )}
            </div>
            <div className="flex-1 min-w-[220px] space-y-2">
              <Label htmlFor="org-image-url" className="text-sm font-medium">Organization image</Label>
              <Input
                id="org-image-url"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="Paste image URL…"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-arc-slate-200 px-3 py-2 text-sm font-medium text-arc-navy-800 hover:bg-arc-slate-50">
                {imgUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {imgUploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleImageFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <Button
                size="sm"
                onClick={handleSaveImage}
                disabled={savingImage || imgUploading || imgUrl === (org.imageUrl ?? "")}
              >
                {savingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              {org.imageUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={savingImage}
                  onClick={() => {
                    setImgUrl("");
                    void handleSaveImage();
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          {!imgUrl && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-arc-slate-400">
              <ImagePlus className="h-3.5 w-3.5" />
              Shown as the organization thumbnail in the platform directory and org switcher.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
      {/* Policy */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Content policy</h2>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Require content review before publishing</p>
              <p className="text-xs text-muted-foreground">
                When on, teacher-created content must be approved by an org admin
                before it can be published.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {policySaved && <span className="text-xs text-green-600">Saved ✓</span>}
              <button
                type="button"
                role="switch"
                aria-checked={reviewMode}
                disabled={savingPolicy}
                onClick={() => handleSavePolicy(!reviewMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  reviewMode ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reviewMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite admin */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Assign organization admin</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Search for an existing account and assign them as an organization admin.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="max-w-md flex-1">
              <UserSearchPicker onSelect={(u) => setInviteUser(u)} />
            </div>
            <Button onClick={handleInvite} disabled={inviting || !inviteUser}>
              {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </div>
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
        </CardContent>
      </Card>
      </div>

      {/* Members */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Members</h2>
          </div>
          <div className="mt-4 space-y-2">
            {org.members.length === 0 && (
              <EmptyState
                icon="users"
                title="No members yet"
                description="Assign an organization admin above to add the first member."
              />
            )}
            {org.members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {(m.user.firstName?.[0] ?? "?") + (m.user.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  {m.createdAt && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" /> Joined{" "}
                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <label className="sr-only" htmlFor={`role-${m.id}`}>
                  Role for {m.user.firstName} {m.user.lastName}
                </label>
                <select
                  id={`role-${m.id}`}
                  value={m.role}
                  disabled={roleBusyId === m.id}
                  onChange={(e) => {
                    void handleRoleChange(m, e.target.value);
                  }}
                  className="h-9 rounded-md border border-arc-slate-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-arc-navy-500 disabled:opacity-50"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <Badge className={statusBadgeClass[m.status] ?? "bg-gray-100 text-gray-600"}>
                  {m.status}
                </Badge>
                <button
                  type="button"
                  aria-label={`Remove ${m.user.firstName} ${m.user.lastName} from organization`}
                  disabled={roleBusyId === m.id}
                  onClick={() => setRemoveTarget(m)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {roleBusyId === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={removeTarget !== null}
        title="Remove member"
        description={
          removeTarget
            ? `Remove ${removeTarget.user.firstName} ${removeTarget.user.lastName} from ${org.name}? They will immediately lose access to this organization.`
            : undefined
        }
        confirmLabel="Remove"
        variant="danger"
        busyLabel="Removing…"
        onConfirm={handleRemoveMember}
        onClose={() => setRemoveTarget(null)}
      />

      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete organization"
        description={`Delete "${org.name}"? This archives the organization. Its members will lose access and its content will be hidden until reactivated.`}
        confirmLabel="Delete"
        variant="danger"
        busyLabel="Deleting…"
        onConfirm={handleDeleteOrg}
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
      />
      </div>
    </div>
  );
}

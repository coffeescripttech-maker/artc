"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard";
import { ConfirmModal } from "@/components/admin";
import { Card, CardContent, Button, Input, Badge, Avatar, AvatarFallback } from "@/components/ui";
import { CardSkeleton, NoDataEmpty } from "@/components/branding";
import { toast } from "@/lib/toast";
import { batchesApi, type BatchDetail, type BatchMemberRow } from "@/lib/api/client";
import {
  ArrowLeft,
  RefreshCw,
  UserPlus,
  Users,
  Calendar,
  Mail,
  Trash2,
  AlertCircle,
} from "lucide-react";

function gradeLabel(grade: string | null): string {
  if (!grade) return "—";
  return grade.replace("GRADE_", "Grade ").replace(/_/g, " ");
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function BatchDetailPage() {
  const params = useParams<{ batchId: string }>();
  const batchId = params.batchId;

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-student form
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<BatchMemberRow | null>(null);

  const fetchBatch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBatch(await batchesApi.getById(batchId));
    } catch (err: any) {
      setError(err?.message || "Failed to load this class.");
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (batchId) fetchBatch();
  }, [batchId, fetchBatch]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setIsAdding(true);
    try {
      const member = await batchesApi.addMember(batchId, addEmail.trim());
      toast.success(`${member.user.firstName} ${member.user.lastName} added to the class.`);
      setAddEmail("");
      setShowAdd(false);
      fetchBatch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add the student.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget || !batch) return;
    try {
      await batchesApi.removeMember(batch.id, removeTarget.id);
      toast.success(`${removeTarget.user.firstName} ${removeTarget.user.lastName} removed from the class.`);
      setRemoveTarget(null);
      fetchBatch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove the student.");
    }
  };

  return (
    <>
      <DashboardHeader
        title={batch?.name ?? "Class"}
        subtitle={batch ? `${batch.program.name} · ${batch.members.length} students` : "Loading..."}
        breadcrumbs={[
          { label: "My Classes", href: "/dashboard/classes" },
          { label: batch?.name ?? "Class" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchBatch} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="accent" onClick={() => setShowAdd(!showAdd)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger-subtle border border-danger-border flex items-center justify-between gap-4">
            <p className="text-sm text-danger-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchBatch}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Link href="/dashboard/classes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  All classes
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Add-student inline form */}
        {showAdd && batch && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-heading mb-1">Add a student by email</h3>
              <p className="text-sm text-arc-slate-500 mb-4">
                The student must already have an account on the platform.
              </p>
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="student@aratc.edu.ph"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="accent" disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add to Class"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <CardSkeleton />
        ) : !batch ? (
          !error && (
            <Card>
              <CardContent className="p-12">
                <NoDataEmpty
                  title="Class not found"
                  description="This class may have been deleted, or you don't have access to it."
                />
              </CardContent>
            </Card>
          )
        ) : (
          <>
            {/* Class meta */}
            <div className="grid gap-4 mb-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent-hover" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-heading">{batch.members.length}</div>
                    <div className="text-sm text-arc-slate-500">Students</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-subtle flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary-hover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-heading">
                      {formatDate(batch.startDate)} → {formatDate(batch.endDate)}
                    </div>
                    <div className="text-sm text-arc-slate-500">Class period</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-arc-slate-400 mb-1">
                    Owner
                  </div>
                  <div className="text-sm font-semibold text-heading">
                    {batch.owner.firstName} {batch.owner.lastName}
                    {batch.isOwner && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  {batch.teachers.length > 0 && (
                    <div className="text-xs text-arc-slate-500 mt-1">
                      + {batch.teachers.length} co-teacher{batch.teachers.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {batch.description && (
              <p className="text-sm text-arc-slate-500 mb-6 max-w-3xl">{batch.description}</p>
            )}

            {/* Members table */}
            <Card className="shadow-arc-md">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6 border-b border-arc-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary-subtle flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-hover" />
                    </div>
                    <div>
                      <div className="font-semibold text-heading">Enrolled Students</div>
                      <div className="text-sm text-arc-slate-500">{batch.members.length} total</div>
                    </div>
                  </div>
                </div>

                {batch.members.length === 0 ? (
                  <div className="p-12">
                    <NoDataEmpty
                      title="No students yet"
                      description="Add students to this class using their account email — they'll show up here along with their grade level."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-arc-bg border-b border-arc-slate-200">
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Student</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Grade Level</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Joined</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-arc-slate-100">
                        {batch.members.map((member) => {
                          const u = member.user;
                          const initials = `${u.firstName[0] || ""}${u.lastName[0] || ""}`.toUpperCase();
                          return (
                            <tr key={member.id} className="hover:bg-arc-bg transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-accent to-accent-hover text-white text-sm font-semibold">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-semibold text-arc-navy-900">
                                      {u.firstName} {u.lastName}
                                    </div>
                                    <div className="text-sm text-arc-slate-500">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-arc-slate-600">
                                {gradeLabel(member.currentGradeLevel)}
                              </td>
                              <td className="px-6 py-4">
                                {u.status === "ACTIVE" ? (
                                  <Badge className="bg-success-subtle text-success-foreground border-transparent">
                                    Active
                                  </Badge>
                                ) : u.status === "SUSPENDED" ? (
                                  <Badge className="bg-danger-subtle text-danger-foreground border-transparent">
                                    Suspended
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">{u.status.toLowerCase()}</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-arc-slate-500">
                                {formatDate(member.joinedAt)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-danger-foreground hover:bg-danger-subtle"
                                    onClick={() => setRemoveTarget(member)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {removeTarget && (
        <ConfirmModal
          isOpen={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={handleRemoveMember}
          title="Remove student from class"
          description={`Remove ${removeTarget.user.firstName} ${removeTarget.user.lastName} from this class? Their learning progress is kept — they can be added back at any time.`}
          confirmLabel="Remove Student"
          variant="danger"
        />
      )}
    </>
  );
}

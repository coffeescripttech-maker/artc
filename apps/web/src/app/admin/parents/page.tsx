"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge, Avatar, AvatarFallback } from "@/components/ui";
import {
  Users,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  UserPlus,
  Link as LinkIcon,
  User,
} from "lucide-react";

const mockParents = [
  {
    id: 1,
    firstName: "Roberto",
    lastName: "Reyes",
    email: "roberto.reyes@email.com",
    phone: "+63 912 345 6789",
    linkedStudents: [
      { name: "Ana Reyes", program: "CET Intensive Review" },
    ],
    status: "ACTIVE",
    lastActivity: "2026-08-16",
  },
  {
    id: 2,
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@email.com",
    phone: "+63 923 456 7890",
    linkedStudents: [
      { name: "Juan Santos", program: "ARC 4-Year" },
      { name: "Maria Santos Jr", program: "ARC 4-Year" },
    ],
    status: "ACTIVE",
    lastActivity: "2026-08-15",
  },
  {
    id: 3,
    firstName: "Carlos",
    lastName: "Dela Cruz",
    email: "carlos.delacruz@email.com",
    phone: "+63 934 567 8901",
    linkedStudents: [
      { name: "Juan Dela Cruz", program: "ARC 4-Year" },
    ],
    status: "ACTIVE",
    lastActivity: "2026-08-14",
  },
];

export default function ParentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParents = mockParents.filter((parent) => {
    const matchesSearch =
      parent.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <DashboardHeader
        title="Parents"
        subtitle="Manage parent accounts and student links"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <input
              type="text"
              placeholder="Search parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 w-64"
            />
          </div>
          <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Parent
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{mockParents.length}</div>
                <div className="text-sm text-arc-slate-500">Total Parents</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {mockParents.reduce((sum, p) => sum + p.linkedStudents.length, 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Linked Students</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parents Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Parent
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Contact
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Linked Students
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Last Activity
                    </th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {filteredParents.map((parent) => {
                    const initials = `${parent.firstName[0]}${parent.lastName[0]}`;
                    const fullName = `${parent.firstName} ${parent.lastName}`;

                    return (
                      <tr
                        key={parent.id}
                        className="hover:bg-arc-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-arc-navy-900">{fullName}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-arc-slate-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {parent.email}
                          </div>
                          <div className="text-sm text-arc-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {parent.phone}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {parent.linkedStudents.map((student, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <User className="h-3 w-3 text-arc-slate-400" />
                                <span className="text-arc-navy-900">{student.name}</span>
                                <span className="text-arc-slate-400 text-xs">
                                  ({student.program})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              parent.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-arc-slate-100 text-arc-slate-600"
                            }
                          >
                            {parent.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-arc-slate-500">
                          {parent.lastActivity}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                              <Eye className="h-4 w-4 text-arc-slate-400" />
                            </button>
                            <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                              <LinkIcon className="h-4 w-4 text-arc-slate-400" />
                            </button>
                            <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                              <Edit className="h-4 w-4 text-arc-slate-400" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredParents.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                  No parents found
                </h3>
                <p className="text-arc-slate-500 mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Add your first parent account to get started"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

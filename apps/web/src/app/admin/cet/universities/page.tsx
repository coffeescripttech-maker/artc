"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Building,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  Award,
} from "lucide-react";

const mockUniversities = [
  {
    id: 1,
    name: "University of the Philippines",
    slug: "up",
    acronym: "UP",
    location: "Quezon City, Metro Manila",
    website: "https://up.edu.ph",
    exams: ["UPCAT"],
    students: 12500,
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Bicol University",
    slug: "buc",
    acronym: "BU",
    location: "Legazpi City, Albay",
    website: "https://bicol-u.edu.ph",
    exams: ["BUCET"],
    students: 8500,
    status: "ACTIVE",
  },
  {
    id: 3,
    name: "Ateneo de Manila University",
    slug: "admu",
    acronym: "ADMU",
    location: "Quezon City, Metro Manila",
    website: "https://ateneo.edu",
    exams: ["ASICE"],
    students: 9200,
    status: "ACTIVE",
  },
  {
    id: 4,
    name: "De La Salle University",
    slug: "dlsu",
    acronym: "DLSU",
    location: "Manila, Metro Manila",
    website: "https://dlsu.edu.ph",
    exams: ["DLSUCET"],
    students: 12000,
    status: "ACTIVE",
  },
  {
    id: 5,
    name: "Catanduanes State University",
    slug: "catsu",
    acronym: "CatSU",
    location: "Virac, Catanduanes",
    website: "https://cspsc.edu.ph",
    exams: ["CSPC-CET"],
    students: 4500,
    status: "ACTIVE",
  },
];

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUniversities = mockUniversities.filter((uni) => {
    const matchesSearch =
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <DashboardHeader
        title="Universities"
        subtitle="Manage university partners and their entrance exams"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <input
              type="text"
              placeholder="Search universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 w-64"
            />
          </div>
          <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{mockUniversities.length}</div>
                <div className="text-sm text-arc-slate-500">Partner Universities</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {[...new Set(mockUniversities.flatMap((u) => u.exams))].length}
                </div>
                <div className="text-sm text-arc-slate-500">Entrance Exams</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {mockUniversities.reduce((sum, u) => sum + u.students, 0).toLocaleString()}
                </div>
                <div className="text-sm text-arc-slate-500">Total Students</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Universities Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      University
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Location
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Entrance Exams
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Students
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">
                      Status
                    </th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {filteredUniversities.map((uni) => (
                    <tr
                      key={uni.id}
                      className="hover:bg-arc-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{uni.acronym}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-arc-navy-900">{uni.name}</div>
                            <a
                              href={uni.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-arc-orange-500 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {uni.website.replace("https://", "")}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-arc-slate-600">
                        {uni.location}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {uni.exams.map((exam) => (
                            <Badge key={exam} variant="secondary" className="bg-arc-purple-50 text-arc-purple-700">
                              {exam}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-arc-slate-600">
                        {uni.students.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-700">
                          {uni.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 hover:bg-arc-slate-100 rounded">
                            <Edit className="h-4 w-4 text-arc-slate-400" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUniversities.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
                  No universities found
                </h3>
                <p className="text-arc-slate-500 mb-4">
                  {searchQuery ? "Try adjusting your search" : "Add your first university partner"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

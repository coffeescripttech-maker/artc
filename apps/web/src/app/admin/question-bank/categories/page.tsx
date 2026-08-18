"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import {
  Tags,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FolderTree,
  FileText,
} from "lucide-react";

const mockCategories = [
  {
    id: 1,
    name: "Mathematics",
    slug: "mathematics",
    parentId: null,
    description: "All math-related questions",
    color: "blue",
    questionCount: 245,
    subcategories: ["Algebra", "Geometry", "Trigonometry", "Statistics"],
  },
  {
    id: 2,
    name: "English",
    slug: "english",
    parentId: null,
    description: "English language and literature",
    color: "purple",
    questionCount: 189,
    subcategories: ["Grammar", "Vocabulary", "Reading Comprehension"],
  },
  {
    id: 3,
    name: "Science",
    slug: "science",
    parentId: null,
    description: "Natural sciences",
    color: "green",
    questionCount: 312,
    subcategories: ["Biology", "Chemistry", "Physics"],
  },
  {
    id: 4,
    name: "Araling Panlipunan",
    slug: "araling-panlipunan",
    parentId: null,
    description: "Philippine history and culture",
    color: "orange",
    questionCount: 156,
    subcategories: ["Philippine History", "Geography", "Civics"],
  },
  {
    id: 5,
    name: "Abstract Reasoning",
    slug: "abstract-reasoning",
    parentId: null,
    description: "Logical and abstract reasoning",
    color: "red",
    questionCount: 98,
    subcategories: [],
  },
];

const colorConfig: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", icon: "bg-blue-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", icon: "bg-purple-500" },
  green: { bg: "bg-green-100", text: "text-green-700", icon: "bg-green-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", icon: "bg-orange-500" },
  red: { bg: "bg-red-100", text: "text-red-700", icon: "bg-red-500" },
};

export default function QuestionCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = mockCategories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <DashboardHeader
        title="Question Categories"
        subtitle="Organize questions by subject and topic"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500 w-64"
            />
          </div>
          <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Tags className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">{mockCategories.length}</div>
                <div className="text-sm text-arc-slate-500">Main Categories</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {mockCategories.reduce((sum, c) => sum + c.subcategories.length, 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Subcategories</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-arc-navy-900">
                  {mockCategories.reduce((sum, c) => sum + c.questionCount, 0)}
                </div>
                <div className="text-sm text-arc-slate-500">Total Questions</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const config = colorConfig[category.color];

            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                        <Tags className={`h-6 w-6 ${config.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-arc-navy-900 text-lg">{category.name}</h3>
                        <p className="text-sm text-arc-slate-500">{category.description}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-arc-slate-100 rounded">
                      <MoreVertical className="h-4 w-4 text-arc-slate-400" />
                    </button>
                  </div>

                  {/* Question Count */}
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={`${config.bg} ${config.text}`}>
                      {category.questionCount} questions
                    </Badge>
                  </div>

                  {/* Subcategories */}
                  {category.subcategories.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-arc-slate-500 uppercase tracking-wider mb-2">
                        Subcategories
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.map((sub) => (
                          <Badge
                            key={sub}
                            variant="secondary"
                            className="bg-arc-slate-100 text-arc-slate-600"
                          >
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-arc-slate-100">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Questions
                    </Button>
                    <button className="p-2 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Tags className="h-12 w-12 text-arc-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-arc-navy-900 mb-2">
              No categories found
            </h3>
            <p className="text-arc-slate-500 mb-4">
              {searchQuery ? "Try adjusting your search" : "Create your first category to get started"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

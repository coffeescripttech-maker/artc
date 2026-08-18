"use client";

import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, Button } from "@/components/ui";
import { FileText, Plus, Search, Filter, MoreVertical } from "lucide-react";

const mockQuestions = [
  { id: 1, stem: "What is the value of x in the equation 2x + 5 = 15?", type: "Multiple Choice", difficulty: "Easy", topic: "Linear Equations", status: "Published" },
  { id: 2, stem: "Which of the following is a renewable resource?", type: "Multiple Choice", difficulty: "Medium", topic: "Natural Resources", status: "Published" },
  { id: 3, stem: "Explain the process of photosynthesis...", type: "Essay", difficulty: "Hard", topic: "Biology", status: "Draft" },
];

export default function QuestionsPage() {
  return (
    <>
      <DashboardHeader
        title="Question Bank"
        subtitle="Manage your questions"
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arc-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                className="pl-10 pr-4 py-2 border border-arc-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-arc-slate-200 rounded-lg hover:bg-arc-slate-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-arc-orange-500 text-white rounded-lg hover:bg-arc-orange-600 transition-colors">
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-arc-slate-50 border-b border-arc-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Question</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Difficulty</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Topic</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-arc-navy-900">Status</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {mockQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-arc-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-arc-slate-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-arc-slate-600" />
                          </div>
                          <span className="text-sm text-arc-navy-900 max-w-xs truncate">
                            {question.stem}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-arc-slate-600">{question.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                          question.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-arc-slate-600">{question.topic}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.status === "Published" ? "bg-green-100 text-green-700" :
                          "bg-arc-slate-100 text-arc-slate-600"
                        }`}>
                          {question.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-arc-slate-100 rounded">
                          <MoreVertical className="h-4 w-4 text-arc-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

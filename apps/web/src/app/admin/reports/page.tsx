"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
} from "@/components/ui";
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Filter,
} from "lucide-react";

const reportTypes = [
  {
    id: "user-growth",
    title: "User Growth Report",
    description: "Track new registrations and user activity over time",
    icon: Users,
    lastGenerated: "Aug 17, 2026",
    color: "blue",
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Subscription revenue, transactions, and financial summary",
    icon: DollarSign,
    lastGenerated: "Aug 17, 2026",
    color: "green",
  },
  {
    id: "engagement",
    title: "Engagement Report",
    description: "Daily active users, session duration, feature usage",
    icon: Activity,
    lastGenerated: "Aug 16, 2026",
    color: "purple",
  },
  {
    id: "content",
    title: "Content Performance",
    description: "Most viewed lessons, popular topics, completion rates",
    icon: BookOpen,
    lastGenerated: "Aug 15, 2026",
    color: "amber",
  },
  {
    id: "quiz",
    title: "Quiz Analytics",
    description: "Question accuracy, difficulty analysis, time spent",
    icon: BarChart3,
    lastGenerated: "Aug 14, 2026",
    color: "cyan",
  },
  {
    id: "program",
    title: "Program Performance",
    description: "Enrollment rates, completion rates by program",
    icon: PieChart,
    lastGenerated: "Aug 13, 2026",
    color: "pink",
  },
];

const recentReports = [
  { name: "Weekly User Report - Week 32", generated: "Aug 17, 2026", size: "2.4 MB" },
  { name: "Monthly Revenue Summary - July 2026", generated: "Aug 1, 2026", size: "1.8 MB" },
  { name: "Quarterly Performance Report - Q2 2026", generated: "Jul 1, 2026", size: "5.2 MB" },
  { name: "User Engagement Analysis - June 2026", generated: "Jul 1, 2026", size: "3.1 MB" },
];

const quickStats = [
  { label: "Total Reports", value: "156", icon: FileText, color: "blue" },
  { label: "This Month", value: "24", icon: Calendar, color: "green" },
  { label: "Downloads", value: "1,245", icon: Download, color: "purple" },
  { label: "Avg Size", value: "2.8 MB", icon: Clock, color: "amber" },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
  cyan: { bg: "bg-cyan-100", icon: "text-cyan-600" },
  pink: { bg: "bg-pink-100", icon: "text-pink-600" },
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  return (
    <>
      <DashboardHeader title="Reports & Analytics" subtitle="Generate and view platform reports" />

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid gap-4 mb-8 md:grid-cols-4">
          {quickStats.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <stat.icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Types */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => {
              const colors = colorClasses[report.color];
              return (
                <Card
                  key={report.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    selectedReport === report.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${colors.bg}`}>
                        <report.icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      {selectedReport === report.id && (
                        <Badge variant="info">Selected</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{report.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Last generated: {report.lastGenerated}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Generate Report Section */}
        {selectedReport && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Generate New Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                    <option value="custom">Custom range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Filter</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="all">All Programs</option>
                    <option value="basic">Basic Education</option>
                    <option value="entrance">Entrance Exams</option>
                    <option value="board">Board Exams</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Recent Reports
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentReports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="font-medium text-gray-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">{report.generated}</td>
                      <td className="py-4 text-sm text-gray-600">{report.size}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
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

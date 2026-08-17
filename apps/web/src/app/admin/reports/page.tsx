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
  ArrowRight,
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
  { label: "Total Reports", value: "156", change: "+12", positive: true, icon: FileText },
  { label: "This Month", value: "24", change: "+5", positive: true, icon: Calendar },
  { label: "Downloads", value: "1,245", change: "+89", positive: true, icon: Download },
  { label: "Avg Size", value: "2.8 MB", change: "-0.3", positive: false, icon: Clock },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  return (
    <>
      <DashboardHeader title="Reports & Analytics" subtitle="Generate and view platform reports" />

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat, index) => (
            <Card key={stat.label} className="relative overflow-hidden group hover:shadow-arc-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-arc-orange-500 to-arc-orange-400 transform origin-left transition-transform duration-300 group-hover:scale-x-100" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-arc-orange-100">
                    <stat.icon className="h-6 w-6 text-arc-orange-600" />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight text-arc-navy-950">{stat.value}</div>
                  <div className="text-sm font-medium text-arc-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Types */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-arc-navy-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-arc-orange-500" />
            Report Types
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => (
              <Card
                key={report.id}
                className={`hover:shadow-arc-xl transition-all cursor-pointer border-l-4 ${
                  selectedReport === report.id
                    ? "ring-2 ring-arc-orange-500 border-l-arc-orange-500"
                    : "border-l-transparent hover:border-l-arc-orange-500"
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                      <report.icon className="h-6 w-6 text-arc-orange-600" />
                    </div>
                    {selectedReport === report.id && (
                      <Badge variant="premium" className="font-semibold">Selected</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-arc-navy-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-arc-slate-500 mb-3">{report.description}</p>
                  <div className="flex items-center justify-between text-xs text-arc-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {report.lastGenerated}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Generate Report Section */}
        {selectedReport && (
          <Card className="mb-8 shadow-arc-md">
            <CardHeader className="border-b border-arc-slate-100">
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-arc-orange-600" />
                </div>
                Generate New Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                    <option value="custom">Custom range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Format</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arc-navy-900 mb-2">Program Filter</label>
                  <select className="w-full h-11 px-3 rounded-lg border border-arc-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500">
                    <option value="all">All Programs</option>
                    <option value="basic">Basic Education</option>
                    <option value="entrance">Entrance Exams</option>
                    <option value="board">Board Exams</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="accent" className="w-full h-11 shadow-lg shadow-arc-orange-500/20">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reports */}
        <Card className="shadow-arc-md">
          <CardHeader className="border-b border-arc-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-arc-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-arc-orange-600" />
                </div>
                Recent Reports
              </CardTitle>
              <Button variant="outline" size="sm" className="border-arc-slate-200 hover:bg-arc-slate-50">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-arc-slate-50 border-b border-arc-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Report Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Generated</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Size</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-arc-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arc-slate-100">
                  {recentReports.map((report, index) => (
                    <tr key={index} className="hover:bg-arc-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-arc-orange-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-arc-orange-600" />
                          </div>
                          <span className="font-semibold text-arc-navy-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-arc-slate-600">{report.generated}</td>
                      <td className="px-6 py-4 text-sm font-medium text-arc-slate-600">{report.size}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="text-arc-slate-500 hover:text-arc-navy-900 hover:bg-arc-slate-50">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="text-arc-orange-600 hover:text-arc-orange-700 hover:bg-arc-orange-50">
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

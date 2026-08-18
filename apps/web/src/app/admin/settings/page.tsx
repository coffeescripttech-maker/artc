"use client";

import { DashboardHeader } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { Settings, Bell, Shield, Users, Palette, Save } from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "users", label: "User Management", icon: Users },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <>
      <DashboardHeader
        title="Settings"
        subtitle="Manage your organization settings"
      />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-arc-orange-50 text-arc-orange-600"
                          : "text-arc-slate-600 hover:bg-arc-slate-50"
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-arc-orange-600" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Organization Name</label>
                    <Input defaultValue="ARATC Learning" className="max-w-md" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Organization Email</label>
                    <Input defaultValue="admin@aratc.edu.ph" type="email" className="max-w-md" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Contact Number</label>
                    <Input defaultValue="+63 912 345 6789" className="max-w-md" />
                  </div>
                  <div className="pt-4">
                    <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-arc-orange-600" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {["Email notifications", "Push notifications", "SMS alerts", "Weekly digest"].map((item) => (
                    <div key={item} className="flex items-center justify-between py-2">
                      <span className="text-arc-navy-900">{item}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-arc-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-arc-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-arc-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-arc-orange-500"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-arc-orange-600" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Current Password</label>
                    <Input type="password" className="max-w-md" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">New Password</label>
                    <Input type="password" className="max-w-md" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-arc-navy-900">Confirm New Password</label>
                    <Input type="password" className="max-w-md" />
                  </div>
                  <div className="pt-4">
                    <Button className="bg-arc-orange-500 hover:bg-arc-orange-600">
                      <Shield className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "users" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-arc-orange-600" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-arc-slate-500">User management features coming soon.</p>
                </CardContent>
              </Card>
            )}

            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-arc-orange-600" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-arc-navy-900 block mb-2">Theme</label>
                    <div className="flex gap-4">
                      <button className="flex flex-col items-center gap-2 p-4 border-2 border-arc-orange-500 rounded-lg">
                        <div className="w-12 h-8 bg-white border rounded" />
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 border-2 border-arc-slate-200 rounded-lg">
                        <div className="w-12 h-8 bg-arc-navy-900 rounded" />
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

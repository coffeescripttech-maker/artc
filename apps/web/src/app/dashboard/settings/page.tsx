"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Button,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  Separator,
} from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <DashboardHeader title="Settings" subtitle="Manage your account settings" />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-arc-slate-100">
            <TabsTrigger value="profile" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Security</TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Appearance</TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-arc-orange-500 data-[state=active]:text-white">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-2xl font-bold">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Juan" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Dela Cruz" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="juan.delacruz@email.com" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" defaultValue="+63 912 345 6789" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Birthday</Label>
                        <Input id="birthday" type="date" defaultValue="2005-06-15" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" defaultValue="123 Main Street, Manila, Philippines" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
                        placeholder="Tell us about yourself..."
                        defaultValue="Grade 10 student preparing for college entrance exams."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSave}>
                        {saved ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Plan</span>
                        <Badge className="bg-blue-600">Premium</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Valid until</span>
                        <span className="text-sm font-medium">Dec 31, 2026</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Member since</span>
                        <span className="text-sm font-medium">Jan 15, 2026</span>
                      </div>
                      <Button variant="outline" className="w-full">
                        Upgrade Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>juan.delacruz@email.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>+63 912 345 6789</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>Manila, Philippines</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: "Email Notifications", description: "Receive updates via email", enabled: true },
                  { title: "Push Notifications", description: "Browser push notifications", enabled: true },
                  { title: "SMS Notifications", description: "Text messages for important updates", enabled: false },
                  { title: "Weekly Progress Report", description: "Summary of your weekly activity", enabled: true },
                  { title: "Study Reminders", description: "Daily reminders to study", enabled: true },
                  { title: "New Content Alerts", description: "When new lessons are available", enabled: false },
                  { title: "Achievement Notifications", description: "When you earn badges or achievements", enabled: true },
                  { title: "Marketing Emails", description: "News and promotional content", enabled: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-arc-slate-100 last:border-0">
                    <div>
                      <div className="font-medium text-arc-navy-900">{item.title}</div>
                      <div className="text-sm text-arc-slate-500">{item.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.enabled} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-arc-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-arc-orange-500"></div>
                    </label>
                  </div>
                ))}
                <div className="pt-4">
                  <Button>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-900">2FA is enabled</div>
                        <div className="text-sm text-green-700">Your account is protected</div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline">Manage 2FA</Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage devices that are logged into your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { device: "Chrome on Windows", location: "Manila, Philippines", current: true, lastActive: "Now" },
                      { device: "Safari on iPhone", location: "Manila, Philippines", current: false, lastActive: "2 hours ago" },
                      { device: "Firefox on MacOS", location: "Cebu, Philippines", current: false, lastActive: "3 days ago" },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {session.device}
                            {session.current && <Badge variant="info">Current</Badge>}
                          </div>
                          <div className="text-sm text-gray-500">{session.location}</div>
                          <div className="text-xs text-gray-400">Last active: {session.lastActive}</div>
                        </div>
                        {!session.current && (
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how ARATC looks for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light", preview: "bg-white border-2 border-gray-200" },
                      { id: "dark", label: "Dark", preview: "bg-gray-900" },
                      { id: "system", label: "System", preview: "bg-gradient-to-r from-white to-gray-900" },
                    ].map((theme) => (
                      <div key={theme.id}>
                        <input type="radio" id={theme.id} name="theme" className="sr-only" defaultChecked={theme.id === "light"} />
                        <label
                          htmlFor={theme.id}
                          className="flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                        >
                          <div className={`w-20 h-12 rounded ${theme.preview}`} />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium mb-3 block">Accent Color</Label>
                  <div className="flex gap-3">
                    {["bg-blue-600", "bg-purple-600", "bg-green-600", "bg-amber-600", "bg-red-600", "bg-pink-600"].map((color) => (
                      <button
                        key={color}
                        className={`w-10 h-10 rounded-full ${color} ring-2 ring-offset-2 ring-transparent hover:ring-gray-400 ${color === "bg-blue-600" ? "ring-blue-500" : ""}`}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium mb-3 block">Font Size</Label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">A</span>
                    <input type="range" min="14" max="18" defaultValue="16" className="flex-1" />
                    <span className="text-lg text-gray-500">A</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-gradient-to-r from-arc-orange-500 to-arc-orange-600 text-white rounded-xl mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="bg-white/20 text-white mb-2">Premium Plan</Badge>
                        <div className="text-3xl font-bold">₱2,499/year</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-orange-100">Next billing date</div>
                        <div className="font-medium">Dec 31, 2026</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="bg-white text-arc-orange-600 hover:bg-orange-50">
                        Upgrade Plan
                      </Button>
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <div className="font-medium">•••• •••• •••• 4242</div>
                        <div className="text-sm text-gray-500">Expires 12/27</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Change</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: "Dec 31, 2025", amount: "₱2,499.00", status: "Paid" },
                      { date: "Dec 31, 2024", amount: "₱2,299.00", status: "Paid" },
                    ].map((bill, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <div className="font-medium text-sm">{bill.date}</div>
                          <div className="text-xs text-gray-500">{bill.amount}</div>
                        </div>
                        <Badge variant="success" className="text-xs">{bill.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
